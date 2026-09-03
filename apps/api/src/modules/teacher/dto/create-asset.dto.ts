import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({ example: 'LAPTOP' })
  @IsString()
  assetType: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assetCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expectedReturn?: string;

  @ApiPropertyOptional({ enum: ['GOOD', 'FAIR', 'POOR', 'DAMAGED'] })
  @IsIn(['GOOD', 'FAIR', 'POOR', 'DAMAGED'])
  @IsOptional()
  condition?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  issuedBy?: string;
}
