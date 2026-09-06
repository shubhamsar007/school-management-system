import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ description: 'Department name', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Short unique code', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ description: 'Optional description', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Campus UUID this department belongs to' })
  @IsUUID()
  @IsOptional()
  campusId?: string;
}
