import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class AddDocumentDto {
  @ApiProperty({ description: 'File ID from the storage module' })
  @IsUUID()
  fileId: string;

  @ApiProperty({ example: 'BIRTH_CERTIFICATE', description: 'Type of document' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentType: string;
}

export class VerifyDocumentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}
