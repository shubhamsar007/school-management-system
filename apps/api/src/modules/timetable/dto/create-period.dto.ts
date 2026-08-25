import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';

export class CreatePeriodDto {
  @ApiProperty()
  @IsUUID()
  campusId: string;

  @ApiProperty({ example: 'Period 1' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  periodNumber: number;

  @ApiProperty({ example: '08:00', description: 'HH:MM (24-hour)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @ApiProperty({ example: '08:45', description: 'HH:MM (24-hour)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:MM format' })
  endTime: string;

  @ApiProperty({
    example: 'CLASS',
    description: 'CLASS | BREAK | LUNCH | ASSEMBLY | ACTIVITY',
  })
  @IsString()
  @IsIn(['CLASS', 'BREAK', 'LUNCH', 'ASSEMBLY', 'ACTIVITY'])
  periodType: string;
}
