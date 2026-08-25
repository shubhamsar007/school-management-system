import { IsString, IsOptional, IsEmail, Length, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateAddressDto } from './create-address.dto';

export class CreateCampusDto {
  @ApiProperty({ example: 'Main Campus' })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiProperty({ example: 'MAIN' })
  @IsString()
  @Length(1, 50)
  code: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'main@sunrise.edu' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: CreateAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;
}
