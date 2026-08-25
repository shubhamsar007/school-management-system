import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum EmployeeAttendanceStatusEnum {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE',
  HOLIDAY = 'HOLIDAY',
  WORK_FROM_HOME = 'WORK_FROM_HOME',
}

export class MarkEmployeeAttendanceDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty()
  @IsUUID()
  campusId: string;

  @ApiProperty({ example: '2024-08-01' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: EmployeeAttendanceStatusEnum })
  @IsEnum(EmployeeAttendanceStatusEnum)
  status: EmployeeAttendanceStatusEnum;

  @ApiPropertyOptional({ example: '08:30' })
  @IsString()
  @IsOptional()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsString()
  @IsOptional()
  checkOutTime?: string;

  @ApiPropertyOptional({ description: 'Total hours worked (e.g. 8.5)' })
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
