import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateExamSubjectDto {
  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiPropertyOptional({ example: '2024-09-05' })
  @IsDateString()
  @IsOptional()
  examDate?: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ example: '13:00' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  maxMarks: number;

  @ApiProperty({ example: 35 })
  @IsNumber()
  @Min(0)
  passingMarks: number;

  @ApiPropertyOptional({ default: 100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weightage?: number;
}
