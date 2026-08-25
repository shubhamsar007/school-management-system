import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRefundDto {
  @ApiProperty({ example: 500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Student withdrew from hostel' })
  @IsString()
  reason: string;

  @ApiProperty({ example: 'CASH', description: 'CASH | CHEQUE | UPI | NEFT | BANK_TRANSFER' })
  @IsString()
  @MaxLength(20)
  refundMethod: string;

  @ApiPropertyOptional({ example: 'REF-TXN-001' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  transactionReference?: string;
}
