import { IsString, IsOptional, IsEmail, IsUrl, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Sunrise Public School' })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiProperty({ example: 'SPS001' })
  @IsString()
  @Length(2, 50)
  code: string;

  @ApiProperty({ example: 'SCHOOL', description: 'SCHOOL | COLLEGE | COACHING' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: 'admin@sunrise.edu' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://sunrise.edu' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
