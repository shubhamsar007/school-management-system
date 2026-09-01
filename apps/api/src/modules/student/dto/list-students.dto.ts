import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { GenderEnum } from './create-student.dto';
import { StudentStatusEnum } from './update-student.dto';

export class ListStudentsDto {
  @ApiPropertyOptional({ description: 'Search by student name or admission number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ enum: StudentStatusEnum })
  @IsOptional()
  @IsEnum(StudentStatusEnum)
  status?: StudentStatusEnum;

  @ApiPropertyOptional({ enum: GenderEnum })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
