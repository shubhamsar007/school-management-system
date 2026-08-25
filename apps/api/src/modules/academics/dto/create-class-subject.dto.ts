import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateClassSubjectDto {
  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiPropertyOptional({ default: false, description: 'Whether subject is optional/elective' })
  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxMarks?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  passingMarks?: number;

  @ApiPropertyOptional({ description: 'Weightage percentage for this subject' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weightage?: number;
}
