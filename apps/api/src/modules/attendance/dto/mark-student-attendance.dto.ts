import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StudentAttendanceStatusEnum {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  EXCUSED = 'EXCUSED',
}

export class StudentAttendanceEntryDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  enrollmentId: string;

  @ApiProperty({ enum: StudentAttendanceStatusEnum })
  @IsEnum(StudentAttendanceStatusEnum)
  status: StudentAttendanceStatusEnum;

  @ApiPropertyOptional({ example: '08:30', description: 'HH:MM format' })
  @IsString()
  @IsOptional()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '15:00', description: 'HH:MM format' })
  @IsString()
  @IsOptional()
  checkOutTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class MarkStudentAttendanceDto {
  @ApiProperty({ example: '2024-08-01' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [StudentAttendanceEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceEntryDto)
  entries: StudentAttendanceEntryDto[];
}
