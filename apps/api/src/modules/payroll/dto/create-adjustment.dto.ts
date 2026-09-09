import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAdjustmentDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    example: 'BONUS',
    description: 'BONUS | OVERTIME | ARREAR | REIMBURSEMENT | DEDUCTION | OTHER',
  })
  @IsString()
  @IsIn(['BONUS', 'OVERTIME', 'ARREAR', 'REIMBURSEMENT', 'DEDUCTION', 'OTHER'])
  adjustmentType: string;

  @ApiPropertyOptional({
    example: 'PERFORMANCE',
    description: 'Sub-type, e.g. PERFORMANCE / FESTIVAL / ANNUAL for BONUS',
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  subType?: string;

  @ApiPropertyOptional({ example: 'Q2 performance bonus' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 5000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    example: '2026-09',
    description: 'Payroll month this adjustment belongs to (YYYY-MM)',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'effectivePeriod must be YYYY-MM' })
  effectivePeriod: string;
}

export class RejectAdjustmentDto {
  @ApiPropertyOptional({ example: 'Budget exceeded' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
