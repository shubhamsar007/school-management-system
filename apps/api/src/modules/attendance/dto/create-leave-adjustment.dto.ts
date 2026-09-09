import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, IsString } from 'class-validator';

export class CreateLeaveAdjustmentDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty()
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty({ description: 'Positive to add days, negative to deduct days' })
  @IsInt()
  delta: number;

  @ApiProperty()
  @IsString()
  reason: string;
}
