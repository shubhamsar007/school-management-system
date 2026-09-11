import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { NotificationProviderService } from './notification-provider.service';

const MAX_RETRIES = 3;

// Exponential backoff delays in seconds: attempt 1 → 30s, 2 → 120s, 3 → 600s
const RETRY_DELAYS = [30, 120, 600];

@Injectable()
export class DeliveryRetryService {
  private readonly logger = new Logger(DeliveryRetryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: NotificationProviderService,
  ) {}

  /**
   * Runs every minute. Finds FAILED / RETRYING deliveries that are due
   * for their next retry attempt and re-dispatches them.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async retryFailedDeliveries() {
    const now = new Date();

    const due = await this.prisma.notificationDelivery.findMany({
      where: {
        status: { in: ['FAILED', 'RETRYING'] },
        retryCount: { lt: MAX_RETRIES },
        nextRetryAt: { lte: now },
      },
      include: {
        notification: true,
      },
      take: 50, // process in batches to avoid overwhelming providers
    });

    if (due.length === 0) return;

    this.logger.log(`Retrying ${due.length} failed delivery/deliveries`);

    for (const delivery of due) {
      await this.attemptRetry(delivery);
    }
  }

  async attemptRetry(delivery: {
    id: string;
    provider: string;
    retryCount: number;
    notification: {
      id: string;
      channel: string;
      recipientUserId: string;
      title: string;
      message: string;
    };
  }) {
    const { notification } = delivery;
    const newCount = delivery.retryCount + 1;

    // Mark as RETRYING
    await this.prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: 'RETRYING' },
    });

    try {
      const result = await this.provider.send(
        notification.channel,
        notification.recipientUserId,
        notification.title,
        notification.message,
        delivery.provider,
      );

      if (result.success) {
        await this.prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'SENT',
            retryCount: newCount,
            providerMessageId: result.providerMessageId ?? null,
            sentAt: new Date(),
            nextRetryAt: null,
          },
        });

        // Update parent notification status
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'SENT', sentAt: new Date() },
        });

        this.logger.debug(`Retry ${newCount}/${MAX_RETRIES} succeeded for delivery ${delivery.id}`);
      } else {
        await this.markRetryFailed(delivery.id, newCount, result.errorMessage);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await this.markRetryFailed(delivery.id, newCount, message);
    }
  }

  private async markRetryFailed(
    deliveryId: string,
    newCount: number,
    errorMessage?: string,
  ) {
    const isPermanent = newCount >= MAX_RETRIES;
    const delaySeconds = RETRY_DELAYS[newCount] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1] ?? 600;
    const nextRetry = isPermanent ? null : new Date(Date.now() + delaySeconds * 1000);

    await this.prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: isPermanent ? 'FAILED_PERMANENTLY' : 'FAILED',
        retryCount: newCount,
        errorMessage: errorMessage ?? null,
        nextRetryAt: nextRetry,
      },
    });

    this.logger.warn(
      `Delivery ${deliveryId} retry ${newCount}/${MAX_RETRIES} failed${isPermanent ? ' — permanently' : `, next at ${nextRetry?.toISOString()}`}`,
    );
  }
}
