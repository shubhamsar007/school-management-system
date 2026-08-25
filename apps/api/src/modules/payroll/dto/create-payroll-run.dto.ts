import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreatePayrollRunDto {
  @ApiProperty({ example: '2024-04-01', description: 'Start of the payroll period' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2024-04-30', description: 'End of the payroll period' })
  @IsDateString()
  periodEnd: string;
}

export class ProcessPayrollRunDto {
  @ApiPropertyOptional({
    description: 'Restrict processing to specific employee IDs. Omit to process all active employees.',
  })
  @IsUUID(undefined, { each: true })
  @IsOptional()
  employeeIds?: string[];
}
