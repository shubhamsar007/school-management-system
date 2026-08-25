import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum AudienceTypeEnum {
  ALL = 'ALL',
  STUDENTS = 'STUDENTS',
  TEACHERS = 'TEACHERS',
  PARENTS = 'PARENTS',
  STAFF = 'STAFF',
}

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: AudienceTypeEnum })
  @IsEnum(AudienceTypeEnum)
  audienceType: AudienceTypeEnum;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  campusId?: string;

  @ApiPropertyOptional({ description: 'Target a specific class (when audienceType is STUDENTS or PARENTS)' })
  @IsUUID()
  @IsOptional()
  targetClassId?: string;

  @ApiPropertyOptional({ description: 'Schedule publish time (ISO datetime). Null = publish immediately.' })
  @IsDateString()
  @IsOptional()
  publishAt?: string;

  @ApiPropertyOptional({ description: 'When the announcement expires (ISO datetime)' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
