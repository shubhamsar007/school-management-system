import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const RULE_TYPES = [
  'MAX_PERIODS_PER_DAY',
  'MAX_PERIODS_PER_WEEK',
  'BLACKOUT_PERIOD',
  'PREFERRED_PERIOD',
] as const;

export class CreateSchedulingRuleDto {
  @IsUUID()
  campusId: string;

  @IsString()
  @IsIn(RULE_TYPES)
  ruleType: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  value?: number;

  @IsOptional()
  @IsUUID()
  periodId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
