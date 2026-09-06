import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsIn,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CALENDAR_EVENT_TYPES = ['HOLIDAY', 'EXAM', 'EVENT', 'MEETING', 'OTHER'] as const;

export class CreateCalendarEventDto {
  @ApiProperty({ description: 'Academic year this event belongs to' })
  @IsUUID()
  academicYearId: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CALENDAR_EVENT_TYPES, default: 'HOLIDAY' })
  @IsOptional()
  @IsIn(CALENDAR_EVENT_TYPES)
  eventType?: string;

  @ApiProperty({ example: '2026-04-14' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-04-14' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSchoolClosed?: boolean;

  @ApiPropertyOptional({ description: 'Campus-specific event — omit for org-wide' })
  @IsOptional()
  @IsUUID()
  campusId?: string;
}
