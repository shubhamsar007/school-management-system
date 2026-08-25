import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreatePtmTeacherSlotDto {
  @ApiProperty()
  @IsUUID()
  teacherId: string;

  @ApiProperty({ example: '09:00', description: 'HH:MM format' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '13:00', description: 'HH:MM format' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
