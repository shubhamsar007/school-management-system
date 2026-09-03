import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsIn, MaxLength } from 'class-validator';

export const LIFECYCLE_EVENT_TYPES = [
  'JOINED',
  'ONBOARDING_COMPLETED',
  'PROBATION_STARTED',
  'CONFIRMED',
  'PROMOTED',
  'TRANSFERRED',
  'DEPARTMENT_CHANGED',
  'DESIGNATION_CHANGED',
  'SALARY_REVISED',
  'SUSPENDED',
  'REINSTATED',
  'RESIGNED',
  'TERMINATED',
  'RETIRED',
  'ARCHIVED',
] as const;

export class CreateLifecycleEventDto {
  @ApiProperty({ enum: LIFECYCLE_EVENT_TYPES })
  @IsIn(LIFECYCLE_EVENT_TYPES)
  eventType: string;

  @ApiProperty({ description: 'The new employment status after this event' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  toStatus: string;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  effectiveDate: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}
