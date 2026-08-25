import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty()
  @IsUUID()
  campusId: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiPropertyOptional({ description: 'Roll number within the section' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  rollNumber?: string;

  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  enrollmentDate: string;
}
