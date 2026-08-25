import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { SubjectTypeEnum } from './create-subject.dto';

export enum SubjectStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class UpdateSubjectDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ enum: SubjectTypeEnum })
  @IsEnum(SubjectTypeEnum)
  @IsOptional()
  subjectType?: SubjectTypeEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: SubjectStatusEnum })
  @IsEnum(SubjectStatusEnum)
  @IsOptional()
  status?: SubjectStatusEnum;
}
