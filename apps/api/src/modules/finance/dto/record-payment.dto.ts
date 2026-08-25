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

export class PaymentAllocationDto {
  @ApiProperty({ description: 'Invoice ID to allocate payment towards' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ example: 5000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}

export class RecordPaymentDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 5000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'CASH', description: 'CASH | CHEQUE | UPI | NEFT | CARD | DD | ONLINE' })
  @IsString()
  @MaxLength(20)
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'TXN123456' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  transactionReference?: string;

  @ApiProperty({ example: '2024-04-20' })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({ description: 'Allocations to specific invoices' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationDto)
  @IsOptional()
  allocations?: PaymentAllocationDto[];
}
