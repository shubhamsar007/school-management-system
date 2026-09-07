import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class EnrollApplicationDto {
  @ApiProperty({ description: 'Section to enroll the student into' })
  @IsUUID()
  sectionId: string;

  @ApiProperty({ description: 'Unique admission number for the student' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  admissionNumber: string;

  @ApiProperty({ description: 'Student first name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Student last name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: 'Roll number within the section' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  rollNumber?: string;

  @ApiPropertyOptional({ example: '2024-07-15', description: 'Date of joining (defaults to today)' })
  @IsDateString()
  @IsOptional()
  joiningDate?: string;

  @ApiPropertyOptional({ example: '2024-07-15', description: 'Enrollment date (defaults to today)' })
  @IsDateString()
  @IsOptional()
  enrollmentDate?: string;
}
