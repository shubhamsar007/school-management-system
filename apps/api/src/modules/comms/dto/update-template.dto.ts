import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { TemplateChannelEnum, TemplateLanguageEnum } from './create-template.dto';

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  eventType?: string;

  @ApiPropertyOptional({ enum: TemplateChannelEnum })
  @IsOptional()
  @IsEnum(TemplateChannelEnum)
  channel?: TemplateChannelEnum;

  @ApiPropertyOptional({ enum: TemplateLanguageEnum })
  @IsOptional()
  @IsEnum(TemplateLanguageEnum)
  language?: TemplateLanguageEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;
}
