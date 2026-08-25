import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum EnquirySourceEnum {
  WALK_IN = 'WALK_IN',
  PHONE = 'PHONE',
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  ADVERTISEMENT = 'ADVERTISEMENT',
  OTHER = 'OTHER',
}

export class CreateEnquiryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  studentName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  parentName?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  campusId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  academicYearId?: string;

  @ApiPropertyOptional({ description: 'Class the student is interested in' })
  @IsUUID()
  @IsOptional()
  classInterestedId?: string;

  @ApiProperty({ enum: EnquirySourceEnum })
  @IsEnum(EnquirySourceEnum)
  source: EnquirySourceEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'User ID of the staff member handling this enquiry' })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;
}
