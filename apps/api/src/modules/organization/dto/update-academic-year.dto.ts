import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAcademicYearDto } from './create-academic-year.dto';

export class UpdateAcademicYearDto extends PartialType(CreateAcademicYearDto) {
  @ApiPropertyOptional({ example: 'ACTIVE', description: 'UPCOMING | ACTIVE | CLOSED' })
  @IsOptional()
  @IsString()
  status?: string;
}
