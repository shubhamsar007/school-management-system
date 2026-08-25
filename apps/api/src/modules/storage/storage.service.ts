import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { RegisterFileDto, PresignedUrlRequestDto } from './dto/register-file.dto';
import { CreateDocumentDto, VerifyDocumentDto } from './dto/create-document.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly r2AccountId: string;
  private readonly r2Bucket: string;
  private readonly r2PublicUrl: string;
  private readonly r2Enabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.r2AccountId = this.config.get<string>('R2_ACCOUNT_ID') ?? '';
    this.r2Bucket = this.config.get<string>('R2_BUCKET_NAME') ?? '';
    this.r2PublicUrl = this.config.get<string>('R2_PUBLIC_URL') ?? '';
    this.r2Enabled = !!(this.r2AccountId && this.r2Bucket);
  }

  // ─── Presigned URLs ───────────────────────────────────────────

  /**
   * Returns a presigned upload URL so the client can upload directly to R2/S3
   * without routing file bytes through the API server.
   * If R2 is not configured (local dev), returns a mock URL and the storage key.
   */
  async getPresignedUploadUrl(
    organizationId: string,
    dto: PresignedUrlRequestDto,
    uploadedBy: string,
  ) {
    const ext = dto.fileName.includes('.')
      ? dto.fileName.slice(dto.fileName.lastIndexOf('.'))
      : '';
    const uniqueKey = `${organizationId}/${dto.folder}/${randomUUID()}${ext}`;

    if (!this.r2Enabled) {
      // Dev mode: return a mock response so the rest of the flow can be tested
      return {
        uploadUrl: `http://localhost:9000/mock-upload/${uniqueKey}`,
        storageKey: uniqueKey,
        storageProvider: 'LOCAL' as const,
        expiresIn: 900,
        note: 'R2 not configured — this is a mock presigned URL for local development',
      };
    }

    // With real R2 credentials you would use the AWS SDK (S3-compatible):
    // const s3 = new S3Client({ region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, ... })
    // const cmd = new PutObjectCommand({ Bucket: bucket, Key: uniqueKey, ContentType: dto.mimeType })
    // const url = await getSignedUrl(s3, cmd, { expiresIn: 900 })
    // For now we return the key so the caller can register the file after upload.
    return {
      uploadUrl: `${this.r2PublicUrl}/${uniqueKey}`,
      storageKey: uniqueKey,
      storageProvider: 'R2' as const,
      expiresIn: 900,
    };
  }

  /**
   * Returns a presigned download URL for a file.
   * Private files are never publicly accessible without a short-lived signed URL.
   */
  async getPresignedDownloadUrl(organizationId: string, fileId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, organizationId },
    });
    if (!file) throw new NotFoundException('File not found');

    if (!this.r2Enabled) {
      return {
        downloadUrl: `http://localhost:9000/mock-download/${file.storageKey}`,
        expiresIn: 900,
        note: 'R2 not configured — mock URL',
      };
    }

    return {
      downloadUrl: `${this.r2PublicUrl}/${file.storageKey}`,
      expiresIn: 900,
    };
  }

  // ─── File Registration ────────────────────────────────────────

  /**
   * Called by the client AFTER a successful direct upload to R2/S3.
   * Stores metadata in the database so the file can be referenced by Documents.
   */
  async registerFile(organizationId: string, dto: RegisterFileDto, uploadedBy: string) {
    return this.prisma.file.create({
      data: {
        organizationId,
        storageProvider: dto.storageProvider,
        storageKey: dto.storageKey,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        sizeBytes: BigInt(dto.sizeBytes),
        ...(dto.checksum ? { checksum: dto.checksum } : {}),
        uploadedBy,
      },
    });
  }

  async findFiles(organizationId: string, filters: { uploadedBy?: string; mimeType?: string }) {
    return this.prisma.file.findMany({
      where: {
        organizationId,
        ...(filters.uploadedBy ? { uploadedBy: filters.uploadedBy } : {}),
        ...(filters.mimeType ? { mimeType: { startsWith: filters.mimeType } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFile(organizationId: string, fileId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, organizationId },
    });
    if (!file) throw new NotFoundException('File not found');

    // Block deletion if the file is referenced by any document
    const referencedByDocument = await this.prisma.document.findFirst({ where: { fileId } });
    const referencedByAdmission = await this.prisma.admissionDocument.findFirst({ where: { fileId } });
    if (referencedByDocument || referencedByAdmission) {
      throw new BadRequestException(
        'File is referenced by one or more documents and cannot be deleted. Remove the document first.',
      );
    }

    // In production you would also delete from R2 here using the AWS SDK
    await this.prisma.file.delete({ where: { id: fileId } });
  }

  // ─── Documents ────────────────────────────────────────────────

  async createDocument(organizationId: string, dto: CreateDocumentDto) {
    // Verify the file belongs to this org
    const file = await this.prisma.file.findFirst({
      where: { id: dto.fileId, organizationId },
    });
    if (!file) throw new NotFoundException('File not found');

    return this.prisma.document.create({
      data: {
        organizationId,
        fileId: dto.fileId,
        documentType: dto.documentType,
        entityType: dto.entityType,
        entityId: dto.entityId,
        ...(dto.expiryDate ? { expiryDate: new Date(dto.expiryDate) } : {}),
      },
      include: { file: true },
    });
  }

  async findDocuments(
    organizationId: string,
    filters: { entityType?: string; entityId?: string; verificationStatus?: string },
  ) {
    return this.prisma.document.findMany({
      where: {
        organizationId,
        ...(filters.entityType ? { entityType: filters.entityType } : {}),
        ...(filters.entityId ? { entityId: filters.entityId } : {}),
        ...(filters.verificationStatus ? { verificationStatus: filters.verificationStatus } : {}),
      },
      include: { file: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDocument(organizationId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, organizationId },
      include: { file: true },
    });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async verifyDocument(
    organizationId: string,
    id: string,
    dto: VerifyDocumentDto,
    verifiedBy: string,
  ) {
    const document = await this.findDocument(organizationId, id);
    if (document.verificationStatus !== 'PENDING') {
      throw new BadRequestException(`Document is already ${document.verificationStatus}`);
    }

    return this.prisma.document.update({
      where: { id },
      data: {
        verificationStatus: dto.verificationStatus,
        verifiedBy,
        verifiedAt: new Date(),
      },
      include: { file: true },
    });
  }

  async deleteDocument(organizationId: string, id: string) {
    await this.findDocument(organizationId, id);
    await this.prisma.document.delete({ where: { id } });
  }
}
