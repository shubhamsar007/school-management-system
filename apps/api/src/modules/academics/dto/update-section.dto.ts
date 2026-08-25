import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';

export enum SectionStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class UpdateSectionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  code?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ enum: SectionStatusEnum })
  @IsEnum(SectionStatusEnum)
  @IsOptional()
  status?: SectionStatusEnum;
}
