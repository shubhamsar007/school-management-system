import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateStudentFeeAssignmentDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  enrollmentId: string;

  @ApiProperty()
  @IsUUID()
  feeStructureId: string;

  @ApiPropertyOptional({ example: 500, description: 'Flat discount amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @ApiPropertyOptional({ example: 1000, description: 'Scholarship amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  scholarshipAmount?: number;

  @ApiProperty({ example: '2024-04-01' })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({ example: '2025-03-31' })
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;
}
