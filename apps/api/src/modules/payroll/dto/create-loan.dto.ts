import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    example: 'PERSONAL_LOAN',
    description: 'SALARY_ADVANCE | PERSONAL_LOAN | VEHICLE_LOAN | OTHER',
  })
  @IsString()
  @IsIn(['SALARY_ADVANCE', 'PERSONAL_LOAN', 'VEHICLE_LOAN', 'OTHER'])
  loanType: string;

  @ApiProperty({ example: 120000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  principalAmount: number;

  @ApiProperty({ example: 10000, description: 'Monthly EMI deducted from salary' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  monthlyDeduction: number;

  @ApiProperty({ example: '2026-10-01', description: 'Date loan starts' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: 'Medical emergency' })
  @IsString()
  @IsOptional()
  reason?: string;
}
