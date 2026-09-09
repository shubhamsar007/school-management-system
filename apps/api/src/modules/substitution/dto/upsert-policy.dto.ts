import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpsertPolicyDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(20)  maxSubsPerDay?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(50)  maxSubsPerWeek?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) autoAssignThreshold?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(120) escalateAfterMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(365) fairnessWindowDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) weightSubject?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) weightWorkload?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) weightFairness?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) weightDept?: number;
  @ApiPropertyOptional() @IsOptional() @IsIn(['MANUAL', 'AUTO_SUGGEST', 'AUTO_ASSIGN', 'HYBRID']) mode?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyTeacher?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyParents?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() subjectMatchRequired?: boolean;
}
