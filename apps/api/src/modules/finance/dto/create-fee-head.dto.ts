import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFeeHeadDto {
  @ApiProperty({ example: 'Tuition Fee' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'TUITION' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'ACADEMIC', description: 'ACADEMIC | TRANSPORT | HOSTEL | MISC' })
  @IsString()
  @MaxLength(30)
  category: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isRefundable?: boolean;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'ACTIVE | INACTIVE' })
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: string;
}
