import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: '42 School Road' })
  @IsString()
  @Length(1, 255)
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Near City Park' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Opposite Bus Stand' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'Mumbai Suburban' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  state: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  postalCode: string;

  @ApiPropertyOptional({ example: 'IN' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 19.076 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: 72.8777 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;
}
