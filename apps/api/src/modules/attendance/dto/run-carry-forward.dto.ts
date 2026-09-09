import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RunCarryForwardDto {
  @ApiProperty({ description: 'Academic year to carry forward FROM' })
  @IsUUID()
  fromAcademicYearId: string;

  @ApiProperty({ description: 'Academic year to carry forward INTO' })
  @IsUUID()
  toAcademicYearId: string;
}
