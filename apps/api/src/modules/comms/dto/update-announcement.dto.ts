import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AudienceTypeEnum } from './create-announcement.dto';

export enum AnnouncementStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateAnnouncementDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ enum: AudienceTypeEnum })
  @IsEnum(AudienceTypeEnum)
  @IsOptional()
  audienceType?: AudienceTypeEnum;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  targetClassId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  publishAt?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ enum: AnnouncementStatusEnum })
  @IsEnum(AnnouncementStatusEnum)
  @IsOptional()
  status?: AnnouncementStatusEnum;
}
