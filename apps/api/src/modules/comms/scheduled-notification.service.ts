import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { NotificationDispatchService } from './notification-dispatch.service';

@Injectable()
export class ScheduledNotificationService {
  private readonly logger = new Logger(ScheduledNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchService: NotificationDispatchService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async fireScheduledNotifications() {
    const now = new Date();

    const due = await this.prisma.notificationSchedule.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
      },
      take: 50,
    });

    if (due.length === 0) return;

    this.logger.log(`Firing ${due.length} scheduled notification(s)`);

    for (const schedule of due) {
      try {
        await this.dispatchService.dispatchDirect(schedule.organizationId, {
          title: schedule.title,
          message: schedule.message,
          audienceType: schedule.audienceType,
          audienceTarget: schedule.audienceTarget,
          channels: schedule.channels,
          priority: schedule.priority,
          category: schedule.category,
          eventType: `SCHEDULED:${schedule.id}`,
        });

        const nextRunAt = this.computeNextRun(schedule);

        await this.prisma.notificationSchedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: now,
            runCount: { increment: 1 },
            nextRunAt,
            // Deactivate ONCE schedules after firing
            ...(schedule.recurrence === 'ONCE' ? { isActive: false } : {}),
          },
        });
      } catch (err) {
        this.logger.error(`Failed to fire schedule ${schedule.id}: ${err}`);
      }
    }
  }

  private computeNextRun(schedule: {
    recurrence: string;
    scheduledAt: Date | null;
    cronExpression: string | null;
  }): Date | null {
    const base = schedule.scheduledAt ?? new Date();

    switch (schedule.recurrence) {
      case 'ONCE':
        return null; // no next run
      case 'DAILY': {
        const next = new Date(base);
        next.setDate(next.getDate() + 1);
        return next;
      }
      case 'WEEKLY': {
        const next = new Date(base);
        next.setDate(next.getDate() + 7);
        return next;
      }
      case 'MONTHLY': {
        const next = new Date(base);
        next.setMonth(next.getMonth() + 1);
        return next;
      }
      default:
        // For CRON — advance by 1 minute as fallback (real cron parsing not wired)
        return new Date(Date.now() + 60_000);
    }
  }
}
