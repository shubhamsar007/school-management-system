import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  ValidateNested,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GradeRuleDto {
  @ApiProperty({ example: 'A+' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  grade: string;

  @ApiProperty({ example: 90 })
  @IsNumber()
  @Min(0)
  @Max(100)
  minPercentage: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercentage: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  gradePoint?: number;

  @ApiPropertyOptional({ example: 'Outstanding' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  remark?: string;
}

export class CreateGradingSystemDto {
  @ApiProperty({ example: 'CBSE 10-point Scale' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ default: false, description: 'Set as the default grading system' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ type: [GradeRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeRuleDto)
  gradeRules: GradeRuleDto[];
}
