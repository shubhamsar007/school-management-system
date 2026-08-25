import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateTimetableEntryDto {
  @ApiProperty({ example: 1, description: '1=Monday, 2=Tuesday, ... 7=Sunday' })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty()
  @IsUUID()
  periodId: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Employee ID of the teacher' })
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  roomId?: string;
}

export class UpdateTimetableEntryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  roomId?: string;
}
