import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum EmployeeTypeCategoryEnum {
  TEACHING = 'TEACHING',
  NON_TEACHING = 'NON_TEACHING',
  SUPPORT = 'SUPPORT',
}

export class CreateEmployeeTypeDto {
  @ApiProperty({ description: 'Employee type name', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Short unique code', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ enum: EmployeeTypeCategoryEnum, description: 'Category of employee type' })
  @IsEnum(EmployeeTypeCategoryEnum)
  @IsNotEmpty()
  category: EmployeeTypeCategoryEnum;
}
