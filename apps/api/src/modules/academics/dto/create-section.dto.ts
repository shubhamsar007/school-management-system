import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateSectionDto {
  @ApiProperty()
  @IsUUID()
  campusId: string;

  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  name: string;

  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code: string;

  @ApiPropertyOptional({ description: 'Maximum student capacity' })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;
}
