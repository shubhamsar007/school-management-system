import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { BloodGroupEnum, GenderEnum } from './create-teacher.dto';

export enum EmploymentStatusEnum {
  DRAFT = 'DRAFT',
  ONBOARDING = 'ONBOARDING',
  PROBATION = 'PROBATION',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
  EXIT_INITIATED = 'EXIT_INITIATED',
  EXITED = 'EXITED',
  ARCHIVED = 'ARCHIVED',
}

export enum EmploymentTypeEnum {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  VISITING = 'VISITING',
}

export class UpdateTeacherDto {
  // ── Person fields ────────────────────────────────────────────

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  middleName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: GenderEnum })
  @IsEnum(GenderEnum)
  @IsOptional()
  gender?: GenderEnum;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(30)
  alternatePhone?: string;

  @ApiPropertyOptional({ enum: BloodGroupEnum })
  @IsEnum(BloodGroupEnum)
  @IsOptional()
  bloodGroup?: BloodGroupEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nationality?: string;

  // ── Employee fields ──────────────────────────────────────────

  @ApiPropertyOptional({ enum: EmploymentStatusEnum })
  @IsEnum(EmploymentStatusEnum)
  @IsOptional()
  employmentStatus?: EmploymentStatusEnum;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  joiningDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  leavingDate?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  employeeTypeId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  designationId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  campusId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  reportingManagerId?: string;

  @ApiPropertyOptional({ enum: EmploymentTypeEnum })
  @IsEnum(EmploymentTypeEnum)
  @IsOptional()
  employmentType?: EmploymentTypeEnum;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  probationStart?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  probationEnd?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  confirmationDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  contractStart?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  contractEnd?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  noticePeriodDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  workLocation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  leavingReason?: string;
}
