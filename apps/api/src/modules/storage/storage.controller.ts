import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RegisterFileDto, PresignedUrlRequestDto } from './dto/register-file.dto';
import { CreateDocumentDto, VerifyDocumentDto } from './dto/create-document.dto';

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'storage', version: '1' })
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  // ─── Presigned URLs ───────────────────────────────────────────

  @ApiOperation({
    summary: 'Get a presigned upload URL — client uploads directly to R2, then calls /files/register',
  })
  @Post('presigned-upload')
  @HttpCode(HttpStatus.OK)
  getPresignedUploadUrl(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: PresignedUrlRequestDto,
  ) {
    return this.storageService.getPresignedUploadUrl(user.organizationId, dto, user.userId);
  }

  @ApiOperation({ summary: 'Get a short-lived presigned download URL for a private file' })
  @Get('files/:fileId/download-url')
  getPresignedDownloadUrl(
    @CurrentUser() user: CurrentUserPayload,
    @Param('fileId') fileId: string,
  ) {
    return this.storageService.getPresignedDownloadUrl(user.organizationId, fileId);
  }

  // ─── Files ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Register file metadata after a successful direct upload to R2/S3' })
  @Post('files/register')
  registerFile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RegisterFileDto,
  ) {
    return this.storageService.registerFile(user.organizationId, dto, user.userId);
  }

  @ApiOperation({ summary: 'List files for this organization' })
  @ApiQuery({ name: 'uploadedBy', required: false })
  @ApiQuery({ name: 'mimeType', required: false, description: 'Prefix match, e.g. "image/" or "application/pdf"' })
  @Get('files')
  findFiles(
    @CurrentUser() user: CurrentUserPayload,
    @Query('uploadedBy') uploadedBy?: string,
    @Query('mimeType') mimeType?: string,
  ) {
    return this.storageService.findFiles(user.organizationId, {
      ...(uploadedBy ? { uploadedBy } : {}),
      ...(mimeType ? { mimeType } : {}),
    });
  }

  @ApiOperation({ summary: 'Delete a file (blocked if referenced by a document)' })
  @Delete('files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFile(
    @CurrentUser() user: CurrentUserPayload,
    @Param('fileId') fileId: string,
  ) {
    return this.storageService.deleteFile(user.organizationId, fileId);
  }

  // ─── Documents ────────────────────────────────────────────────

  @ApiOperation({ summary: 'Attach a registered file to a business entity as a document' })
  @Post('documents')
  createDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.storageService.createDocument(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List documents' })
  @ApiQuery({ name: 'entityType', required: false, description: 'STUDENT | EMPLOYEE | APPLICATION' })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'verificationStatus', required: false, description: 'PENDING | VERIFIED | REJECTED' })
  @Get('documents')
  findDocuments(
    @CurrentUser() user: CurrentUserPayload,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('verificationStatus') verificationStatus?: string,
  ) {
    return this.storageService.findDocuments(user.organizationId, {
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(verificationStatus ? { verificationStatus } : {}),
    });
  }

  @ApiOperation({ summary: 'Get a document by ID' })
  @Get('documents/:id')
  findDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.storageService.findDocument(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Verify or reject a document (PENDING → VERIFIED | REJECTED)' })
  @Patch('documents/:id/verify')
  verifyDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: VerifyDocumentDto,
  ) {
    return this.storageService.verifyDocument(user.organizationId, id, dto, user.userId);
  }

  @ApiOperation({ summary: 'Delete a document record (does not delete the underlying file)' })
  @Delete('documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.storageService.deleteDocument(user.organizationId, id);
  }
}
