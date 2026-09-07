import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RequestRevisionDto {
  @ApiProperty({ description: 'What needs to be revised' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  revisionNote: string;
}
