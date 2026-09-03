import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, MaxLength, IsIn } from 'class-validator';

export class CreateQualificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  degree: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  institution: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  university?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  specialization?: string;

  @ApiProperty()
  @IsInt()
  @Min(1950)
  @Max(2100)
  startYear: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  @IsOptional()
  endYear?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  percentage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  grade?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'VERIFIED', 'REJECTED'] })
  @IsIn(['PENDING', 'VERIFIED', 'REJECTED'])
  @IsOptional()
  verificationStatus?: string;
}
