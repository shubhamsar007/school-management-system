import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiPropertyOptional()
  @IsUUID()
  leaveTypeId: string;

  @ApiPropertyOptional({ example: '2024-08-05' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2024-08-07' })
  @IsDateString()
  endDate: string;

  /** Server computes the working-day count; this field is accepted but ignored. */
  @ApiPropertyOptional({ description: 'Client hint — server always recomputes' })
  @IsInt()
  @Min(1)
  @IsOptional()
  totalDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
