import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RuleAudienceType {
  EMPLOYEE          = 'EMPLOYEE',
  ALL_EMPLOYEES     = 'ALL_EMPLOYEES',
  STUDENT_GUARDIANS = 'STUDENT_GUARDIANS',
  DEPARTMENT        = 'DEPARTMENT',
  CLASS             = 'CLASS',
  SECTION           = 'SECTION',
  CAMPUS_EMPLOYEES  = 'CAMPUS_EMPLOYEES',
  ROLE_MEMBERS      = 'ROLE_MEMBERS',
}

export enum RuleChannel {
  IN_APP    = 'IN_APP',
  EMAIL     = 'EMAIL',
  SMS       = 'SMS',
  WHATSAPP  = 'WHATSAPP',
  PUSH      = 'PUSH',
}

export enum RulePriority {
  LOW    = 'LOW',
  NORMAL = 'NORMAL',
  HIGH   = 'HIGH',
  URGENT = 'URGENT',
}

export enum RuleCategory {
  ACADEMIC     = 'ACADEMIC',
  ATTENDANCE   = 'ATTENDANCE',
  EXAMINATION  = 'EXAMINATION',
  FINANCE      = 'FINANCE',
  ADMISSIONS   = 'ADMISSIONS',
  HR           = 'HR',
  SUBSTITUTION = 'SUBSTITUTION',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  PTM          = 'PTM',
  SYSTEM       = 'SYSTEM',
  GENERAL      = 'GENERAL',
}

export class CreateRuleDto {
  @ApiProperty({ example: 'Leave Approved — notify employee' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'LEAVE_APPROVED' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventType: string;

  @ApiPropertyOptional({ example: 'template-uuid' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({ enum: RuleAudienceType })
  @IsEnum(RuleAudienceType)
  audienceType: RuleAudienceType;

  @ApiProperty({ enum: RuleChannel, isArray: true, example: ['IN_APP', 'EMAIL'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(RuleChannel, { each: true })
  channels: RuleChannel[];

  @ApiPropertyOptional({ enum: RulePriority, default: 'NORMAL' })
  @IsOptional()
  @IsEnum(RulePriority)
  priority?: RulePriority;

  @ApiPropertyOptional({ enum: RuleCategory, default: 'GENERAL' })
  @IsOptional()
  @IsEnum(RuleCategory)
  category?: RuleCategory;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID of the target entity (departmentId, classId, sectionId, campusId, roleId)' })
  @IsOptional()
  @IsString()
  audienceTarget?: string;

  @ApiPropertyOptional({ description: 'Escalate if notification unread after N minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  escalateAfterMinutes?: number;

  @ApiPropertyOptional({ description: 'Escalation audience type' })
  @IsOptional()
  @IsString()
  escalateToType?: string;

  @ApiPropertyOptional({ enum: RuleChannel, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(RuleChannel, { each: true })
  escalateChannels?: RuleChannel[];
}
