import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class RejectApplicationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
