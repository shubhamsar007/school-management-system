import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePromotionRunDto {
  @ApiProperty({ description: 'Academic year students are currently enrolled in' })
  @IsUUID()
  fromYearId: string;

  @ApiProperty({ description: 'Academic year students will be promoted into' })
  @IsUUID()
  toYearId: string;

  @ApiProperty({ description: 'Class students are currently enrolled in' })
  @IsUUID()
  fromClassId: string;

  @ApiProperty({ description: 'Class students will be promoted to' })
  @IsUUID()
  toClassId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
