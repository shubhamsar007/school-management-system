import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RejectLeaveEncashmentDto {
  @ApiProperty()
  @IsString()
  reason: string;
}
