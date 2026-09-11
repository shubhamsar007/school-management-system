import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum TemplateChannelEnum {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
}

export enum TemplateLanguageEnum {
  EN = 'en',
  HI = 'hi',
  GU = 'gu',
  MR = 'mr',
  TA = 'ta',
  TE = 'te',
}

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Event type this template handles (e.g. STUDENT_ABSENT)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventType: string;

  @ApiProperty({ enum: TemplateChannelEnum })
  @IsEnum(TemplateChannelEnum)
  channel: TemplateChannelEnum;

  @ApiPropertyOptional({ enum: TemplateLanguageEnum, default: TemplateLanguageEnum.EN })
  @IsOptional()
  @IsEnum(TemplateLanguageEnum)
  language?: TemplateLanguageEnum;

  @ApiPropertyOptional({ description: 'Email subject line (required for EMAIL channel)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiProperty({ description: 'Template body with {{variable}} placeholders' })
  @IsString()
  @IsNotEmpty()
  body: string;
}
