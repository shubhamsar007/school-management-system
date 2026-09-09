import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateManualRequestDto {
  @ApiProperty({ description: 'Absent employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Date of absence (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Reason for absence' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Specific period IDs to cover (if partial day)' })
  @IsOptional()
  @IsUUID('all', { each: true })
  periodIds?: string[];

  @ApiPropertyOptional({
    description:
      'Leave request ID to associate with this substitution request. ' +
      'Required if the underlying DB schema does not allow a null leave_request_id.',
  })
  @IsOptional()
  @IsUUID()
  leaveRequestId?: string;
}
