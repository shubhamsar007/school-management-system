import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class CreatePtmBookingDto {
  @ApiProperty()
  @IsUUID()
  teacherId: string;

  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  guardianId: string;

  @ApiProperty({ example: '2024-09-15T09:00:00.000Z', description: 'Slot start (ISO datetime)' })
  @IsString()
  @IsNotEmpty()
  slotStart: string;

  @ApiProperty({ example: '2024-09-15T09:15:00.000Z', description: 'Slot end (ISO datetime)' })
  @IsString()
  @IsNotEmpty()
  slotEnd: string;
}
