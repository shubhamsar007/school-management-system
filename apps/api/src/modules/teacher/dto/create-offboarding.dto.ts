import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOffboardingTaskDto {
  @IsString() @IsNotEmpty()
  taskName: string;

  @IsString() @IsNotEmpty()
  category: string;

  @IsOptional() @IsBoolean()
  isRequired?: boolean;
}

export class CreateOffboardingDto {
  @IsIn(['RESIGNATION', 'TERMINATION', 'RETIREMENT', 'CONTRACT_END', 'OTHER'])
  exitType: string;

  @IsString() @IsNotEmpty()
  exitDate: string;

  @IsString() @IsNotEmpty()
  lastWorkingDate: string;

  @IsOptional() @IsString()
  reason?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOffboardingTaskDto)
  tasks?: CreateOffboardingTaskDto[];
}
