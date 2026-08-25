import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { BloodGroupEnum, GenderEnum } from './create-student.dto';

export enum StudentStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  GRADUATED = 'GRADUATED',
  TRANSFERRED = 'TRANSFERRED',
  EXPELLED = 'EXPELLED',
  SUSPENDED = 'SUSPENDED',
}

export class UpdateStudentDto {
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

  // ── Student fields ───────────────────────────────────────────

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  registrationNumber?: string;

  @ApiPropertyOptional({ enum: StudentStatusEnum })
  @IsEnum(StudentStatusEnum)
  @IsOptional()
  studentStatus?: StudentStatusEnum;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  joiningDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  leavingDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  leavingReason?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  currentCampusId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  houseId?: string;
}
