import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTrainingRecordDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'INTERNAL' })
  @IsString()
  trainingType: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  durationHours?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'VERIFIED', 'REJECTED'] })
  @IsIn(['PENDING', 'VERIFIED', 'REJECTED'])
  @IsOptional()
  verificationStatus?: string;
}
