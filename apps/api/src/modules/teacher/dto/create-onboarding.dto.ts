import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOnboardingTaskDto {
  @IsString() @IsNotEmpty()
  taskName: string;

  @IsString() @IsNotEmpty()
  category: string;

  @IsOptional() @IsBoolean()
  isRequired?: boolean;
}

export class CreateOnboardingDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOnboardingTaskDto)
  tasks?: CreateOnboardingTaskDto[];
}
