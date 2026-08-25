import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FeeStructureItemDto {
  @ApiProperty()
  @IsUUID()
  feeHeadId: string;

  @ApiProperty({ example: 5000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'MONTHLY', description: 'MONTHLY | QUARTERLY | HALF_YEARLY | ANNUALLY | ONE_TIME' })
  @IsString()
  @MaxLength(20)
  frequency: string;

  @ApiPropertyOptional({ example: 10, description: 'Day of month the fee is due' })
  @IsInt()
  @Min(1)
  @IsOptional()
  dueDay?: number;
}

export class CreateFeeStructureDto {
  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty({ example: 'Class 10 Fee Structure 2024-25' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ type: [FeeStructureItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeStructureItemDto)
  @IsOptional()
  items?: FeeStructureItemDto[];
}
