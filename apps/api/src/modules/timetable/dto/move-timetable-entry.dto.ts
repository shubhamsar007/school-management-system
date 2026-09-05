import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class MoveTimetableEntryDto {
  @ApiProperty({ example: 1, description: '1=Monday … 7=Sunday' })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({ description: 'Target period ID' })
  @IsUUID()
  periodId: string;
}
