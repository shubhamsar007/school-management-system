import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateClassSubjectDto } from './dto/create-class-subject.dto';

@Injectable()
export class AcademicsService {
  constructor(private prisma: PrismaService) {}

  // ─── Classes ──────────────────────────────────────────────────

  async createClass(organizationId: string, dto: CreateClassDto) {
    const existing = await this.prisma.academicClass.findFirst({
      where: { organizationId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Class code '${dto.code}' already exists`);
    }

    return this.prisma.academicClass.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        level: dto.level ?? null,
        displayOrder: dto.displayOrder ?? null,
      },
    });
  }

  async findClasses(organizationId: string) {
    return this.prisma.academicClass.findMany({
      where: { organizationId, status: 'ACTIVE' },
      include: {
        sections: {
          where: { status: 'ACTIVE' },
          orderBy: { code: 'asc' },
        },
        _count: { select: { studentEnrollments: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { level: 'asc' }, { name: 'asc' }],
    });
  }

  async findClass(organizationId: string, classId: string) {
    const cls = await this.prisma.academicClass.findFirst({
      where: { id: classId, organizationId },
      include: {
        sections: {
          orderBy: { code: 'asc' },
        },
        classSubjects: {
          include: { subject: true, academicYear: true },
          orderBy: { status: 'asc' },
        },
        _count: { select: { studentEnrollments: true } },
      },
    });
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async updateClass(organizationId: string, classId: string, dto: UpdateClassDto) {
    const cls = await this.prisma.academicClass.findFirst({
      where: { id: classId, organizationId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    if (dto.code && dto.code !== cls.code) {
      const conflict = await this.prisma.academicClass.findFirst({
        where: { organizationId, code: dto.code },
      });
      if (conflict) throw new ConflictException(`Class code '${dto.code}' already exists`);
    }

    return this.prisma.academicClass.update({
      where: { id: classId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.level !== undefined ? { level: dto.level ?? null } : {}),
        ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder ?? null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async deleteClass(organizationId: string, classId: string) {
    const cls = await this.prisma.academicClass.findFirst({
      where: { id: classId, organizationId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    const inUse = await this.prisma.studentEnrollment.count({
      where: { classId },
    });
    if (inUse > 0) {
      throw new ConflictException('Class has student enrollments and cannot be deleted');
    }

    await this.prisma.academicClass.delete({ where: { id: classId } });
  }

  // ─── Sections ─────────────────────────────────────────────────

  async createSection(organizationId: string, classId: string, dto: CreateSectionDto) {
    const cls = await this.prisma.academicClass.findFirst({
      where: { id: classId, organizationId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    const campus = await this.prisma.campus.findFirst({
      where: { id: dto.campusId, organizationId, deletedAt: null },
    });
    if (!campus) throw new NotFoundException('Campus not found');

    const existing = await this.prisma.section.findUnique({
      where: {
        campusId_academicClassId_code: {
          campusId: dto.campusId,
          academicClassId: classId,
          code: dto.code,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Section code '${dto.code}' already exists for this class and campus`,
      );
    }

    return this.prisma.section.create({
      data: {
        campusId: dto.campusId,
        academicClassId: classId,
        name: dto.name,
        code: dto.code,
        capacity: dto.capacity ?? null,
      },
      include: { campus: true, academicClass: true },
    });
  }

  async findSections(organizationId: string, classId: string) {
    const cls = await this.prisma.academicClass.findFirst({
      where: { id: classId, organizationId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    return this.prisma.section.findMany({
      where: { academicClassId: classId },
      include: {
        campus: true,
        _count: { select: { studentEnrollments: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async updateSection(
    organizationId: string,
    classId: string,
    sectionId: string,
    dto: UpdateSectionDto,
  ) {
    const cls = await this.prisma.academicClass.findFirst({
      where: { id: classId, organizationId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, academicClassId: classId },
    });
    if (!section) throw new NotFoundException('Section not found');

    if (dto.code && dto.code !== section.code) {
      const conflict = await this.prisma.section.findUnique({
        where: {
          campusId_academicClassId_code: {
            campusId: section.campusId,
            academicClassId: classId,
            code: dto.code,
          },
        },
      });
      if (conflict) {
        throw new ConflictException(
          `Section code '${dto.code}' already exists for this class and campus`,
        );
      }
    }

    return this.prisma.section.update({
      where: { id: sectionId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity ?? null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: { campus: true, academicClass: true },
    });
  }

  async deleteSection(organizationId: string, classId: string, sectionId: string) {
    const cls = await this.prisma.academicClass.findFirst({
      where: { id: classId, organizationId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, academicClassId: classId },
    });
    if (!section) throw new NotFoundException('Section not found');

    const inUse = await this.prisma.studentEnrollment.count({
      where: { sectionId },
    });
    if (inUse > 0) {
      throw new ConflictException('Section has student enrollments and cannot be deleted');
    }

    await this.prisma.section.delete({ where: { id: sectionId } });
  }

  // ─── Subjects ─────────────────────────────────────────────────

  async createSubject(organizationId: string, dto: CreateSubjectDto) {
    const existing = await this.prisma.subject.findUnique({
      where: { organizationId_code: { organizationId, code: dto.code } },
    });
    if (existing) {
      throw new ConflictException(`Subject code '${dto.code}' already exists`);
    }

    return this.prisma.subject.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        subjectType: dto.subjectType,
        description: dto.description ?? null,
      },
    });
  }

  async findSubjects(organizationId: string) {
    return this.prisma.subject.findMany({
      where: { organizationId, status: 'ACTIVE' },
      orderBy: [{ subjectType: 'asc' }, { name: 'asc' }],
    });
  }

  async findSubject(organizationId: string, subjectId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, organizationId },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async updateSubject(organizationId: string, subjectId: string, dto: UpdateSubjectDto) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, organizationId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    if (dto.code && dto.code !== subject.code) {
      const conflict = await this.prisma.subject.findUnique({
        where: { organizationId_code: { organizationId, code: dto.code } },
      });
      if (conflict) throw new ConflictException(`Subject code '${dto.code}' already exists`);
    }

    return this.prisma.subject.update({
      where: { id: subjectId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.subjectType !== undefined ? { subjectType: dto.subjectType } : {}),
        ...(dto.description !== undefined ? { description: dto.description ?? null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async deleteSubject(organizationId: string, subjectId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, organizationId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const inUse = await this.prisma.classSubject.count({ where: { subjectId } });
    if (inUse > 0) {
      throw new ConflictException('Subject is assigned to classes and cannot be deleted');
    }

    await this.prisma.subject.delete({ where: { id: subjectId } });
  }

  // ─── Class Subjects ───────────────────────────────────────────

  async createClassSubject(organizationId: string, dto: CreateClassSubjectDto) {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, organizationId },
    });
    if (!academicYear) throw new NotFoundException('Academic year not found');

    const cls = await this.prisma.academicClass.findFirst({
      where: { id: dto.classId, organizationId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, organizationId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const existing = await this.prisma.classSubject.findUnique({
      where: {
        academicYearId_classId_subjectId: {
          academicYearId: dto.academicYearId,
          classId: dto.classId,
          subjectId: dto.subjectId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Subject is already assigned to this class for the selected academic year');
    }

    return this.prisma.classSubject.create({
      data: {
        academicYearId: dto.academicYearId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        isOptional: dto.isOptional ?? false,
        maxMarks: dto.maxMarks ?? null,
        passingMarks: dto.passingMarks ?? null,
        weightage: dto.weightage ?? null,
      },
      include: {
        academicYear: true,
        class: true,
        subject: true,
      },
    });
  }

  async findClassSubjects(organizationId: string, classId?: string, academicYearId?: string) {
    return this.prisma.classSubject.findMany({
      where: {
        ...(classId ? { classId } : {}),
        ...(academicYearId ? { academicYearId } : {}),
        class: { organizationId },
      },
      include: {
        academicYear: true,
        class: true,
        subject: true,
      },
      orderBy: [{ class: { level: 'asc' } }, { subject: { name: 'asc' } }],
    });
  }

  async deleteClassSubject(organizationId: string, classSubjectId: string) {
    const cs = await this.prisma.classSubject.findFirst({
      where: { id: classSubjectId, class: { organizationId } },
    });
    if (!cs) throw new NotFoundException('Class-subject assignment not found');

    await this.prisma.classSubject.delete({ where: { id: classSubjectId } });
  }
}
