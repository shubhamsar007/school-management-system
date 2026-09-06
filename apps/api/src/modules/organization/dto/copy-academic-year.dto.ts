import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CopyAcademicYearDto {
  @ApiProperty({ description: 'Source academic year to copy from' })
  @IsUUID()
  sourceYearId: string;

  @ApiPropertyOptional({ default: true, description: 'Copy class-subject curriculum assignments' })
  @IsBoolean()
  @IsOptional()
  copyCurriculum?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Copy teacher assignments' })
  @IsBoolean()
  @IsOptional()
  copyTeacherAssignments?: boolean;
}
