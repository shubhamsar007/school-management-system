import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, IsOptional, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSeatConfigDto {
  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  totalSeats: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  reservedSeats?: number;
}

export class UpdateSeatConfigDto extends PartialType(CreateSeatConfigDto) {}
