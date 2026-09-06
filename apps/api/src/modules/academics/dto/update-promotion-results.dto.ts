import { IsArray, IsIn, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PROMOTION_OUTCOMES = ['PROMOTED', 'HELD_BACK', 'TRANSFERRED'] as const;

export class PromotionResultItemDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: PROMOTION_OUTCOMES })
  @IsIn(PROMOTION_OUTCOMES)
  outcome: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePromotionResultsDto {
  @ApiProperty({ type: [PromotionResultItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionResultItemDto)
  results: PromotionResultItemDto[];
}
