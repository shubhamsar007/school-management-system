import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBuildingDto {
  @ApiProperty()
  @IsUUID()
  campusId: string;

  @ApiProperty({ example: 'Main Block' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'MAIN' })
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'ACTIVE | INACTIVE' })
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: string;
}
