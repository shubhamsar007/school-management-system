import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { LeaveApplicableToEnum } from './create-leave-type.dto';

export enum LeaveTypeStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class UpdateLeaveTypeDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ enum: LeaveApplicableToEnum })
  @IsEnum(LeaveApplicableToEnum)
  @IsOptional()
  applicableTo?: LeaveApplicableToEnum;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  annualLimit?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  carryForward?: boolean;

  @ApiPropertyOptional({ enum: LeaveTypeStatusEnum })
  @IsEnum(LeaveTypeStatusEnum)
  @IsOptional()
  status?: LeaveTypeStatusEnum;
}
