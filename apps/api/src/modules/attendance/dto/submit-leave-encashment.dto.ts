import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, IsNumber, Min } from 'class-validator';

export class SubmitLeaveEncashmentDto {
  @ApiProperty()
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  days: number;

  @ApiProperty({ description: 'Amount per day in currency units' })
  @IsNumber()
  @Min(0)
  amountPerDay: number;
}
