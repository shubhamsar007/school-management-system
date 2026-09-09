import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateUnavailabilityOverrideDto {
  @IsString()
  employeeId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
