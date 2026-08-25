import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty()
  @IsUUID()
  roleId: string;

  @ApiPropertyOptional({ description: 'Scope role to a specific campus. Omit for org-wide.' })
  @IsUUID()
  @IsOptional()
  campusId?: string;
}
