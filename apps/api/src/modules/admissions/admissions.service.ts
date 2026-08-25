import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { AddDocumentDto, VerifyDocumentDto } from './dto/add-document.dto';

@Injectable()
export class AdmissionsService {
  constructor(private prisma: PrismaService) {}

  // ─── Enquiries ────────────────────────────────────────────────

  async createEnquiry(organizationId: string, dto: CreateEnquiryDto) {
    if (dto.campusId) {
      const campus = await this.prisma.campus.findFirst({
        where: { id: dto.campusId, organizationId, deletedAt: null },
      });
      if (!campus) throw new NotFoundException('Campus not found');
    }

    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findFirst({
        where: { id: dto.academicYearId, organizationId },
      });
      if (!year) throw new NotFoundException('Academic year not found');
    }

    if (dto.classInterestedId) {
      const cls = await this.prisma.academicClass.findFirst({
        where: { id: dto.classInterestedId, organizationId },
      });
      if (!cls) throw new NotFoundException('Class not found');
    }

    return this.prisma.admissionEnquiry.create({
      data: {
        organizationId,
        campusId: dto.campusId ?? null,
        academicYearId: dto.academicYearId ?? null,
        studentName: dto.studentName,
        parentName: dto.parentName ?? null,
        phone: dto.phone,
        email: dto.email ?? null,
        classInterestedId: dto.classInterestedId ?? null,
        source: dto.source,
        notes: dto.notes ?? null,
        assignedTo: dto.assignedTo ?? null,
        status: 'NEW',
      },
    });
  }

  async findEnquiries(
    organizationId: string,
    filters: { status?: string; assignedTo?: string; campusId?: string },
  ) {
    return this.prisma.admissionEnquiry.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.assignedTo ? { assignedTo: filters.assignedTo } : {}),
        ...(filters.campusId ? { campusId: filters.campusId } : {}),
      },
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findEnquiry(organizationId: string, enquiryId: string) {
    const enquiry = await this.prisma.admissionEnquiry.findFirst({
      where: { id: enquiryId, organizationId },
      include: {
        applications: {
          select: {
            id: true,
            applicationNumber: true,
            status: true,
            submittedAt: true,
          },
        },
      },
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found');
    return enquiry;
  }

  async updateEnquiry(organizationId: string, enquiryId: string, dto: UpdateEnquiryDto) {
    const enquiry = await this.findEnquiry(organizationId, enquiryId);

    return this.prisma.admissionEnquiry.update({
      where: { id: enquiryId },
      data: {
        ...(dto.studentName !== undefined ? { studentName: dto.studentName } : {}),
        ...(dto.parentName !== undefined ? { parentName: dto.parentName ?? null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.email !== undefined ? { email: dto.email ?? null } : {}),
        ...(dto.classInterestedId !== undefined ? { classInterestedId: dto.classInterestedId ?? null } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes ?? null } : {}),
        ...(dto.assignedTo !== undefined ? { assignedTo: dto.assignedTo ?? null } : {}),
      },
    });
  }

  // ─── Applications ─────────────────────────────────────────────

  async createApplication(organizationId: string, dto: CreateApplicationDto) {
    const existing = await this.prisma.admissionApplication.findUnique({
      where: {
        organizationId_applicationNumber: {
          organizationId,
          applicationNumber: dto.applicationNumber,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Application number '${dto.applicationNumber}' already exists`,
      );
    }

    if (dto.enquiryId) {
      const enquiry = await this.prisma.admissionEnquiry.findFirst({
        where: { id: dto.enquiryId, organizationId },
      });
      if (!enquiry) throw new NotFoundException('Enquiry not found');
    }

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, organizationId },
    });
    if (!academicYear) throw new NotFoundException('Academic year not found');

    const cls = await this.prisma.academicClass.findFirst({
      where: { id: dto.classId, organizationId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    return this.prisma.admissionApplication.create({
      data: {
        organizationId,
        enquiryId: dto.enquiryId ?? null,
        applicationNumber: dto.applicationNumber,
        academicYearId: dto.academicYearId,
        classId: dto.classId,
        studentPersonId: dto.studentPersonId ?? null,
        status: 'DRAFT',
      },
      include: { documents: true },
    });
  }

  async findApplications(
    organizationId: string,
    filters: { status?: string; academicYearId?: string; classId?: string },
  ) {
    return this.prisma.admissionApplication.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
        ...(filters.classId ? { classId: filters.classId } : {}),
      },
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findApplication(organizationId: string, applicationId: string) {
    const application = await this.prisma.admissionApplication.findFirst({
      where: { id: applicationId, organizationId },
      include: {
        enquiry: true,
        documents: {
          include: { file: true },
        },
      },
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  async submitApplication(organizationId: string, applicationId: string) {
    const application = await this.findApplication(organizationId, applicationId);

    if (application.status !== 'DRAFT') {
      throw new BadRequestException(`Application is already ${application.status.toLowerCase()}`);
    }

    return this.prisma.admissionApplication.update({
      where: { id: applicationId },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
  }

  async approveApplication(organizationId: string, applicationId: string) {
    const application = await this.findApplication(organizationId, applicationId);

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      throw new BadRequestException(
        'Only SUBMITTED or UNDER_REVIEW applications can be approved',
      );
    }

    // Mark enquiry as converted if linked
    if (application.enquiryId) {
      await this.prisma.admissionEnquiry.update({
        where: { id: application.enquiryId },
        data: { status: 'CONVERTED' },
      });
    }

    return this.prisma.admissionApplication.update({
      where: { id: applicationId },
      data: { status: 'APPROVED', approvedAt: new Date() },
    });
  }

  async rejectApplication(
    organizationId: string,
    applicationId: string,
    dto: RejectApplicationDto,
  ) {
    const application = await this.findApplication(organizationId, applicationId);

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      throw new BadRequestException(
        'Only SUBMITTED or UNDER_REVIEW applications can be rejected',
      );
    }

    return this.prisma.admissionApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: dto.rejectionReason ?? null,
      },
    });
  }

  async setUnderReview(organizationId: string, applicationId: string) {
    const application = await this.findApplication(organizationId, applicationId);

    if (application.status !== 'SUBMITTED') {
      throw new BadRequestException('Only SUBMITTED applications can be moved to UNDER_REVIEW');
    }

    return this.prisma.admissionApplication.update({
      where: { id: applicationId },
      data: { status: 'UNDER_REVIEW' },
    });
  }

  // ─── Documents ────────────────────────────────────────────────

  async addDocument(organizationId: string, applicationId: string, dto: AddDocumentDto) {
    await this.findApplication(organizationId, applicationId);

    const file = await this.prisma.file.findFirst({
      where: { id: dto.fileId },
    });
    if (!file) throw new NotFoundException('File not found');

    const duplicate = await this.prisma.admissionDocument.findFirst({
      where: { applicationId, documentType: dto.documentType },
    });
    if (duplicate) {
      throw new ConflictException(
        `A document of type '${dto.documentType}' is already attached to this application`,
      );
    }

    return this.prisma.admissionDocument.create({
      data: {
        applicationId,
        fileId: dto.fileId,
        documentType: dto.documentType,
        verificationStatus: 'PENDING',
      },
      include: { file: true },
    });
  }

  async findDocuments(organizationId: string, applicationId: string) {
    await this.findApplication(organizationId, applicationId);

    return this.prisma.admissionDocument.findMany({
      where: { applicationId },
      include: { file: true },
      orderBy: { documentType: 'asc' },
    });
  }

  async verifyDocument(
    organizationId: string,
    applicationId: string,
    documentId: string,
    verifiedBy: string,
    dto: VerifyDocumentDto,
  ) {
    await this.findApplication(organizationId, applicationId);

    const doc = await this.prisma.admissionDocument.findFirst({
      where: { id: documentId, applicationId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.admissionDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedBy,
        verifiedAt: new Date(),
        remarks: dto.remarks ?? null,
      },
      include: { file: true },
    });
  }

  async rejectDocument(
    organizationId: string,
    applicationId: string,
    documentId: string,
    verifiedBy: string,
    dto: VerifyDocumentDto,
  ) {
    await this.findApplication(organizationId, applicationId);

    const doc = await this.prisma.admissionDocument.findFirst({
      where: { id: documentId, applicationId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.admissionDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: 'REJECTED',
        verifiedBy,
        verifiedAt: new Date(),
        remarks: dto.remarks ?? null,
      },
      include: { file: true },
    });
  }

  async removeDocument(organizationId: string, applicationId: string, documentId: string) {
    await this.findApplication(organizationId, applicationId);

    const doc = await this.prisma.admissionDocument.findFirst({
      where: { id: documentId, applicationId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    await this.prisma.admissionDocument.delete({ where: { id: documentId } });
  }
}
