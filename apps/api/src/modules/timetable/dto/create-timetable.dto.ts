import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTimetableDto {
  @ApiProperty()
  @IsUUID()
  campusId: string;

  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty({ example: 'Term 1 Timetable 2024-25' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '2024-04-01' })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({ example: '2024-10-31' })
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;
}
