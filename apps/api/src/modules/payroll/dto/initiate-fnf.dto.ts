import {
  IsString,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export const FNF_SEPARATION_TYPES = [
  'RESIGNATION',
  'TERMINATION',
  'RETIREMENT',
  'DEATH',
  'CONTRACT_END',
  'OTHER',
] as const;

export type FnfSeparationType = (typeof FNF_SEPARATION_TYPES)[number];

export class InitiateFnfDto {
  @IsString()
  employeeId!: string;

  @IsDateString()
  separationDate!: string;

  @IsIn(FNF_SEPARATION_TYPES)
  separationType!: string;

  @IsDateString()
  lastWorkingDay!: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  noticePeriodDays?: number;

  @IsNumber()
  @Min(0)
  @Max(60)
  @IsOptional()
  pendingLeaveDays?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
