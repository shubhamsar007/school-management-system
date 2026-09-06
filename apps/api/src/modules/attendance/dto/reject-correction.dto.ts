import { IsOptional, IsString } from 'class-validator';

export class RejectCorrectionDto {
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
