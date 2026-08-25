import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum BloodGroupEnum {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
  O_POS = 'O+',
  O_NEG = 'O-',
}

export class CreateStudentDto {
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

  @ApiPropertyOptional({ default: 'Indian' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nationality?: string;

  // ── Student fields ───────────────────────────────────────────

  @ApiProperty({ description: 'Unique admission number within the organisation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  admissionNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  registrationNumber?: string;

  @ApiProperty({ example: '2024-06-01' })
  @IsDateString()
  admissionDate: string;

  @ApiPropertyOptional({ example: '2024-07-15' })
  @IsDateString()
  @IsOptional()
  joiningDate?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  currentCampusId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  houseId?: string;
}
