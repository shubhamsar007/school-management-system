import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsUUID, IsDateString,
  IsNumber, Min, Max, IsArray, ValidateNested, IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCriteriaDto {
  @ApiProperty()
  @IsString()
  criteriaName: string;

  @ApiProperty({ example: 4.5 })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0) @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateGoalDto {
  @ApiProperty()
  @IsString()
  goal: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  target?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'IN_PROGRESS', 'ACHIEVED', 'NOT_ACHIEVED'] })
  @IsIn(['PENDING', 'IN_PROGRESS', 'ACHIEVED', 'NOT_ACHIEVED'])
  @IsOptional()
  status?: string;
}

export class CreatePerformanceReviewDto {
  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty({ example: 'ANNUAL' })
  @IsString()
  reviewType: string;

  @ApiProperty()
  @IsString()
  reviewedBy: string;

  @ApiProperty()
  @IsDateString()
  reviewDate: string;

  @ApiPropertyOptional({ example: 4.2 })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0) @Max(5)
  @IsOptional()
  overallRating?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ type: [CreateCriteriaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCriteriaDto)
  @IsOptional()
  criteria?: CreateCriteriaDto[];

  @ApiPropertyOptional({ type: [CreateGoalDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGoalDto)
  @IsOptional()
  goals?: CreateGoalDto[];
}
