import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class RegisterFileDto {
  @ApiProperty({
    example: 'R2',
    description: 'Storage provider: R2 | S3 | LOCAL',
  })
  @IsString()
  @IsIn(['R2', 'S3', 'LOCAL'])
  storageProvider: string;

  @ApiProperty({ example: 'org_uuid/students/profile_photos/photo.jpg' })
  @IsString()
  @MaxLength(500)
  storageKey: string;

  @ApiProperty({ example: 'student_photo.jpg' })
  @IsString()
  @MaxLength(255)
  originalName: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @MaxLength(100)
  mimeType: string;

  @ApiProperty({ example: 204800, description: 'File size in bytes' })
  @IsNumber()
  @Min(1)
  sizeBytes: number;

  @ApiPropertyOptional({ example: 'abc123...', description: 'SHA-256 checksum for integrity verification' })
  @IsString()
  @MaxLength(64)
  @IsOptional()
  checksum?: string;
}

export class PresignedUrlRequestDto {
  @ApiProperty({ example: 'student_photo.jpg' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @MaxLength(100)
  mimeType: string;

  @ApiProperty({
    example: 'students/profile_photos',
    description: 'Folder path within the bucket (without leading slash)',
  })
  @IsString()
  @MaxLength(255)
  folder: string;
}
