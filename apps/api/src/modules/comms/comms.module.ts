import { Module } from '@nestjs/common';
import { CommsService } from './comms.service';
import { CommsController } from './comms.controller';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationProviderService } from './notification-provider.service';
import { DeliveryRetryService } from './delivery-retry.service';
import { ScheduledNotificationService } from './scheduled-notification.service';
import { EscalationService } from './escalation.service';

@Module({
  controllers: [CommsController],
  providers: [
    CommsService,
    NotificationDispatchService,
    NotificationProviderService,
    DeliveryRetryService,
    ScheduledNotificationService,
    EscalationService,
  ],
  exports: [CommsService],
})
export class CommsModule {}
