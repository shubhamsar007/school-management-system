import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateClassSubjectDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxMarks?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  passingMarks?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  weightage?: number | null;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: string;
}
