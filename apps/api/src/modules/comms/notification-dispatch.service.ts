import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { createHash } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { NotificationProviderService } from './notification-provider.service';

export interface NotificationDispatchEvent {
  eventType: string;
  organizationId: string;
  /** ID of the primary entity (employee, student, etc.) relevant to this event */
  subjectId?: string;
  /** Human-readable values for template variable substitution */
  payload: Record<string, string>;
}

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerService: NotificationProviderService,
  ) {}

  @OnEvent('notification.dispatch', { async: true })
  async handleDispatch(event: NotificationDispatchEvent) {
    try {
      await this.dispatch(event);
    } catch (err) {
      this.logger.error(`Failed to dispatch notification for event ${event.eventType}: ${err}`);
    }
  }

  private async dispatch(event: NotificationDispatchEvent) {
    const { eventType, organizationId, subjectId, payload } = event;

    // 1. Find all active rules matching this event type
    const rules = await this.prisma.notificationRule.findMany({
      where: { organizationId, eventType, isActive: true },
    });

    if (rules.length === 0) return;

    for (const rule of rules) {
      // 2. Resolve template body (if linked)
      const templateBodies = await this.resolveTemplates(organizationId, rule, payload);

      // 3. Resolve recipients (audienceTarget overrides subjectId for targeted types)
      const target = rule.audienceTarget ?? subjectId;
      const recipientUserIds = await this.resolveAudience(organizationId, rule.audienceType, target);

      if (recipientUserIds.length === 0) {
        this.logger.warn(`Rule ${rule.id} resolved 0 recipients for event ${eventType}`);
        continue;
      }

      // 4. Resolve provider name per channel
      const providerMap = await this.resolveProviders(organizationId, rule.channels);

      // 5. Create Notification + NotificationDelivery per recipient per channel
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();

      for (const userId of recipientUserIds) {
        // Load user preferences (cached per userId within this dispatch call)
        const prefs = await this.loadPreferences(organizationId, userId);

        for (const channel of rule.channels) {
          // Preference gate — URGENT and SYSTEM always bypass
          const bypassPrefs = ['URGENT'].includes(rule.priority) || ['SYSTEM'].includes(rule.category);
          if (!bypassPrefs) {
            if (!this.isChannelAllowed(channel, prefs)) {
              this.logger.debug(`Skipping ${channel} for ${userId} — channel opted out`);
              continue;
            }
            if (this.isCategoryMuted(rule.category, prefs)) {
              this.logger.debug(`Skipping ${rule.category} for ${userId} — category muted`);
              continue;
            }
            if (this.isQuietHours(now, prefs)) {
              this.logger.debug(`Skipping ${channel} for ${userId} — quiet hours`);
              continue;
            }
          }

          const resolved = templateBodies[channel] ?? templateBodies['default'];
          const title = resolved?.title ?? rule.eventType.replace(/_/g, ' ');
          const body = resolved?.body ?? '';
          const providerName = providerMap[channel] ?? channel.toLowerCase();

          // Idempotency: one notification per event+subject+user+channel per day
          const idempotencyKey = this.buildIdempotencyKey(
            eventType, subjectId ?? '', userId, channel, today,
          );

          // Skip if already sent today
          const existing = await this.prisma.notification.findUnique({
            where: { idempotencyKey },
          });
          if (existing) {
            this.logger.debug(`Skipping duplicate: ${idempotencyKey}`);
            continue;
          }

          const isInApp = channel === 'IN_APP';

          const notification = await this.prisma.notification.create({
            data: {
              organizationId,
              recipientUserId: userId,
              eventType,
              category: rule.category,
              priority: rule.priority,
              title,
              message: body,
              channel,
              status: isInApp ? 'SENT' : 'PENDING',
              idempotencyKey,
              ...(isInApp ? { sentAt: new Date() } : {}),
            },
          });

          if (isInApp) {
            // IN_APP is already stored in the notification record — no external call
            continue;
          }

          // Create delivery record and attempt send
          const delivery = await this.prisma.notificationDelivery.create({
            data: {
              notificationId: notification.id,
              provider: providerName,
              status: 'QUEUED',
            },
          });

          await this.attemptSend(notification.id, delivery.id, channel, userId, title, body, providerName);
        }
      }
    }
  }

  private async attemptSend(
    notificationId: string,
    deliveryId: string,
    channel: string,
    recipientUserId: string,
    title: string,
    body: string,
    providerName: string,
  ) {
    try {
      const result = await this.providerService.send(channel, recipientUserId, title, body, providerName);

      if (result.success) {
        await this.prisma.notificationDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'SENT',
            providerMessageId: result.providerMessageId ?? null,
            sentAt: new Date(),
          },
        });
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: { status: 'SENT', sentAt: new Date() },
        });
      } else {
        await this.markInitialFail(deliveryId, result.errorMessage);
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: { status: 'FAILED' },
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await this.markInitialFail(deliveryId, message);
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED' },
      });
    }
  }

  private async markInitialFail(deliveryId: string, errorMessage?: string) {
    // First failure: retry in 30 seconds
    const nextRetryAt = new Date(Date.now() + 30_000);
    await this.prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'FAILED',
        errorMessage: errorMessage ?? null,
        retryCount: 0,
        nextRetryAt,
      },
    });
  }

  // ─── Provider resolution ──────────────────────────────────────

  private async resolveProviders(
    organizationId: string,
    channels: string[],
  ): Promise<Record<string, string>> {
    const configs = await this.prisma.notificationProviderConfig.findMany({
      where: { organizationId, channel: { in: channels }, isEnabled: true },
      orderBy: { priority: 'asc' },
    });

    const map: Record<string, string> = {};
    for (const config of configs) {
      if (!map[config.channel]) {
        map[config.channel] = config.providerName;
      }
    }
    return map;
  }

  // ─── Preference helpers ───────────────────────────────────────

  private async loadPreferences(organizationId: string, userId: string) {
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    // Return defaults if no preference record exists yet
    return prefs ?? {
      inAppEnabled: true, emailEnabled: true, smsEnabled: false,
      whatsappEnabled: false, pushEnabled: false,
      quietHoursEnabled: false, quietHoursStart: null, quietHoursEnd: null,
      quietDays: [] as string[], mutedCategories: [] as string[],
    };
  }

  private isChannelAllowed(
    channel: string,
    prefs: { inAppEnabled: boolean; emailEnabled: boolean; smsEnabled: boolean; whatsappEnabled: boolean; pushEnabled: boolean },
  ): boolean {
    const map: Record<string, boolean> = {
      IN_APP: prefs.inAppEnabled,
      EMAIL: prefs.emailEnabled,
      SMS: prefs.smsEnabled,
      WHATSAPP: prefs.whatsappEnabled,
      PUSH: prefs.pushEnabled,
    };
    return map[channel] ?? true;
  }

  private isCategoryMuted(category: string, prefs: { mutedCategories: string[] }): boolean {
    return prefs.mutedCategories.includes(category);
  }

  private isQuietHours(
    now: Date,
    prefs: { quietHoursEnabled: boolean; quietHoursStart: string | null; quietHoursEnd: string | null; quietDays: string[] },
  ): boolean {
    if (!prefs.quietHoursEnabled) return false;

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = days[now.getDay()];
    if (prefs.quietDays.length > 0 && dayName && prefs.quietDays.includes(dayName)) return true;

    if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

    const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
    const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = (startH ?? 0) * 60 + (startM ?? 0);
    const endMinutes = (endH ?? 0) * 60 + (endM ?? 0);

    // Handle overnight quiet hours (e.g. 22:00 → 07:00)
    if (startMinutes > endMinutes) {
      return nowMinutes >= startMinutes || nowMinutes < endMinutes;
    }
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }

  // ─── Idempotency ──────────────────────────────────────────────

  private buildIdempotencyKey(
    eventType: string,
    subjectId: string,
    recipientUserId: string,
    channel: string,
    date: string,
  ): string {
    return createHash('sha256')
      .update(`${eventType}:${subjectId}:${recipientUserId}:${channel}:${date}`)
      .digest('hex')
      .slice(0, 64);
  }

  // ─── Template resolution ──────────────────────────────────────

  private async resolveTemplates(
    organizationId: string,
    rule: { templateId: string | null; eventType: string },
    payload: Record<string, string>,
  ): Promise<Record<string, { title: string; body: string }>> {
    const defaultTitle = rule.eventType.replace(/_/g, ' ');
    const defaultBody = Object.entries(payload)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');

    const fallback = { title: defaultTitle, body: defaultBody };

    if (!rule.templateId) return { default: fallback };

    const template = await this.prisma.notificationTemplate.findFirst({
      where: { id: rule.templateId, organizationId, status: 'ACTIVE' },
    });

    if (!template) return { default: fallback };

    const rendered = {
      title: template.subject ?? defaultTitle,
      body: this.interpolate(template.body, payload),
    };

    return { [template.channel]: rendered, default: rendered };
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
  }

  // ─── Audience resolution ──────────────────────────────────────

  private async resolveAudience(
    organizationId: string,
    audienceType: string,
    target?: string,
  ): Promise<string[]> {
    switch (audienceType) {
      case 'EMPLOYEE':
        return this.resolveEmployeeUser(organizationId, target);
      case 'ALL_EMPLOYEES':
        return this.resolveAllEmployeeUsers(organizationId);
      case 'STUDENT_GUARDIANS':
        return this.resolveStudentGuardianUsers(organizationId, target);
      case 'DEPARTMENT':
        return this.resolveDepartmentUsers(organizationId, target);
      case 'CLASS':
        return this.resolveClassGuardianUsers(organizationId, target);
      case 'SECTION':
        return this.resolveSectionGuardianUsers(organizationId, target);
      case 'CAMPUS_EMPLOYEES':
        return this.resolveCampusEmployeeUsers(organizationId, target);
      case 'ROLE_MEMBERS':
        return this.resolveRoleMemberUsers(organizationId, target);
      default:
        this.logger.warn(`Unknown audienceType: ${audienceType}`);
        return [];
    }
  }

  private async resolveEmployeeUser(organizationId: string, employeeId?: string): Promise<string[]> {
    if (!employeeId) return [];
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { personId: true },
    });
    if (!employee?.personId) return [];
    const user = await this.prisma.user.findFirst({
      where: { personId: employee.personId, organizationId },
      select: { id: true },
    });
    return user ? [user.id] : [];
  }

  private async resolveAllEmployeeUsers(organizationId: string): Promise<string[]> {
    const employees = await this.prisma.employee.findMany({
      where: { organizationId, employmentStatus: 'ACTIVE', deletedAt: null },
      select: { personId: true },
    });
    const personIds = employees.map((e) => e.personId).filter(Boolean) as string[];
    if (personIds.length === 0) return [];
    const users = await this.prisma.user.findMany({
      where: { personId: { in: personIds }, organizationId },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async resolveStudentGuardianUsers(organizationId: string, studentId?: string): Promise<string[]> {
    if (!studentId) return [];
    const links = await this.prisma.studentGuardian.findMany({
      where: { studentId, canReceiveNotifications: true },
      include: { guardian: { select: { personId: true } } },
    });
    const personIds = links.map((l) => l.guardian?.personId).filter(Boolean) as string[];
    if (personIds.length === 0) return [];
    const users = await this.prisma.user.findMany({
      where: { personId: { in: personIds }, organizationId },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async resolveDepartmentUsers(organizationId: string, departmentId?: string): Promise<string[]> {
    if (!departmentId) return [];
    const employees = await this.prisma.employee.findMany({
      where: { organizationId, departmentId, employmentStatus: 'ACTIVE', deletedAt: null },
      select: { personId: true },
    });
    const personIds = employees.map((e) => e.personId).filter(Boolean) as string[];
    if (personIds.length === 0) return [];
    const users = await this.prisma.user.findMany({
      where: { personId: { in: personIds }, organizationId },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async resolveClassGuardianUsers(organizationId: string, classId?: string): Promise<string[]> {
    if (!classId) return [];
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { classId, status: 'ACTIVE' },
      select: { studentId: true },
    });
    if (enrollments.length === 0) return [];
    const studentIds = enrollments.map((e) => e.studentId);
    const allIds: string[] = [];
    for (const studentId of studentIds) {
      const ids = await this.resolveStudentGuardianUsers(organizationId, studentId);
      allIds.push(...ids);
    }
    return [...new Set(allIds)];
  }

  private async resolveSectionGuardianUsers(organizationId: string, sectionId?: string): Promise<string[]> {
    if (!sectionId) return [];
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { sectionId, status: 'ACTIVE' },
      select: { studentId: true },
    });
    if (enrollments.length === 0) return [];
    const studentIds = enrollments.map((e) => e.studentId);
    const allIds: string[] = [];
    for (const studentId of studentIds) {
      const ids = await this.resolveStudentGuardianUsers(organizationId, studentId);
      allIds.push(...ids);
    }
    return [...new Set(allIds)];
  }

  private async resolveCampusEmployeeUsers(organizationId: string, campusId?: string): Promise<string[]> {
    if (!campusId) return [];
    const employees = await this.prisma.employee.findMany({
      where: { organizationId, campusId, employmentStatus: 'ACTIVE', deletedAt: null },
      select: { personId: true },
    });
    const personIds = employees.map((e) => e.personId).filter(Boolean) as string[];
    if (personIds.length === 0) return [];
    const users = await this.prisma.user.findMany({
      where: { personId: { in: personIds }, organizationId },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async resolveRoleMemberUsers(organizationId: string, roleId?: string): Promise<string[]> {
    if (!roleId) return [];
    // UserRole is in iam schema — use raw query via $queryRawUnsafe to cross schema
    const rows = await this.prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT DISTINCT user_id
      FROM "iam"."user_roles"
      WHERE role_id = ${roleId}
    `;
    if (rows.length === 0) return [];
    const userIds = rows.map((r) => r.user_id);
    // Verify users belong to this org
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, organizationId },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  // ─── Public dispatch helper (used by ScheduledNotificationService) ───

  async dispatchDirect(
    organizationId: string,
    payload: {
      title: string;
      message: string;
      audienceType: string;
      audienceTarget: string | null;
      channels: string[];
      priority: string;
      category: string;
      eventType: string;
    },
  ) {
    const { title, message, audienceType, audienceTarget, channels, priority, category, eventType } = payload;
    const recipientUserIds = await this.resolveAudience(organizationId, audienceType, audienceTarget ?? undefined);
    if (recipientUserIds.length === 0) return;

    const providerMap = await this.resolveProviders(organizationId, channels);
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();

    for (const userId of recipientUserIds) {
      const prefs = await this.loadPreferences(organizationId, userId);

      for (const channel of channels) {
        const bypassPrefs = ['URGENT'].includes(priority) || ['SYSTEM'].includes(category);
        if (!bypassPrefs) {
          if (!this.isChannelAllowed(channel, prefs)) continue;
          if (this.isCategoryMuted(category, prefs)) continue;
          if (this.isQuietHours(now, prefs)) continue;
        }

        const providerName = providerMap[channel] ?? channel.toLowerCase();
        const idempotencyKey = this.buildIdempotencyKey(eventType, 'scheduled', userId, channel, today);

        const existing = await this.prisma.notification.findUnique({ where: { idempotencyKey } });
        if (existing) continue;

        const isInApp = channel === 'IN_APP';
        const notification = await this.prisma.notification.create({
          data: {
            organizationId,
            recipientUserId: userId,
            eventType,
            category,
            priority,
            title,
            message,
            channel,
            status: isInApp ? 'SENT' : 'PENDING',
            idempotencyKey,
            ...(isInApp ? { sentAt: new Date() } : {}),
          },
        });

        if (isInApp) continue;

        const delivery = await this.prisma.notificationDelivery.create({
          data: { notificationId: notification.id, provider: providerName, status: 'QUEUED' },
        });
        await this.attemptSend(notification.id, delivery.id, channel, userId, title, message, providerName);
      }
    }
  }
}
