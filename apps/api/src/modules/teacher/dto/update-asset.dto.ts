import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class UpdateAssetDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  returnedDate?: string;

  @ApiPropertyOptional({ enum: ['GOOD', 'FAIR', 'POOR', 'DAMAGED'] })
  @IsIn(['GOOD', 'FAIR', 'POOR', 'DAMAGED'])
  @IsOptional()
  returnCondition?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expectedReturn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['GOOD', 'FAIR', 'POOR', 'DAMAGED'] })
  @IsIn(['GOOD', 'FAIR', 'POOR', 'DAMAGED'])
  @IsOptional()
  condition?: string;
}
