import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCorrectionDto {
  @IsString()
  @IsNotEmpty()
  attendanceId!: string;

  @IsString()
  @IsNotEmpty()
  attendanceType!: string; // STUDENT | EMPLOYEE

  @IsString()
  @IsNotEmpty()
  originalStatus!: string;

  @IsString()
  @IsNotEmpty()
  requestedStatus!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
