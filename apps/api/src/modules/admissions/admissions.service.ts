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
import { EnrollApplicationDto } from './dto/enroll-application.dto';
import { WithdrawApplicationDto } from './dto/withdraw-application.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto/create-follow-up.dto';
import { CreateInterviewDto, UpdateInterviewDto } from './dto/create-interview.dto';

@Injectable()
export class AdmissionsService {
  constructor(private prisma: PrismaService) {}

  // ─── Stats ────────────────────────────────────────────────────

  async getStats(organizationId: string) {
    const [enquiryGroups, applicationGroups] = await Promise.all([
      this.prisma.admissionEnquiry.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { id: true },
      }),
      this.prisma.admissionApplication.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { id: true },
      }),
    ]);

    const enqMap: Record<string, number> = {};
    for (const r of enquiryGroups) enqMap[r.status] = r._count.id;

    const appMap: Record<string, number> = {};
    for (const r of applicationGroups) appMap[r.status] = r._count.id;

    return {
      enquiries: {
        total: Object.values(enqMap).reduce((a, b) => a + b, 0),
        byStatus: enqMap,
      },
      applications: {
        total: Object.values(appMap).reduce((a, b) => a + b, 0),
        byStatus: appMap,
        pendingReview: (appMap['SUBMITTED'] ?? 0) + (appMap['UNDER_REVIEW'] ?? 0),
      },
    };
  }

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
    filters: {
      status?: string;
      assignedTo?: string;
      campusId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(Math.max(1, filters.limit ?? 25), 100);
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.assignedTo ? { assignedTo: filters.assignedTo } : {}),
      ...(filters.campusId ? { campusId: filters.campusId } : {}),
      ...(filters.search
        ? {
            OR: [
              { studentName: { contains: filters.search, mode: 'insensitive' as const } },
              { parentName: { contains: filters.search, mode: 'insensitive' as const } },
              { phone: { contains: filters.search } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.admissionEnquiry.findMany({
        where,
        include: { _count: { select: { applications: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.admissionEnquiry.count({ where }),
    ]);

    // Enrich with classInterested name (no Prisma relation defined — manual lookup)
    const classIds = [
      ...new Set(rows.map((r) => r.classInterestedId).filter(Boolean)),
    ] as string[];
    const classes =
      classIds.length > 0
        ? await this.prisma.academicClass.findMany({
            where: { id: { in: classIds } },
            select: { id: true, name: true },
          })
        : [];
    const classMap = Object.fromEntries(classes.map((c) => [c.id, c]));

    return {
      data: rows.map((r) => ({
        ...r,
        classInterested: r.classInterestedId ? (classMap[r.classInterestedId] ?? null) : null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
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
            createdAt: true,
          },
        },
      },
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found');

    // Enrich with classInterested name
    const classInterested = enquiry.classInterestedId
      ? await this.prisma.academicClass.findFirst({
          where: { id: enquiry.classInterestedId },
          select: { id: true, name: true },
        })
      : null;

    return { ...enquiry, classInterested };
  }

  async updateEnquiry(organizationId: string, enquiryId: string, dto: UpdateEnquiryDto) {
    await this.findEnquiry(organizationId, enquiryId);

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
    filters: {
      status?: string;
      academicYearId?: string;
      classId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(Math.max(1, filters.limit ?? 25), 100);
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      ...(filters.classId ? { classId: filters.classId } : {}),
      ...(filters.search
        ? {
            OR: [
              { applicationNumber: { contains: filters.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.admissionApplication.findMany({
        where,
        include: {
          _count: { select: { documents: true } },
          enquiry: {
            select: { id: true, studentName: true, parentName: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.admissionApplication.count({ where }),
    ]);

    // Enrich with class and academic year names
    const classIds = [...new Set(rows.map((r) => r.classId))];
    const yearIds = [...new Set(rows.map((r) => r.academicYearId))];

    const [classes, years] = await Promise.all([
      classIds.length > 0
        ? this.prisma.academicClass.findMany({
            where: { id: { in: classIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      yearIds.length > 0
        ? this.prisma.academicYear.findMany({
            where: { id: { in: yearIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const classMap = Object.fromEntries(classes.map((c) => [c.id, c]));
    const yearMap = Object.fromEntries(years.map((y) => [y.id, y]));

    return {
      data: rows.map((r) => ({
        ...r,
        class: classMap[r.classId] ?? null,
        academicYear: yearMap[r.academicYearId] ?? null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
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

    // Enrich with class and academic year names
    const [cls, year] = await Promise.all([
      this.prisma.academicClass.findFirst({
        where: { id: application.classId },
        select: { id: true, name: true },
      }),
      this.prisma.academicYear.findFirst({
        where: { id: application.academicYearId },
        select: { id: true, name: true },
      }),
    ]);

    return { ...application, class: cls ?? null, academicYear: year ?? null };
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

  // ─── Enrollment ───────────────────────────────────────────────

  async enrollApplication(
    organizationId: string,
    applicationId: string,
    dto: EnrollApplicationDto,
  ) {
    const application = await this.findApplication(organizationId, applicationId);

    if (application.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED applications can be enrolled');
    }

    if (application.studentPersonId) {
      throw new ConflictException('Application has already been enrolled');
    }

    // Validate admission number uniqueness within org
    const existingStudent = await this.prisma.student.findFirst({
      where: { organizationId, admissionNumber: dto.admissionNumber },
    });
    if (existingStudent) {
      throw new ConflictException(
        `Admission number '${dto.admissionNumber}' is already in use`,
      );
    }

    // Validate section and get campusId
    const section = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, academicClassId: application.classId },
    });
    if (!section) {
      throw new NotFoundException(
        'Section not found or does not belong to the application class',
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const joiningDate = dto.joiningDate ? new Date(dto.joiningDate) : today;
    const enrollmentDate = dto.enrollmentDate ? new Date(dto.enrollmentDate) : today;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Person
      const person = await tx.person.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: application.enquiry?.phone ?? null,
          email: application.enquiry?.email ?? null,
        },
      });

      // 2. Create Student
      const student = await tx.student.create({
        data: {
          organizationId,
          personId: person.id,
          admissionNumber: dto.admissionNumber,
          admissionDate: joiningDate,
          joiningDate,
          studentStatus: 'ACTIVE',
          currentCampusId: section.campusId,
          admissionSource: 'ADMISSION_PROCESS',
        },
      });

      // 3. Create StudentEnrollment
      const enrollment = await tx.studentEnrollment.create({
        data: {
          studentId: student.id,
          academicYearId: application.academicYearId,
          campusId: section.campusId,
          classId: application.classId,
          sectionId: dto.sectionId,
          rollNumber: dto.rollNumber ?? null,
          enrollmentDate,
          status: 'ACTIVE',
        },
      });

      // 4. Update Application
      const updated = await tx.admissionApplication.update({
        where: { id: applicationId },
        data: { status: 'ENROLLED', studentPersonId: person.id },
      });

      return { application: updated, person, student, enrollment };
    });

    return result;
  }

  // ─── Withdrawal & Revision ────────────────────────────────────

  async withdrawApplication(
    organizationId: string,
    applicationId: string,
    dto: WithdrawApplicationDto,
  ) {
    const application = await this.findApplication(organizationId, applicationId);

    const terminal = ['ENROLLED', 'WITHDRAWN'];
    if (terminal.includes(application.status)) {
      throw new BadRequestException(`Application is already ${application.status.toLowerCase()}`);
    }

    return this.prisma.admissionApplication.update({
      where: { id: applicationId },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: new Date(),
        rejectionReason: dto.reason ?? null,
      },
    });
  }

  async requestRevision(
    organizationId: string,
    applicationId: string,
    dto: RequestRevisionDto,
  ) {
    const application = await this.findApplication(organizationId, applicationId);

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      throw new BadRequestException('Revision can only be requested for SUBMITTED or UNDER_REVIEW applications');
    }

    return this.prisma.admissionApplication.update({
      where: { id: applicationId },
      data: { status: 'REVISION_REQUESTED', revisionNote: dto.revisionNote },
    });
  }

  // ─── Follow-ups ───────────────────────────────────────────────

  async createFollowUp(
    organizationId: string,
    enquiryId: string,
    userId: string,
    dto: CreateFollowUpDto,
  ) {
    await this.findEnquiry(organizationId, enquiryId);

    return this.prisma.admissionFollowUp.create({
      data: {
        enquiryId,
        organizationId,
        scheduledAt: new Date(dto.scheduledAt),
        method: dto.method ?? 'CALL',
        notes: dto.notes ?? null,
        createdBy: userId,
      },
    });
  }

  async findFollowUps(organizationId: string, enquiryId: string) {
    await this.findEnquiry(organizationId, enquiryId);

    return this.prisma.admissionFollowUp.findMany({
      where: { enquiryId, organizationId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async updateFollowUp(
    organizationId: string,
    enquiryId: string,
    followUpId: string,
    dto: UpdateFollowUpDto,
  ) {
    await this.findEnquiry(organizationId, enquiryId);

    const followUp = await this.prisma.admissionFollowUp.findFirst({
      where: { id: followUpId, enquiryId, organizationId },
    });
    if (!followUp) throw new NotFoundException('Follow-up not found');

    return this.prisma.admissionFollowUp.update({
      where: { id: followUpId },
      data: {
        ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
        ...(dto.completedAt ? { completedAt: new Date(dto.completedAt) } : {}),
        ...(dto.method ? { method: dto.method } : {}),
        ...(dto.outcome !== undefined ? { outcome: dto.outcome ?? null } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes ?? null } : {}),
      },
    });
  }

  async deleteFollowUp(organizationId: string, enquiryId: string, followUpId: string) {
    await this.findEnquiry(organizationId, enquiryId);

    const followUp = await this.prisma.admissionFollowUp.findFirst({
      where: { id: followUpId, enquiryId, organizationId },
    });
    if (!followUp) throw new NotFoundException('Follow-up not found');

    await this.prisma.admissionFollowUp.delete({ where: { id: followUpId } });
  }

  // ─── Interviews ───────────────────────────────────────────────

  async createInterview(
    organizationId: string,
    applicationId: string,
    userId: string,
    dto: CreateInterviewDto,
  ) {
    await this.findApplication(organizationId, applicationId);

    return this.prisma.admissionInterview.create({
      data: {
        applicationId,
        organizationId,
        scheduledAt: new Date(dto.scheduledAt),
        format: dto.format ?? 'IN_PERSON',
        conductedBy: dto.conductedBy ?? null,
        notes: dto.notes ?? null,
        createdBy: userId,
      },
    });
  }

  async findInterviews(organizationId: string, applicationId: string) {
    await this.findApplication(organizationId, applicationId);

    return this.prisma.admissionInterview.findMany({
      where: { applicationId, organizationId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async updateInterview(
    organizationId: string,
    applicationId: string,
    interviewId: string,
    dto: UpdateInterviewDto,
  ) {
    await this.findApplication(organizationId, applicationId);

    const interview = await this.prisma.admissionInterview.findFirst({
      where: { id: interviewId, applicationId, organizationId },
    });
    if (!interview) throw new NotFoundException('Interview not found');

    return this.prisma.admissionInterview.update({
      where: { id: interviewId },
      data: {
        ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
        ...(dto.completedAt ? { completedAt: new Date(dto.completedAt) } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.format ? { format: dto.format } : {}),
        ...(dto.score !== undefined ? { score: dto.score ?? null } : {}),
        ...(dto.maxScore !== undefined ? { maxScore: dto.maxScore ?? null } : {}),
        ...(dto.recommendation !== undefined ? { recommendation: dto.recommendation ?? null } : {}),
        ...(dto.conductedBy !== undefined ? { conductedBy: dto.conductedBy ?? null } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes ?? null } : {}),
      },
    });
  }

  async deleteInterview(organizationId: string, applicationId: string, interviewId: string) {
    await this.findApplication(organizationId, applicationId);

    const interview = await this.prisma.admissionInterview.findFirst({
      where: { id: interviewId, applicationId, organizationId },
    });
    if (!interview) throw new NotFoundException('Interview not found');

    await this.prisma.admissionInterview.delete({ where: { id: interviewId } });
  }
}
