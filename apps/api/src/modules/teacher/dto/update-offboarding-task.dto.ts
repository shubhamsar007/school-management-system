import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateOffboardingTaskDto {
  @IsOptional() @IsBoolean()
  isCompleted?: boolean;

  @IsOptional() @IsString()
  completedBy?: string;

  @IsOptional() @IsString()
  remarks?: string;
}
