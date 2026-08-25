import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FeeInvoiceItemDto {
  @ApiProperty()
  @IsUUID()
  feeHeadId: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 5000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  discount?: number;
}

export class CreateFeeInvoiceDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  enrollmentId: string;

  @ApiProperty({ example: '2024-04-15' })
  @IsDateString()
  invoiceDate: string;

  @ApiProperty({ example: '2024-04-30' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  fine?: number;

  @ApiProperty({ type: [FeeInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeInvoiceItemDto)
  items: FeeInvoiceItemDto[];
}
