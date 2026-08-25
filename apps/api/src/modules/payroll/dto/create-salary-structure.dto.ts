import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SalaryComponentLineDto {
  @ApiProperty({ description: 'SalaryComponent ID' })
  @IsUUID()
  salaryComponentId: string;

  @ApiPropertyOptional({ example: 5000, description: 'Fixed amount (for FIXED type)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: 40, description: 'Percentage (for PERCENTAGE_OF_BASIC / PERCENTAGE_OF_GROSS)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  percentage?: number;
}

export class CreateSalaryStructureDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: '2024-04-01' })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({ example: '2025-03-31' })
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @ApiProperty({ example: 25000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basicSalary: number;

  @ApiProperty({ example: 45000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  grossSalary: number;

  @ApiPropertyOptional({ type: [SalaryComponentLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryComponentLineDto)
  @IsOptional()
  components?: SalaryComponentLineDto[];
}
