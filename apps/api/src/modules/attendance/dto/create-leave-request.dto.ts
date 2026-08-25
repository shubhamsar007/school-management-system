import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty()
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty({ example: '2024-08-05' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-08-07' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Number of leave days being requested' })
  @IsInt()
  @Min(1)
  totalDays: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
