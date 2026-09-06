import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional } from 'class-validator';
import { CreateEmployeeTypeDto } from './create-employee-type.dto';

export class UpdateEmployeeTypeDto extends PartialType(CreateEmployeeTypeDto) {
  @ApiPropertyOptional({ description: 'Status of the employee type' })
  @IsString()
  @IsOptional()
  status?: string;
}
