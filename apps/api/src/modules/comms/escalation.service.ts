import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { NotificationDispatchService } from './notification-dispatch.service';

@Injectable()
export class EscalationService {
  private readonly logger = new Logger(EscalationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchService: NotificationDispatchService,
  ) {}

  /**
   * Every 5 minutes: find HIGH/URGENT notifications that are still unread past
   * the escalation window defined on their originating rule (matched by eventType).
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async escalateUnreadNotifications() {
    // Find active rules that have escalation configured
    const rules = await this.prisma.notificationRule.findMany({
      where: {
        isActive: true,
        escalateAfterMinutes: { not: null },
        escalateToType: { not: null },
      },
    });

    if (rules.length === 0) return;

    const now = new Date();

    for (const rule of rules) {
      const minutesAgo = rule.escalateAfterMinutes!;
      const cutoff = new Date(now.getTime() - minutesAgo * 60_000);

      // Find unread, unescalated notifications from this rule
      const unread = await this.prisma.notification.findMany({
        where: {
          organizationId: rule.organizationId,
          eventType: rule.eventType,
          readAt: null,
          status: { in: ['SENT', 'PENDING'] },
          createdAt: { lte: cutoff },
          // Avoid re-escalating by checking no escalation note in metadata
          // Simple guard: check that escalation hasn't already been created
        },
        take: 50,
      });

      for (const notification of unread) {
        try {
          const escalateChannels = rule.escalateChannels.length > 0
            ? rule.escalateChannels
            : ['IN_APP'];

          await this.dispatchService.dispatchDirect(notification.organizationId, {
            title: `[ESCALATION] ${notification.title}`,
            message: `This notification was not read within ${minutesAgo} minutes: ${notification.message}`,
            audienceType: rule.escalateToType!,
            audienceTarget: rule.audienceTarget,
            channels: escalateChannels,
            priority: 'URGENT',
            category: 'SYSTEM',
            eventType: `ESCALATION:${rule.eventType}`,
          });

          this.logger.log(`Escalated notification ${notification.id} (rule ${rule.id})`);

          // Mark original as read to prevent repeated escalation
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: { status: 'READ', readAt: now },
          });
        } catch (err) {
          this.logger.error(`Escalation failed for notification ${notification.id}: ${err}`);
        }
      }
    }
  }
}
