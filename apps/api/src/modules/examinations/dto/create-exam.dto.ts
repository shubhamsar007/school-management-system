import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateExamDto {
  @ApiProperty({ example: 'Mid Term Examination 2024' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty()
  @IsUUID()
  examTypeId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  gradingSystemId?: string;

  @ApiProperty({ example: '2024-09-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-09-15' })
  @IsDateString()
  endDate: string;
}
