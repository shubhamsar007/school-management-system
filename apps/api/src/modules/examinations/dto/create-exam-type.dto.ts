import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateExamTypeDto {
  @ApiProperty({ example: 'Unit Test' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'UT' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;
}
