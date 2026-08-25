import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export enum LeaveApplicableToEnum {
  EMPLOYEE = 'EMPLOYEE',
  STUDENT = 'STUDENT',
  ALL = 'ALL',
}

export class CreateLeaveTypeDto {
  @ApiProperty({ example: 'Casual Leave' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'CL' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ enum: LeaveApplicableToEnum })
  @IsEnum(LeaveApplicableToEnum)
  applicableTo: LeaveApplicableToEnum;

  @ApiPropertyOptional({ description: 'Max leave days per year (null = unlimited)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  annualLimit?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Allow unused leave to carry forward' })
  @IsBoolean()
  @IsOptional()
  carryForward?: boolean;
}
