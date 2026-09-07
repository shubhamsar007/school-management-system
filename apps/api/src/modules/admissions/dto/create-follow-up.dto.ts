import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, MaxLength, IsIn } from 'class-validator';

export class CreateFollowUpDto {
  @ApiProperty({ example: '2026-09-10T10:00:00Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ enum: ['CALL', 'EMAIL', 'VISIT', 'MESSAGE'], default: 'CALL' })
  @IsString()
  @IsOptional()
  @IsIn(['CALL', 'EMAIL', 'VISIT', 'MESSAGE'])
  method?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateFollowUpDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  completedAt?: string;

  @ApiPropertyOptional({ enum: ['CALL', 'EMAIL', 'VISIT', 'MESSAGE'] })
  @IsString()
  @IsOptional()
  @IsIn(['CALL', 'EMAIL', 'VISIT', 'MESSAGE'])
  method?: string;

  @ApiPropertyOptional({ enum: ['REACHED', 'NO_ANSWER', 'SCHEDULED_VISIT', 'LEFT_MESSAGE', 'CONVERTED'] })
  @IsString()
  @IsOptional()
  outcome?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
