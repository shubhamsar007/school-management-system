import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StudentAttendanceStatusEnum } from './mark-student-attendance.dto';

export class UpdateStudentAttendanceDto {
  @ApiPropertyOptional({ enum: StudentAttendanceStatusEnum })
  @IsEnum(StudentAttendanceStatusEnum)
  @IsOptional()
  status?: StudentAttendanceStatusEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  checkInTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  checkOutTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}
