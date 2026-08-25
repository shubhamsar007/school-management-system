import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  applicationNumber: string;

  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({ description: 'Link to an existing enquiry' })
  @IsUUID()
  @IsOptional()
  enquiryId?: string;

  @ApiPropertyOptional({ description: 'Person ID if student record already exists' })
  @IsUUID()
  @IsOptional()
  studentPersonId?: string;
}
