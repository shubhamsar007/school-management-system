import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ConfirmAssignmentDto {
  @ApiProperty({ description: 'Employee ID of the substitute teacher' })
  @IsUUID()
  substituteTeacherId: string;
}
