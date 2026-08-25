import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum SubjectTypeEnum {
  CORE = 'CORE',
  ELECTIVE = 'ELECTIVE',
  CO_CURRICULAR = 'CO_CURRICULAR',
  LANGUAGE = 'LANGUAGE',
}

export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'MATH' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ enum: SubjectTypeEnum })
  @IsEnum(SubjectTypeEnum)
  subjectType: SubjectTypeEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
