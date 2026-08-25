import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EnquirySourceEnum } from './create-enquiry.dto';

export enum EnquiryStatusEnum {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  VISITED = 'VISITED',
  APPLIED = 'APPLIED',
  CONVERTED = 'CONVERTED',
  DROPPED = 'DROPPED',
}

export class UpdateEnquiryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  studentName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  parentName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  classInterestedId?: string;

  @ApiPropertyOptional({ enum: EnquirySourceEnum })
  @IsEnum(EnquirySourceEnum)
  @IsOptional()
  source?: EnquirySourceEnum;

  @ApiPropertyOptional({ enum: EnquiryStatusEnum })
  @IsEnum(EnquiryStatusEnum)
  @IsOptional()
  status?: EnquiryStatusEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assignedTo?: string;
}
