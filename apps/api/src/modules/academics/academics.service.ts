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
import { UpdateClassSubjectDto } from './dto/update-class-subject.dto';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CreatePromotionRunDto } from './dto/create-promotion-run.dto';
import { UpdatePromotionResultsDto } from './dto/update-promotion-results.dto';

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

  async updateClassSubject(organizationId: string, id: string, dto: UpdateClassSubjectDto) {
    const cs = await this.prisma.classSubject.findFirst({
      where: { id, class: { organizationId } },
    });
    if (!cs) throw new NotFoundException('Class-subject assignment not found');

    return this.prisma.classSubject.update({
      where: { id },
      data: {
        ...(dto.isOptional !== undefined ? { isOptional: dto.isOptional } : {}),
        ...(dto.maxMarks !== undefined ? { maxMarks: dto.maxMarks ?? null } : {}),
        ...(dto.passingMarks !== undefined ? { passingMarks: dto.passingMarks ?? null } : {}),
        ...(dto.weightage !== undefined ? { weightage: dto.weightage ?? null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: { class: true, subject: true, academicYear: true },
    });
  }

  async deleteClassSubject(organizationId: string, classSubjectId: string) {
    const cs = await this.prisma.classSubject.findFirst({
      where: { id: classSubjectId, class: { organizationId } },
    });
    if (!cs) throw new NotFoundException('Class-subject assignment not found');

    await this.prisma.classSubject.delete({ where: { id: classSubjectId } });
  }

  // ─── Teacher Assignments (read-only academic view) ────────────

  async findTeacherAssignments(
    organizationId: string,
    academicYearId?: string,
    classId?: string,
  ) {
    return this.prisma.teacherAssignment.findMany({
      where: {
        class: { organizationId },
        status: 'ACTIVE',
        ...(academicYearId ? { academicYearId } : {}),
        ...(classId ? { classId } : {}),
      },
      include: {
        teacher: {
          include: {
            person: { select: { firstName: true, lastName: true } },
          },
        },
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true, code: true } },
        subject: { select: { id: true, name: true, code: true, subjectType: true } },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: [
        { class: { level: 'asc' } },
        { section: { code: 'asc' } },
        { subject: { name: 'asc' } },
      ],
    });
  }

  async getClassTeacherCoverage(organizationId: string, academicYearId: string) {
    const [classes, classTeacherAssignments] = await Promise.all([
      this.prisma.academicClass.findMany({
        where: { organizationId, status: 'ACTIVE' },
        include: {
          sections: {
            where: { status: 'ACTIVE' },
            orderBy: { code: 'asc' },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { level: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.teacherAssignment.findMany({
        where: {
          academicYearId,
          isClassTeacher: true,
          status: 'ACTIVE',
          class: { organizationId },
        },
        include: {
          teacher: {
            include: { person: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
    ]);

    // Build map: sectionId → class teacher info
    const sectionTeacherMap = new Map<
      string,
      { teacherId: string; teacherName: string }
    >();
    for (const a of classTeacherAssignments) {
      const p = a.teacher.person;
      sectionTeacherMap.set(a.sectionId, {
        teacherId: a.teacherId,
        teacherName: `${p.firstName} ${p.lastName}`,
      });
    }

    return classes.map((cls) => ({
      classId: cls.id,
      className: cls.name,
      classCode: cls.code,
      sections: cls.sections.map((s) => ({
        sectionId: s.id,
        sectionName: s.name,
        sectionCode: s.code,
        classTeacher: sectionTeacherMap.get(s.id) ?? null,
      })),
    }));
  }

  // ─── Dashboard Stats ──────────────────────────────────────────

  async getStats(organizationId: string, academicYearId?: string) {
    const [totalClasses, totalSections, totalSubjects] = await Promise.all([
      this.prisma.academicClass.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.section.count({ where: { academicClass: { organizationId }, status: 'ACTIVE' } }),
      this.prisma.subject.count({ where: { organizationId, status: 'ACTIVE' } }),
    ]);

    const totalStudents = await this.prisma.studentEnrollment.count({
      where: {
        student: { organizationId },
        status: 'ACTIVE',
        ...(academicYearId ? { academicYearId } : {}),
      },
    });

    const avgClassSize = totalSections > 0 ? Math.round(totalStudents / totalSections) : 0;

    const sectionsWithCapacity = await this.prisma.section.findMany({
      where: {
        academicClass: { organizationId },
        status: 'ACTIVE',
        capacity: { not: null },
      },
      include: { _count: { select: { studentEnrollments: true } } },
    });

    const sectionsNearCapacity = sectionsWithCapacity.filter(
      (s) =>
        s.capacity != null &&
        s.capacity > 0 &&
        s._count.studentEnrollments / s.capacity >= 0.8,
    ).length;

    let classesWithoutSubjects = 0;
    if (academicYearId) {
      const withSubjects = await this.prisma.classSubject
        .findMany({
          where: { academicYearId, class: { organizationId } },
          select: { classId: true },
          distinct: ['classId'],
        })
        .then((rows) => rows.length);
      classesWithoutSubjects = Math.max(0, totalClasses - withSubjects);
    }

    return {
      totalClasses,
      totalSections,
      totalSubjects,
      totalStudents,
      avgClassSize,
      sectionsNearCapacity,
      classesWithoutSubjects,
    };
  }

  // ─── Academic Calendar Events ─────────────────────────────────

  async createCalendarEvent(organizationId: string, dto: CreateCalendarEventDto) {
    const year = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, organizationId },
    });
    if (!year) throw new NotFoundException('Academic year not found');

    if (dto.campusId) {
      const campus = await this.prisma.campus.findFirst({
        where: { id: dto.campusId, organizationId, deletedAt: null },
      });
      if (!campus) throw new NotFoundException('Campus not found');
    }

    return this.prisma.academicCalendarEvent.create({
      data: {
        organizationId,
        academicYearId: dto.academicYearId,
        title: dto.title,
        description: dto.description ?? null,
        eventType: dto.eventType ?? 'HOLIDAY',
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isSchoolClosed: dto.isSchoolClosed ?? false,
        campusId: dto.campusId ?? null,
      },
      include: { campus: { select: { id: true, name: true } } },
    });
  }

  async findCalendarEvents(
    organizationId: string,
    academicYearId?: string,
    month?: number,
    year?: number,
  ) {
    let dateFilter = {};
    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      dateFilter = {
        OR: [
          { startDate: { gte: startOfMonth, lte: endOfMonth } },
          { endDate: { gte: startOfMonth, lte: endOfMonth } },
          { startDate: { lte: startOfMonth }, endDate: { gte: endOfMonth } },
        ],
      };
    }

    return this.prisma.academicCalendarEvent.findMany({
      where: {
        organizationId,
        ...(academicYearId ? { academicYearId } : {}),
        ...dateFilter,
      },
      include: { campus: { select: { id: true, name: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  async updateCalendarEvent(
    organizationId: string,
    id: string,
    dto: UpdateCalendarEventDto,
  ) {
    const event = await this.prisma.academicCalendarEvent.findFirst({
      where: { id, organizationId },
    });
    if (!event) throw new NotFoundException('Calendar event not found');

    return this.prisma.academicCalendarEvent.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description ?? null } : {}),
        ...(dto.eventType !== undefined ? { eventType: dto.eventType } : {}),
        ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: new Date(dto.endDate) } : {}),
        ...(dto.isSchoolClosed !== undefined ? { isSchoolClosed: dto.isSchoolClosed } : {}),
        ...(dto.campusId !== undefined ? { campusId: dto.campusId ?? null } : {}),
      },
      include: { campus: { select: { id: true, name: true } } },
    });
  }

  async deleteCalendarEvent(organizationId: string, id: string) {
    const event = await this.prisma.academicCalendarEvent.findFirst({
      where: { id, organizationId },
    });
    if (!event) throw new NotFoundException('Calendar event not found');
    await this.prisma.academicCalendarEvent.delete({ where: { id } });
  }

  // ─── Promotion Runs ───────────────────────────────────────────

  async createPromotionRun(organizationId: string, dto: CreatePromotionRunDto) {
    // Validate year and class ownership
    const [fromYear, toYear, fromClass, toClass] = await Promise.all([
      this.prisma.academicYear.findFirst({ where: { id: dto.fromYearId, organizationId } }),
      this.prisma.academicYear.findFirst({ where: { id: dto.toYearId, organizationId } }),
      this.prisma.academicClass.findFirst({ where: { id: dto.fromClassId, organizationId } }),
      this.prisma.academicClass.findFirst({ where: { id: dto.toClassId, organizationId } }),
    ]);
    if (!fromYear) throw new NotFoundException('Source academic year not found');
    if (!toYear) throw new NotFoundException('Target academic year not found');
    if (!fromClass) throw new NotFoundException('Source class not found');
    if (!toClass) throw new NotFoundException('Target class not found');

    // Find all active enrollments for the from class + year
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        academicYearId: dto.fromYearId,
        classId: dto.fromClassId,
        status: 'ACTIVE',
        student: { organizationId },
      },
      include: {
        student: {
          include: { person: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (enrollments.length === 0) {
      throw new ConflictException('No active student enrollments found for the selected class and year');
    }

    // Create the run and populate results in a transaction
    return this.prisma.$transaction(async (tx) => {
      const run = await tx.promotionRun.create({
        data: {
          organizationId,
          fromYearId: dto.fromYearId,
          toYearId: dto.toYearId,
          fromClassId: dto.fromClassId,
          toClassId: dto.toClassId,
          notes: dto.notes ?? null,
        },
      });

      await tx.promotionResult.createMany({
        data: enrollments.map((e) => ({
          promotionRunId: run.id,
          studentId: e.studentId,
          enrollmentId: e.id,
          outcome: 'PROMOTED',
        })),
      });

      return tx.promotionRun.findUniqueOrThrow({
        where: { id: run.id },
        include: {
          fromYear: { select: { id: true, name: true } },
          toYear: { select: { id: true, name: true } },
          fromClass: { select: { id: true, name: true } },
          toClass: { select: { id: true, name: true } },
          _count: { select: { results: true } },
        },
      });
    });
  }

  async findPromotionRuns(organizationId: string, fromYearId?: string) {
    return this.prisma.promotionRun.findMany({
      where: {
        organizationId,
        ...(fromYearId ? { fromYearId } : {}),
      },
      include: {
        fromYear: { select: { id: true, name: true } },
        toYear: { select: { id: true, name: true } },
        fromClass: { select: { id: true, name: true } },
        toClass: { select: { id: true, name: true } },
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPromotionRun(organizationId: string, id: string) {
    const run = await this.prisma.promotionRun.findFirst({
      where: { id, organizationId },
      include: {
        fromYear: { select: { id: true, name: true } },
        toYear: { select: { id: true, name: true } },
        fromClass: { select: { id: true, name: true } },
        toClass: { select: { id: true, name: true } },
        results: {
          include: {
            student: {
              select: {
                id: true,
                admissionNumber: true,
                person: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { student: { admissionNumber: 'asc' } },
        },
      },
    });
    if (!run) throw new NotFoundException('Promotion run not found');
    return run;
  }

  async updatePromotionResults(
    organizationId: string,
    id: string,
    dto: UpdatePromotionResultsDto,
  ) {
    const run = await this.prisma.promotionRun.findFirst({
      where: { id, organizationId },
    });
    if (!run) throw new NotFoundException('Promotion run not found');
    if (run.status === 'FINALIZED') {
      throw new ConflictException('Cannot edit a finalized promotion run');
    }

    await this.prisma.$transaction(
      dto.results.map((item) =>
        this.prisma.promotionResult.updateMany({
          where: { promotionRunId: id, studentId: item.studentId },
          data: {
            outcome: item.outcome,
            notes: item.notes ?? null,
          },
        }),
      ),
    );

    return this.findPromotionRun(organizationId, id);
  }

  async finalizePromotionRun(organizationId: string, id: string) {
    const run = await this.prisma.promotionRun.findFirst({
      where: { id, organizationId },
      include: { results: true },
    });
    if (!run) throw new NotFoundException('Promotion run not found');
    if (run.status === 'FINALIZED') {
      throw new ConflictException('Promotion run is already finalized');
    }

    // Update each student enrollment's promotionStatus
    await this.prisma.$transaction(async (tx) => {
      for (const result of run.results) {
        await tx.studentEnrollment.update({
          where: { id: result.enrollmentId },
          data: { promotionStatus: result.outcome },
        });
      }

      await tx.promotionRun.update({
        where: { id },
        data: { status: 'FINALIZED' },
      });
    });

    const promoted = run.results.filter((r) => r.outcome === 'PROMOTED').length;
    const heldBack = run.results.filter((r) => r.outcome === 'HELD_BACK').length;
    const transferred = run.results.filter((r) => r.outcome === 'TRANSFERRED').length;

    return { id, status: 'FINALIZED', promoted, heldBack, transferred };
  }

  async deletePromotionRun(organizationId: string, id: string) {
    const run = await this.prisma.promotionRun.findFirst({
      where: { id, organizationId },
    });
    if (!run) throw new NotFoundException('Promotion run not found');
    if (run.status === 'FINALIZED') {
      throw new ConflictException('Cannot delete a finalized promotion run');
    }
    await this.prisma.promotionRun.delete({ where: { id } });
  }
}
