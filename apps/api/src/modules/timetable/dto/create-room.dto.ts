import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty()
  @IsUUID()
  campusId: string;

  @ApiPropertyOptional({ description: 'Building the room belongs to' })
  @IsUUID()
  @IsOptional()
  buildingId?: string;

  @ApiProperty({ example: 'Room 101' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '101' })
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty({
    example: 'CLASSROOM',
    description: 'CLASSROOM | LAB | LIBRARY | AUDITORIUM | STAFF_ROOM | OFFICE | STORE',
  })
  @IsString()
  @IsIn(['CLASSROOM', 'LAB', 'LIBRARY', 'AUDITORIUM', 'STAFF_ROOM', 'OFFICE', 'STORE'])
  roomType: string;

  @ApiPropertyOptional({ example: 40 })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'ACTIVE | INACTIVE | MAINTENANCE' })
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
  @IsOptional()
  status?: string;
}
