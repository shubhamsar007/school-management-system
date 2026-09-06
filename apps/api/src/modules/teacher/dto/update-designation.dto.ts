import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional } from 'class-validator';
import { CreateDesignationDto } from './create-designation.dto';

export class UpdateDesignationDto extends PartialType(CreateDesignationDto) {
  @ApiPropertyOptional({ description: 'Status of the designation' })
  @IsString()
  @IsOptional()
  status?: string;
}
