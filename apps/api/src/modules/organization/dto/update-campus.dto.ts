import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCampusDto } from './create-campus.dto';

export class UpdateCampusDto extends PartialType(CreateCampusDto) {
  @ApiPropertyOptional({ example: 'ACTIVE', description: 'ACTIVE | INACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}
