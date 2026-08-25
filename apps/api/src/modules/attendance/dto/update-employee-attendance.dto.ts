import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { EmployeeAttendanceStatusEnum } from './mark-employee-attendance.dto';

export class UpdateEmployeeAttendanceDto {
  @ApiPropertyOptional({ enum: EmployeeAttendanceStatusEnum })
  @IsEnum(EmployeeAttendanceStatusEnum)
  @IsOptional()
  status?: EmployeeAttendanceStatusEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  checkInTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  checkOutTime?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  @IsOptional()
  workHours?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}
