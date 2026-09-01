import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';
import { GenderEnum } from './create-student.dto';

export enum GuardianRelationshipEnum {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  GRANDFATHER = 'GRANDFATHER',
  GRANDMOTHER = 'GRANDMOTHER',
  UNCLE = 'UNCLE',
  AUNT = 'AUNT',
  SIBLING = 'SIBLING',
  LEGAL_GUARDIAN = 'LEGAL_GUARDIAN',
  OTHER = 'OTHER',
}

export class CreateGuardianDto {
  // ── Person fields ────────────────────────────────────────────

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  middleName?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

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

  @ApiProperty({ description: 'Primary contact phone' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(30)
  alternatePhone?: string;

  // ── Guardian fields ──────────────────────────────────────────

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  occupation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  employer?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  annualIncome?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  education?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  designation?: string;

  // ── StudentGuardian link fields ──────────────────────────────

  @ApiProperty({ enum: GuardianRelationshipEnum })
  @IsEnum(GuardianRelationshipEnum)
  relationship: GuardianRelationshipEnum;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isEmergencyContact?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  canPickup?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  canReceiveNotifications?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  canAccessPortal?: boolean;
}
