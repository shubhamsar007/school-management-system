import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateOnboardingTaskDto {
  @IsOptional() @IsBoolean()
  isCompleted?: boolean;

  @IsOptional() @IsString()
  completedBy?: string;

  @IsOptional() @IsString()
  remarks?: string;
}
