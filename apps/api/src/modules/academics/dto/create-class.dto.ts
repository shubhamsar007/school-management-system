import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: 'Grade 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'G1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiPropertyOptional({ description: 'Numeric level for ordering (e.g. 1 for Grade 1)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({ description: 'Display order in lists' })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
