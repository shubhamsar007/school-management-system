import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ManualSubstitutionDto {
  @ApiProperty({ description: 'Leave request ID to create substitution requests for' })
  @IsUUID()
  leaveRequestId: string;
}

export class DeclineAssignmentDto {
  @ApiPropertyOptional({ description: 'Reason for declining' })
  @IsOptional()
  reason?: string;
}
