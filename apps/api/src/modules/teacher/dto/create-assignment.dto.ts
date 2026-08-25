import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiPropertyOptional({ default: false, description: 'Mark as class teacher for this section' })
  @IsBoolean()
  @IsOptional()
  isClassTeacher?: boolean;

  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2025-04-30' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
