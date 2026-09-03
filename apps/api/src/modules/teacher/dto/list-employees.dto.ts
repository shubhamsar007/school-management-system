import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class ListEmployeesDto {
  @ApiPropertyOptional({ description: 'Search by name or employee number' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  designationId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  employeeTypeId?: string;

  @ApiPropertyOptional({ description: 'e.g. ACTIVE, ON_LEAVE, PROBATION' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  campusId?: string;

  @ApiPropertyOptional({ description: 'FULL_TIME | PART_TIME | CONTRACT | VISITING' })
  @IsString()
  @IsOptional()
  employmentType?: string;

  @ApiPropertyOptional({ description: 'TEACHING | NON_TEACHING — filters by employeeType.category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 25 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 25;
}
