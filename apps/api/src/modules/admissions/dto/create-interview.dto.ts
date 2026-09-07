import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsInt, Min, Max, IsIn, MaxLength } from 'class-validator';

export class CreateInterviewDto {
  @ApiProperty({ example: '2026-09-15T10:00:00Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ enum: ['IN_PERSON', 'ONLINE', 'PHONE'], default: 'IN_PERSON' })
  @IsString()
  @IsOptional()
  @IsIn(['IN_PERSON', 'ONLINE', 'PHONE'])
  format?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  conductedBy?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateInterviewDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @ApiPropertyOptional({ enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'] })
  @IsString()
  @IsOptional()
  @IsIn(['SCHEDULED', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ enum: ['IN_PERSON', 'ONLINE', 'PHONE'] })
  @IsString()
  @IsOptional()
  @IsIn(['IN_PERSON', 'ONLINE', 'PHONE'])
  format?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  @IsOptional()
  score?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  maxScore?: number;

  @ApiPropertyOptional({ enum: ['ADMIT', 'WAITLIST', 'REJECT'] })
  @IsString()
  @IsOptional()
  @IsIn(['ADMIT', 'WAITLIST', 'REJECT'])
  recommendation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  conductedBy?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
