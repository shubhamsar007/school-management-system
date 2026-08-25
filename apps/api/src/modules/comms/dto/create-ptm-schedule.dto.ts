import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class CreatePtmScheduleDto {
  @ApiProperty()
  @IsUUID()
  campusId: string;

  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty({ example: 'Term 1 PTM' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: '2024-09-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ default: 15, description: 'Duration of each slot in minutes' })
  @IsInt()
  @Min(5)
  @IsOptional()
  slotDurationMinutes?: number;
}
