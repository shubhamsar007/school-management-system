import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum NotificationChannelEnum {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum NotificationCategoryEnum {
  ACADEMIC = 'ACADEMIC',
  ATTENDANCE = 'ATTENDANCE',
  EXAMINATION = 'EXAMINATION',
  FINANCE = 'FINANCE',
  ADMISSIONS = 'ADMISSIONS',
  HR = 'HR',
  SUBSTITUTION = 'SUBSTITUTION',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  PTM = 'PTM',
  SYSTEM = 'SYSTEM',
  GENERAL = 'GENERAL',
}

export enum NotificationPriorityEnum {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class SendNotificationDto {
  @ApiProperty()
  @IsUUID()
  recipientUserId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventType: string;

  @ApiPropertyOptional({ enum: NotificationCategoryEnum, default: NotificationCategoryEnum.GENERAL })
  @IsOptional()
  @IsEnum(NotificationCategoryEnum)
  category?: NotificationCategoryEnum;

  @ApiPropertyOptional({ enum: NotificationPriorityEnum, default: NotificationPriorityEnum.NORMAL })
  @IsOptional()
  @IsEnum(NotificationPriorityEnum)
  priority?: NotificationPriorityEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ enum: NotificationChannelEnum })
  @IsEnum(NotificationChannelEnum)
  channel: NotificationChannelEnum;

  @ApiPropertyOptional({ description: 'Source entity type (e.g. INVOICE, STUDENT, LEAVE_REQUEST)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  entityType?: string;

  @ApiPropertyOptional({ description: 'Source entity ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityId?: string;

  @ApiPropertyOptional({ description: 'Deep link URL within the ERP (e.g. /finance/invoices/abc123)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  actionUrl?: string;
}
