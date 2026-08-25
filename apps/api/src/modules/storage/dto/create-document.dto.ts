import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ description: 'File ID returned after file registration' })
  @IsUUID()
  fileId: string;

  @ApiProperty({
    example: 'BIRTH_CERTIFICATE',
    description: 'Document type (e.g. BIRTH_CERTIFICATE, AADHAAR, TRANSFER_CERTIFICATE, PHOTO, OTHER)',
  })
  @IsString()
  @MaxLength(100)
  documentType: string;

  @ApiProperty({
    example: 'STUDENT',
    description: 'Entity this document belongs to: STUDENT | EMPLOYEE | APPLICATION',
  })
  @IsString()
  @IsIn(['STUDENT', 'EMPLOYEE', 'APPLICATION'])
  entityType: string;

  @ApiProperty({ description: 'ID of the entity (student ID, employee ID, etc.)' })
  @IsUUID()
  entityId: string;

  @ApiPropertyOptional({ example: '2030-12-31', description: 'Document expiry date' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

export class VerifyDocumentDto {
  @ApiProperty({
    example: 'VERIFIED',
    description: 'VERIFIED | REJECTED',
  })
  @IsString()
  @IsIn(['VERIFIED', 'REJECTED'])
  verificationStatus: string;
}
