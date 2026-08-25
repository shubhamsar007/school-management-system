import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSalaryComponentDto {
  @ApiProperty({ example: 'House Rent Allowance' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'HRA' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'EARNING', description: 'EARNING | DEDUCTION' })
  @IsString()
  @IsIn(['EARNING', 'DEDUCTION'])
  componentType: string;

  @ApiProperty({
    example: 'PERCENTAGE_OF_BASIC',
    description: 'FIXED | PERCENTAGE_OF_BASIC | PERCENTAGE_OF_GROSS',
  })
  @IsString()
  @IsIn(['FIXED', 'PERCENTAGE_OF_BASIC', 'PERCENTAGE_OF_GROSS'])
  calculationType: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'ACTIVE | INACTIVE' })
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: string;
}
