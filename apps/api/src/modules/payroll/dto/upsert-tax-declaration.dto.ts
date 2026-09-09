import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpsertTaxDeclarationDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    example: '2026-2027',
    description: 'Financial year in YYYY-YYYY format (e.g. 2026-2027 = April 2026 – March 2027)',
  })
  @IsString()
  @Matches(/^\d{4}-\d{4}$/, { message: 'financialYear must be YYYY-YYYY' })
  financialYear: string;

  @ApiProperty({ example: 'NEW', description: 'OLD | NEW' })
  @IsString()
  @IsIn(['OLD', 'NEW'])
  taxRegime: string;

  @ApiProperty({
    example: 150000,
    description: 'Section 80C investments (ELSS, PPF, LIC, etc.) — max 1,50,000',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(150000)
  section80C: number;

  @ApiPropertyOptional({
    example: 60000,
    description: 'HRA exemption amount (actual exemption, not full rent)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  hraExemption?: number;

  @ApiPropertyOptional({
    example: 25000,
    description: 'Other deductions (80D, 80E, NPS etc.)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  otherDeductions?: number;
}
