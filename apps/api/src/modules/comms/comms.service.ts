import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { CreatePtmScheduleDto } from './dto/create-ptm-schedule.dto';
import { CreatePtmTeacherSlotDto } from './dto/create-ptm-teacher-slot.dto';
import { CreatePtmBookingDto } from './dto/create-ptm-booking.dto';

@Injectable()
export class CommsService {
  constructor(private prisma: PrismaService) {}

  // ─── Notification Templates ───────────────────────────────────

  async listTemplates(
    organizationId: string,
    filters: { eventType?: string; channel?: string; language?: string; status?: string },
  ) {
    return this.prisma.notificationTemplate.findMany({
      where: {
        organizationId,
        ...(filters.eventType ? { eventType: filters.eventType } : {}),
        ...(filters.channel ? { channel: filters.channel } : {}),
        ...(filters.language ? { language: filters.language } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTemplate(organizationId: string, dto: CreateTemplateDto) {
    return this.prisma.notificationTemplate.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description ?? null,
        eventType: dto.eventType,
        channel: dto.channel,
        language: dto.language ?? 'en',
        subject: dto.subject ?? null,
        body: dto.body,
        status: 'ACTIVE',
      },
    });
  }

  async getTemplate(organizationId: string, id: string) {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: { id, organizationId },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async updateTemplate(organizationId: string, id: string, dto: UpdateTemplateDto) {
    await this.getTemplate(organizationId, id);
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.eventType !== undefined ? { eventType: dto.eventType } : {}),
        ...(dto.channel !== undefined ? { channel: dto.channel } : {}),
        ...(dto.language !== undefined ? { language: dto.language } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
      },
    });
  }

  async activateTemplate(organizationId: string, id: string) {
    await this.getTemplate(organizationId, id);
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async deactivateTemplate(organizationId: string, id: string) {
    await this.getTemplate(organizationId, id);
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async deleteTemplate(organizationId: string, id: string) {
    const template = await this.getTemplate(organizationId, id);
    if (template.status === 'ACTIVE') {
      throw new BadRequestException('Deactivate the template before deleting it');
    }
    await this.prisma.notificationTemplate.delete({ where: { id } });
  }

  // ─── Announcements ────────────────────────────────────────────

  async createAnnouncement(organizationId: string, createdBy: string, dto: CreateAnnouncementDto) {
    if (dto.campusId) {
      const campus = await this.prisma.campus.findFirst({
        where: { id: dto.campusId, organizationId, deletedAt: null },
      });
      if (!campus) throw new NotFoundException('Campus not found');
    }

    if (dto.targetClassId) {
      const cls = await this.prisma.academicClass.findFirst({
        where: { id: dto.targetClassId, organizationId },
      });
      if (!cls) throw new NotFoundException('Class not found');
    }

    return this.prisma.announcement.create({
      data: {
        organizationId,
        campusId: dto.campusId ?? null,
        title: dto.title,
        content: dto.content,
        audienceType: dto.audienceType,
        targetClassId: dto.targetClassId ?? null,
        publishAt: dto.publishAt ? new Date(dto.publishAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy,
        status: 'DRAFT',
      },
    });
  }

  async findAnnouncements(
    organizationId: string,
    filters: { status?: string; audienceType?: string; campusId?: string },
  ) {
    return this.prisma.announcement.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.audienceType ? { audienceType: filters.audienceType } : {}),
        ...(filters.campusId ? { campusId: filters.campusId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAnnouncement(organizationId: string, announcementId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, organizationId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async updateAnnouncement(organizationId: string, announcementId: string, dto: UpdateAnnouncementDto) {
    const announcement = await this.findAnnouncement(organizationId, announcementId);

    if (announcement.status === 'PUBLISHED' && dto.status !== 'ARCHIVED') {
      // Allow updating content of published announcements, but not reverting to DRAFT
      if (dto.status === 'DRAFT') {
        throw new BadRequestException('Cannot revert a published announcement to draft');
      }
    }

    return this.prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.audienceType !== undefined ? { audienceType: dto.audienceType } : {}),
        ...(dto.targetClassId !== undefined ? { targetClassId: dto.targetClassId ?? null } : {}),
        ...(dto.publishAt !== undefined
          ? { publishAt: dto.publishAt ? new Date(dto.publishAt) : null }
          : {}),
        ...(dto.expiresAt !== undefined
          ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async publishAnnouncement(organizationId: string, announcementId: string) {
    const announcement = await this.findAnnouncement(organizationId, announcementId);

    if (announcement.status === 'PUBLISHED') {
      throw new BadRequestException('Announcement is already published');
    }
    if (announcement.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot publish an archived announcement');
    }

    return this.prisma.announcement.update({
      where: { id: announcementId },
      data: { status: 'PUBLISHED', publishAt: new Date() },
    });
  }

  async deleteAnnouncement(organizationId: string, announcementId: string) {
    const announcement = await this.findAnnouncement(organizationId, announcementId);

    if (announcement.status === 'PUBLISHED') {
      throw new BadRequestException('Cannot delete a published announcement. Archive it first.');
    }

    await this.prisma.announcement.delete({ where: { id: announcementId } });
  }

  // ─── Notification Rules ───────────────────────────────────────

  async listRules(
    organizationId: string,
    filters: { eventType?: string; isActive?: boolean },
  ) {
    return this.prisma.notificationRule.findMany({
      where: {
        organizationId,
        ...(filters.eventType ? { eventType: filters.eventType } : {}),
        ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(organizationId: string, dto: CreateRuleDto) {
    return this.prisma.notificationRule.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description ?? null,
        eventType: dto.eventType,
        templateId: dto.templateId ?? null,
        audienceType: dto.audienceType,
        audienceTarget: dto.audienceTarget ?? null,
        channels: dto.channels,
        priority: dto.priority ?? 'NORMAL',
        category: dto.category ?? 'GENERAL',
        isActive: dto.isActive ?? true,
        escalateAfterMinutes: dto.escalateAfterMinutes ?? null,
        escalateToType: dto.escalateToType ?? null,
        escalateChannels: dto.escalateChannels ?? [],
      },
    });
  }

  async getRule(organizationId: string, id: string) {
    const rule = await this.prisma.notificationRule.findFirst({
      where: { id, organizationId },
    });
    if (!rule) throw new NotFoundException('Notification rule not found');
    return rule;
  }

  async updateRule(organizationId: string, id: string, dto: UpdateRuleDto) {
    await this.getRule(organizationId, id);
    return this.prisma.notificationRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.eventType !== undefined ? { eventType: dto.eventType } : {}),
        ...(dto.templateId !== undefined ? { templateId: dto.templateId ?? null } : {}),
        ...(dto.audienceType !== undefined ? { audienceType: dto.audienceType } : {}),
        ...(dto.audienceTarget !== undefined ? { audienceTarget: dto.audienceTarget ?? null } : {}),
        ...(dto.channels !== undefined ? { channels: dto.channels } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.escalateAfterMinutes !== undefined ? { escalateAfterMinutes: dto.escalateAfterMinutes ?? null } : {}),
        ...(dto.escalateToType !== undefined ? { escalateToType: dto.escalateToType ?? null } : {}),
        ...(dto.escalateChannels !== undefined ? { escalateChannels: dto.escalateChannels } : {}),
      },
    });
  }

  async toggleRule(organizationId: string, id: string) {
    const rule = await this.getRule(organizationId, id);
    return this.prisma.notificationRule.update({
      where: { id },
      data: { isActive: !rule.isActive },
    });
  }

  async deleteRule(organizationId: string, id: string) {
    await this.getRule(organizationId, id);
    await this.prisma.notificationRule.delete({ where: { id } });
  }

  // ─── Notifications ────────────────────────────────────────────

  async sendNotification(organizationId: string, dto: SendNotificationDto) {
    return this.prisma.notification.create({
      data: {
        organizationId,
        recipientUserId: dto.recipientUserId,
        eventType: dto.eventType,
        category: dto.category ?? 'GENERAL',
        priority: dto.priority ?? 'NORMAL',
        title: dto.title,
        message: dto.message,
        channel: dto.channel,
        status: 'PENDING',
        entityType: dto.entityType ?? null,
        entityId: dto.entityId ?? null,
        actionUrl: dto.actionUrl ?? null,
      },
    });
  }

  async findNotifications(
    organizationId: string,
    filters: { recipientUserId?: string; status?: string; channel?: string; category?: string },
  ) {
    return this.prisma.notification.findMany({
      where: {
        organizationId,
        ...(filters.recipientUserId ? { recipientUserId: filters.recipientUserId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.channel ? { channel: filters.channel } : {}),
        ...(filters.category ? { category: filters.category } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(organizationId: string, recipientUserId: string) {
    const count = await this.prisma.notification.count({
      where: {
        organizationId,
        recipientUserId,
        readAt: null,
        status: { not: 'FAILED' },
      },
    });
    return { count };
  }

  async getNotificationStats(organizationId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [sentToday, delivered, failed, pending, readCount] = await Promise.all([
      this.prisma.notification.count({
        where: { organizationId, createdAt: { gte: todayStart } },
      }),
      this.prisma.notification.count({
        where: { organizationId, status: { in: ['SENT', 'READ'] } },
      }),
      this.prisma.notification.count({
        where: { organizationId, status: 'FAILED' },
      }),
      this.prisma.notification.count({
        where: { organizationId, status: 'PENDING' },
      }),
      this.prisma.notification.count({
        where: { organizationId, status: 'READ' },
      }),
    ]);

    const deliveryBase = delivered + failed;
    const deliveryRate = deliveryBase > 0 ? Math.round((delivered / deliveryBase) * 1000) / 10 : 0;
    const readBase = delivered;
    const readRate = readBase > 0 ? Math.round((readCount / readBase) * 1000) / 10 : 0;

    const unread = await this.prisma.notification.count({
      where: { organizationId, readAt: null, status: 'SENT' },
    });

    return { sentToday, delivered, failed, pending, unread, deliveryRate, readRate };
  }

  async markNotificationRead(organizationId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, organizationId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date(), status: 'READ' },
    });
  }

  // ─── Analytics ────────────────────────────────────────────────

  private sinceDate(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async getAnalyticsOverview(organizationId: string, days = 30) {
    const since = this.sinceDate(days);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [total, sentToday, delivered, failed, read, pending, deliveryAttempts, failedAttempts] =
      await Promise.all([
        this.prisma.notification.count({ where: { organizationId, createdAt: { gte: since } } }),
        this.prisma.notification.count({ where: { organizationId, createdAt: { gte: todayStart } } }),
        this.prisma.notification.count({ where: { organizationId, createdAt: { gte: since }, status: { in: ['SENT', 'READ'] } } }),
        this.prisma.notification.count({ where: { organizationId, createdAt: { gte: since }, status: 'FAILED' } }),
        this.prisma.notification.count({ where: { organizationId, createdAt: { gte: since }, status: 'READ' } }),
        this.prisma.notification.count({ where: { organizationId, createdAt: { gte: since }, status: 'PENDING' } }),
        this.prisma.notificationDelivery.count({ where: { notification: { organizationId }, createdAt: { gte: since } } }),
        this.prisma.notificationDelivery.count({ where: { notification: { organizationId }, createdAt: { gte: since }, status: { in: ['FAILED', 'FAILED_PERMANENTLY'] } } }),
      ]);

    const deliveryBase = delivered + failed;
    const deliveryRate = deliveryBase > 0 ? Math.round((delivered / deliveryBase) * 1000) / 10 : 0;
    const readRate = delivered > 0 ? Math.round((read / delivered) * 1000) / 10 : 0;
    const failureRate = deliveryAttempts > 0 ? Math.round((failedAttempts / deliveryAttempts) * 1000) / 10 : 0;

    return { total, sentToday, delivered, failed, read, pending, deliveryRate, readRate, failureRate, days };
  }

  async getAnalyticsByChannel(organizationId: string, days = 30) {
    const since = this.sinceDate(days);
    const channels = ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH'];

    const results = await Promise.all(
      channels.map(async (channel) => {
        const [total, delivered, failed, read] = await Promise.all([
          this.prisma.notification.count({ where: { organizationId, channel, createdAt: { gte: since } } }),
          this.prisma.notification.count({ where: { organizationId, channel, createdAt: { gte: since }, status: { in: ['SENT', 'READ'] } } }),
          this.prisma.notification.count({ where: { organizationId, channel, createdAt: { gte: since }, status: 'FAILED' } }),
          this.prisma.notification.count({ where: { organizationId, channel, createdAt: { gte: since }, status: 'READ' } }),
        ]);
        const deliveryBase = delivered + failed;
        const deliveryRate = deliveryBase > 0 ? Math.round((delivered / deliveryBase) * 1000) / 10 : 0;
        const readRate = delivered > 0 ? Math.round((read / delivered) * 1000) / 10 : 0;
        return { channel, total, delivered, failed, read, deliveryRate, readRate };
      }),
    );

    return results.filter((r) => r.total > 0);
  }

  async getAnalyticsByEventType(organizationId: string, days = 30) {
    const since = this.sinceDate(days);

    const groups = await this.prisma.notification.groupBy({
      by: ['eventType'],
      where: { organizationId, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { eventType: 'desc' } },
      take: 15,
    });

    return Promise.all(
      groups.map(async (g) => {
        const [delivered, failed, read] = await Promise.all([
          this.prisma.notification.count({ where: { organizationId, eventType: g.eventType, createdAt: { gte: since }, status: { in: ['SENT', 'READ'] } } }),
          this.prisma.notification.count({ where: { organizationId, eventType: g.eventType, createdAt: { gte: since }, status: 'FAILED' } }),
          this.prisma.notification.count({ where: { organizationId, eventType: g.eventType, createdAt: { gte: since }, status: 'READ' } }),
        ]);
        const total = g._count._all;
        const deliveryRate = (delivered + failed) > 0 ? Math.round((delivered / (delivered + failed)) * 1000) / 10 : 0;
        return { eventType: g.eventType, total, delivered, failed, read, deliveryRate };
      }),
    );
  }

  async getAnalyticsByCategory(organizationId: string, days = 30) {
    const since = this.sinceDate(days);

    const groups = await this.prisma.notification.groupBy({
      by: ['category'],
      where: { organizationId, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { category: 'desc' } },
    });

    const total = groups.reduce((s, g) => s + g._count._all, 0);
    return groups.map((g) => ({
      category: g.category,
      count: g._count._all,
      pct: total > 0 ? Math.round((g._count._all / total) * 1000) / 10 : 0,
    }));
  }

  async getAnalyticsTimeline(organizationId: string, days = 30) {
    const since = this.sinceDate(days);

    // Build date buckets
    const buckets: Record<string, { date: string; sent: number; failed: number; read: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key, sent: 0, failed: 0, read: 0 };
    }

    const notifications = await this.prisma.notification.findMany({
      where: { organizationId, createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    });

    for (const n of notifications) {
      const key = n.createdAt.toISOString().slice(0, 10);
      if (!buckets[key]) continue;
      if (['SENT', 'READ'].includes(n.status)) buckets[key].sent++;
      if (n.status === 'FAILED') buckets[key].failed++;
      if (n.status === 'READ') buckets[key].read++;
    }

    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getAnalyticsFailures(organizationId: string, days = 30) {
    const since = this.sinceDate(days);

    // Top error messages
    const errorGroups = await this.prisma.notificationDelivery.groupBy({
      by: ['errorMessage'],
      where: {
        notification: { organizationId },
        createdAt: { gte: since },
        errorMessage: { not: null },
        status: { in: ['FAILED', 'FAILED_PERMANENTLY'] },
      },
      _count: { _all: true },
      orderBy: { _count: { errorMessage: 'desc' } },
      take: 10,
    });

    // Permanently failed deliveries
    const permanentFails = await this.prisma.notificationDelivery.count({
      where: { notification: { organizationId }, createdAt: { gte: since }, status: 'FAILED_PERMANENTLY' },
    });

    // Channels with most failures
    const channelGroups = await this.prisma.notification.groupBy({
      by: ['channel'],
      where: { organizationId, createdAt: { gte: since }, status: 'FAILED' },
      _count: { _all: true },
      orderBy: { _count: { channel: 'desc' } },
    });

    return {
      permanentFails,
      topErrors: errorGroups.map((g) => ({ message: g.errorMessage, count: g._count._all })),
      byChannel: channelGroups.map((g) => ({ channel: g.channel, count: g._count._all })),
    };
  }

  // ─── Preferences ──────────────────────────────────────────────

  async getPreferences(organizationId: string, userId: string) {
    const existing = await this.prisma.notificationPreference.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (existing) return existing;

    // Auto-create with defaults on first access
    return this.prisma.notificationPreference.create({
      data: { organizationId, userId },
    });
  }

  async updatePreferences(
    organizationId: string,
    userId: string,
    dto: {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      whatsappEnabled?: boolean;
      pushEnabled?: boolean;
      language?: string;
      quietHoursEnabled?: boolean;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
      quietDays?: string[];
      mutedCategories?: string[];
    },
  ) {
    await this.getPreferences(organizationId, userId); // ensure row exists
    return this.prisma.notificationPreference.update({
      where: { organizationId_userId: { organizationId, userId } },
      data: {
        ...(dto.inAppEnabled !== undefined ? { inAppEnabled: dto.inAppEnabled } : {}),
        ...(dto.emailEnabled !== undefined ? { emailEnabled: dto.emailEnabled } : {}),
        ...(dto.smsEnabled !== undefined ? { smsEnabled: dto.smsEnabled } : {}),
        ...(dto.whatsappEnabled !== undefined ? { whatsappEnabled: dto.whatsappEnabled } : {}),
        ...(dto.pushEnabled !== undefined ? { pushEnabled: dto.pushEnabled } : {}),
        ...(dto.language !== undefined ? { language: dto.language } : {}),
        ...(dto.quietHoursEnabled !== undefined ? { quietHoursEnabled: dto.quietHoursEnabled } : {}),
        ...(dto.quietHoursStart !== undefined ? { quietHoursStart: dto.quietHoursStart ?? null } : {}),
        ...(dto.quietHoursEnd !== undefined ? { quietHoursEnd: dto.quietHoursEnd ?? null } : {}),
        ...(dto.quietDays !== undefined ? { quietDays: dto.quietDays } : {}),
        ...(dto.mutedCategories !== undefined ? { mutedCategories: dto.mutedCategories } : {}),
      },
    });
  }

  async markAllNotificationsRead(organizationId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { organizationId, recipientUserId: userId, readAt: null },
      data: { readAt: new Date(), status: 'READ' },
    });
    return { updated: result.count };
  }

  // ─── Delivery Logs ────────────────────────────────────────────

  async listDeliveries(
    organizationId: string,
    filters: { status?: string; channel?: string; from?: string; to?: string },
    page = 1,
    limit = 50,
  ) {
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {
      notification: { organizationId },
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.channel ? { notification: { organizationId, channel: filters.channel } } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.notificationDelivery.count({ where }),
      this.prisma.notificationDelivery.findMany({
        where,
        include: {
          notification: {
            select: {
              id: true,
              title: true,
              eventType: true,
              channel: true,
              category: true,
              priority: true,
              recipientUserId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { total, page, limit, items };
  }

  async getDeliveryStats(organizationId: string) {
    const statuses = ['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'RETRYING', 'FAILED_PERMANENTLY'];

    const counts = await Promise.all(
      statuses.map((status) =>
        this.prisma.notificationDelivery.count({
          where: { status, notification: { organizationId } },
        }),
      ),
    );

    const result: Record<string, number> = {};
    statuses.forEach((s, i) => { result[s.toLowerCase()] = counts[i] ?? 0; });

    const total = counts.reduce((a, b) => a + b, 0);
    const succeeded = (result['sent'] ?? 0) + (result['delivered'] ?? 0);
    result['successRate'] = total > 0 ? Math.round((succeeded / total) * 1000) / 10 : 0;

    return result;
  }

  async retryDelivery(organizationId: string, deliveryId: string) {
    const delivery = await this.prisma.notificationDelivery.findFirst({
      where: { id: deliveryId, notification: { organizationId } },
    });
    if (!delivery) throw new NotFoundException('Delivery record not found');
    if (!['FAILED', 'FAILED_PERMANENTLY'].includes(delivery.status)) {
      throw new BadRequestException('Only FAILED or FAILED_PERMANENTLY deliveries can be retried');
    }

    return this.prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'FAILED',
        retryCount: 0,
        nextRetryAt: new Date(),
        errorMessage: null,
      },
    });
  }

  async bulkRetryFailed(organizationId: string) {
    const result = await this.prisma.notificationDelivery.updateMany({
      where: {
        status: { in: ['FAILED', 'FAILED_PERMANENTLY'] },
        notification: { organizationId },
      },
      data: {
        status: 'FAILED',
        retryCount: 0,
        nextRetryAt: new Date(),
      },
    });
    return { queued: result.count };
  }

  // ─── Provider Config ──────────────────────────────────────────

  async listProviderConfigs(organizationId: string) {
    return this.prisma.notificationProviderConfig.findMany({
      where: { organizationId },
      orderBy: [{ channel: 'asc' }, { priority: 'asc' }],
    });
  }

  async upsertProviderConfig(
    organizationId: string,
    channel: string,
    providerName: string,
    isEnabled: boolean,
    priority?: number,
  ) {
    return this.prisma.notificationProviderConfig.upsert({
      where: {
        organizationId_channel_providerName: { organizationId, channel, providerName },
      },
      create: {
        organizationId,
        channel,
        providerName,
        isEnabled,
        priority: priority ?? 1,
      },
      update: {
        isEnabled,
        ...(priority !== undefined ? { priority } : {}),
      },
    });
  }

  // ─── PTM Schedules ────────────────────────────────────────────

  async createPtmSchedule(organizationId: string, createdBy: string, dto: CreatePtmScheduleDto) {
    const campus = await this.prisma.campus.findFirst({
      where: { id: dto.campusId, organizationId, deletedAt: null },
    });
    if (!campus) throw new NotFoundException('Campus not found');

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, organizationId },
    });
    if (!academicYear) throw new NotFoundException('Academic year not found');

    return this.prisma.ptmSchedule.create({
      data: {
        organizationId,
        campusId: dto.campusId,
        academicYearId: dto.academicYearId,
        name: dto.name,
        date: new Date(dto.date),
        slotDurationMinutes: dto.slotDurationMinutes ?? 15,
        createdBy,
        status: 'DRAFT',
      },
      include: { teacherSlots: true, bookings: true },
    });
  }

  async findPtmSchedules(organizationId: string, filters: { campusId?: string; academicYearId?: string }) {
    return this.prisma.ptmSchedule.findMany({
      where: {
        organizationId,
        ...(filters.campusId ? { campusId: filters.campusId } : {}),
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      },
      include: {
        _count: { select: { teacherSlots: true, bookings: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findPtmSchedule(organizationId: string, scheduleId: string) {
    const schedule = await this.prisma.ptmSchedule.findFirst({
      where: { id: scheduleId, organizationId },
      include: {
        teacherSlots: {
          include: { ptmSchedule: false },
          orderBy: { startTime: 'asc' },
        },
        bookings: {
          orderBy: { slotStart: 'asc' },
        },
      },
    });
    if (!schedule) throw new NotFoundException('PTM schedule not found');
    return schedule;
  }

  async publishPtmSchedule(organizationId: string, scheduleId: string) {
    const schedule = await this.findPtmSchedule(organizationId, scheduleId);

    if (schedule.status !== 'DRAFT') {
      throw new BadRequestException(`PTM schedule is already ${schedule.status.toLowerCase()}`);
    }

    const slotCount = await this.prisma.ptmTeacherSlot.count({
      where: { ptmScheduleId: scheduleId },
    });
    if (slotCount === 0) {
      throw new BadRequestException('Cannot publish a PTM schedule with no teacher slots');
    }

    return this.prisma.ptmSchedule.update({
      where: { id: scheduleId },
      data: { status: 'PUBLISHED' },
    });
  }

  // ─── PTM Teacher Slots ────────────────────────────────────────

  async addTeacherSlot(organizationId: string, scheduleId: string, dto: CreatePtmTeacherSlotDto) {
    const schedule = await this.findPtmSchedule(organizationId, scheduleId);

    if (schedule.status !== 'DRAFT') {
      throw new BadRequestException('Can only add slots to a DRAFT PTM schedule');
    }

    const teacher = await this.prisma.employee.findFirst({
      where: { id: dto.teacherId, organizationId, deletedAt: null },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const startTime = this.parseTime(dto.startTime);
    const endTime = this.parseTime(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    return this.prisma.ptmTeacherSlot.create({
      data: {
        ptmScheduleId: scheduleId,
        teacherId: dto.teacherId,
        startTime,
        endTime,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  async findTeacherSlots(organizationId: string, scheduleId: string) {
    await this.findPtmSchedule(organizationId, scheduleId);

    return this.prisma.ptmTeacherSlot.findMany({
      where: { ptmScheduleId: scheduleId },
      include: {
        ptmSchedule: false,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async deleteTeacherSlot(organizationId: string, scheduleId: string, slotId: string) {
    const schedule = await this.findPtmSchedule(organizationId, scheduleId);

    if (schedule.status !== 'DRAFT') {
      throw new BadRequestException('Can only remove slots from a DRAFT PTM schedule');
    }

    const slot = await this.prisma.ptmTeacherSlot.findFirst({
      where: { id: slotId, ptmScheduleId: scheduleId },
    });
    if (!slot) throw new NotFoundException('Teacher slot not found');

    await this.prisma.ptmTeacherSlot.delete({ where: { id: slotId } });
  }

  // ─── PTM Bookings ─────────────────────────────────────────────

  async createBooking(organizationId: string, scheduleId: string, dto: CreatePtmBookingDto) {
    const schedule = await this.findPtmSchedule(organizationId, scheduleId);

    if (schedule.status !== 'PUBLISHED') {
      throw new BadRequestException('Bookings can only be made for PUBLISHED PTM schedules');
    }

    const slotStart = new Date(dto.slotStart);
    const slotEnd = new Date(dto.slotEnd);

    // Check for duplicate booking (same teacher + same slot start)
    const duplicate = await this.prisma.ptmBooking.findUnique({
      where: {
        ptmScheduleId_teacherId_slotStart: {
          ptmScheduleId: scheduleId,
          teacherId: dto.teacherId,
          slotStart,
        },
      },
    });
    if (duplicate) {
      throw new ConflictException('This slot is already booked');
    }

    // Check guardian does not have overlapping booking
    const guardianConflict = await this.prisma.ptmBooking.findFirst({
      where: {
        ptmScheduleId: scheduleId,
        guardianId: dto.guardianId,
        status: 'BOOKED',
        slotStart: { lt: slotEnd },
        slotEnd: { gt: slotStart },
      },
    });
    if (guardianConflict) {
      throw new ConflictException('Guardian already has a booking that overlaps this slot');
    }

    return this.prisma.ptmBooking.create({
      data: {
        ptmScheduleId: scheduleId,
        teacherId: dto.teacherId,
        studentId: dto.studentId,
        guardianId: dto.guardianId,
        slotStart,
        slotEnd,
        status: 'BOOKED',
      },
    });
  }

  async findBookings(organizationId: string, scheduleId: string, filters: { teacherId?: string; guardianId?: string }) {
    await this.findPtmSchedule(organizationId, scheduleId);

    return this.prisma.ptmBooking.findMany({
      where: {
        ptmScheduleId: scheduleId,
        ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
        ...(filters.guardianId ? { guardianId: filters.guardianId } : {}),
      },
      orderBy: { slotStart: 'asc' },
    });
  }

  async cancelBooking(organizationId: string, scheduleId: string, bookingId: string) {
    await this.findPtmSchedule(organizationId, scheduleId);

    const booking = await this.prisma.ptmBooking.findFirst({
      where: { id: bookingId, ptmScheduleId: scheduleId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    return this.prisma.ptmBooking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });
  }

  // ─── Notification Schedules ───────────────────────────────────

  async listSchedules(
    organizationId: string,
    filters: { recurrence?: string; isActive?: boolean },
  ) {
    return this.prisma.notificationSchedule.findMany({
      where: {
        organizationId,
        ...(filters.recurrence ? { recurrence: filters.recurrence } : {}),
        ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSchedule(
    organizationId: string,
    dto: {
      name: string;
      description?: string;
      recurrence: string;
      scheduledAt?: string;
      cronExpression?: string;
      title: string;
      message: string;
      audienceType: string;
      audienceTarget?: string;
      templateId?: string;
      channels: string[];
      priority?: string;
      category?: string;
    },
  ) {
    const nextRunAt = this.computeNextRunAt(dto.recurrence, dto.scheduledAt, dto.cronExpression);
    return this.prisma.notificationSchedule.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description ?? null,
        recurrence: dto.recurrence,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        cronExpression: dto.cronExpression ?? null,
        nextRunAt,
        title: dto.title,
        message: dto.message,
        audienceType: dto.audienceType,
        audienceTarget: dto.audienceTarget ?? null,
        templateId: dto.templateId ?? null,
        channels: dto.channels,
        priority: dto.priority ?? 'NORMAL',
        category: dto.category ?? 'GENERAL',
        isActive: true,
      },
    });
  }

  async getSchedule(organizationId: string, id: string) {
    const schedule = await this.prisma.notificationSchedule.findFirst({
      where: { id, organizationId },
    });
    if (!schedule) throw new NotFoundException('Notification schedule not found');
    return schedule;
  }

  async updateSchedule(
    organizationId: string,
    id: string,
    dto: {
      name?: string;
      description?: string;
      recurrence?: string;
      scheduledAt?: string;
      cronExpression?: string;
      title?: string;
      message?: string;
      audienceType?: string;
      audienceTarget?: string;
      templateId?: string;
      channels?: string[];
      priority?: string;
      category?: string;
      isActive?: boolean;
    },
  ) {
    const existing = await this.getSchedule(organizationId, id);
    const recurrence = dto.recurrence ?? existing.recurrence;
    const scheduledAt = dto.scheduledAt !== undefined ? dto.scheduledAt : existing.scheduledAt?.toISOString();
    const cronExpression = dto.cronExpression !== undefined ? dto.cronExpression : (existing.cronExpression ?? undefined);
    const nextRunAt = this.computeNextRunAt(recurrence, scheduledAt ?? undefined, cronExpression);

    return this.prisma.notificationSchedule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.recurrence !== undefined ? { recurrence: dto.recurrence } : {}),
        ...(dto.scheduledAt !== undefined ? { scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null } : {}),
        ...(dto.cronExpression !== undefined ? { cronExpression: dto.cronExpression ?? null } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.message !== undefined ? { message: dto.message } : {}),
        ...(dto.audienceType !== undefined ? { audienceType: dto.audienceType } : {}),
        ...(dto.audienceTarget !== undefined ? { audienceTarget: dto.audienceTarget ?? null } : {}),
        ...(dto.templateId !== undefined ? { templateId: dto.templateId ?? null } : {}),
        ...(dto.channels !== undefined ? { channels: dto.channels } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        nextRunAt,
      },
    });
  }

  async toggleSchedule(organizationId: string, id: string) {
    const schedule = await this.getSchedule(organizationId, id);
    return this.prisma.notificationSchedule.update({
      where: { id },
      data: { isActive: !schedule.isActive },
    });
  }

  async deleteSchedule(organizationId: string, id: string) {
    await this.getSchedule(organizationId, id);
    await this.prisma.notificationSchedule.delete({ where: { id } });
  }

  private computeNextRunAt(
    recurrence: string,
    scheduledAt?: string,
    cronExpression?: string,
  ): Date | null {
    const now = new Date();

    switch (recurrence) {
      case 'ONCE':
        return scheduledAt ? new Date(scheduledAt) : null;
      case 'DAILY': {
        const next = scheduledAt ? new Date(scheduledAt) : new Date(now);
        if (next <= now) next.setDate(next.getDate() + 1);
        return next;
      }
      case 'WEEKLY': {
        const next = scheduledAt ? new Date(scheduledAt) : new Date(now);
        if (next <= now) next.setDate(next.getDate() + 7);
        return next;
      }
      case 'MONTHLY': {
        const next = scheduledAt ? new Date(scheduledAt) : new Date(now);
        if (next <= now) next.setMonth(next.getMonth() + 1);
        return next;
      }
      default:
        // For CRON type — set a sentinel; ScheduledNotificationService handles proper next-run
        return new Date(now.getTime() + 60_000);
    }
  }

  // ─── Inbound Messages ─────────────────────────────────────────

  async listInboundMessages(
    organizationId: string,
    filters: { channel?: string; status?: string },
    page = 1,
    limit = 50,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      organizationId,
      ...(filters.channel ? { channel: filters.channel } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.inboundMessage.count({ where }),
      this.prisma.inboundMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return { total, page, limit, items };
  }

  async receiveInbound(
    organizationId: string,
    dto: {
      channel: string;
      fromAddress: string;
      body: string;
      providerMsgId?: string;
    },
  ) {
    return this.prisma.inboundMessage.create({
      data: {
        organizationId,
        channel: dto.channel,
        fromAddress: dto.fromAddress,
        body: dto.body,
        providerMsgId: dto.providerMsgId ?? null,
        status: 'RECEIVED',
      },
    });
  }

  async markInboundProcessed(organizationId: string, id: string) {
    const msg = await this.prisma.inboundMessage.findFirst({ where: { id, organizationId } });
    if (!msg) throw new NotFoundException('Inbound message not found');
    return this.prisma.inboundMessage.update({
      where: { id },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────

  private parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(1970, 0, 1, hours, minutes, 0);
  }
}
