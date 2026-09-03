import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ListEmployeesDto } from './dto/list-employees.dto';
import { CreateQualificationDto } from './dto/create-qualification.dto';
import { UpdateQualificationDto } from './dto/update-qualification.dto';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { CreateLifecycleEventDto } from './dto/create-lifecycle-event.dto';

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  // ─── Stats ────────────────────────────────────────────────────

  async getStats(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      total,
      active,
      onLeave,
      probation,
      teaching,
      nonTeaching,
      newJoiners,
      probationEnding,
      contractsExpiring,
      presentToday,
      absentToday,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.employee.count({ where: { organizationId, deletedAt: null, employmentStatus: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { organizationId, deletedAt: null, employmentStatus: 'ON_LEAVE' } }),
      this.prisma.employee.count({ where: { organizationId, deletedAt: null, employmentStatus: 'PROBATION' } }),
      this.prisma.employee.count({
        where: {
          organizationId,
          deletedAt: null,
          employeeType: { category: 'TEACHING' },
        },
      }),
      this.prisma.employee.count({
        where: {
          organizationId,
          deletedAt: null,
          employeeType: { category: { not: 'TEACHING' } },
        },
      }),
      this.prisma.employee.count({
        where: {
          organizationId,
          deletedAt: null,
          joiningDate: { gte: startOfMonth },
        },
      }),
      this.prisma.employee.count({
        where: {
          organizationId,
          deletedAt: null,
          probationEnd: { gte: today, lte: thirtyDaysFromNow },
        },
      }),
      this.prisma.employee.count({
        where: {
          organizationId,
          deletedAt: null,
          contractEnd: { gte: today, lte: thirtyDaysFromNow },
        },
      }),
      this.prisma.employeeAttendance.count({
        where: {
          date: today,
          status: 'PRESENT',
          employee: { organizationId, deletedAt: null },
        },
      }),
      this.prisma.employeeAttendance.count({
        where: {
          date: today,
          status: 'ABSENT',
          employee: { organizationId, deletedAt: null },
        },
      }),
    ]);

    return {
      total,
      active,
      onLeave,
      probation,
      teachers: teaching,
      nonTeaching,
      newJoiners,
      probationEnding,
      contractsExpiring,
      presentToday,
      absentToday,
    };
  }

  // ─── Employees ────────────────────────────────────────────────

  async createTeacher(organizationId: string, dto: CreateTeacherDto) {
    const existing = await this.prisma.employee.findUnique({
      where: {
        organizationId_employeeNumber: {
          organizationId,
          employeeNumber: dto.employeeNumber,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Employee number '${dto.employeeNumber}' already exists`,
      );
    }

    if (dto.campusId) {
      const campus = await this.prisma.campus.findFirst({
        where: { id: dto.campusId, organizationId, deletedAt: null },
      });
      if (!campus) throw new NotFoundException('Campus not found');
    }

    if (dto.departmentId) {
      const dept = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, organizationId },
      });
      if (!dept) throw new NotFoundException('Department not found');
    }

    if (dto.designationId) {
      const desig = await this.prisma.designation.findFirst({
        where: { id: dto.designationId, organizationId },
      });
      if (!desig) throw new NotFoundException('Designation not found');
    }

    if (dto.employeeTypeId) {
      const empType = await this.prisma.employeeType.findFirst({
        where: { id: dto.employeeTypeId, organizationId },
      });
      if (!empType) throw new NotFoundException('Employee type not found');
    }

    if (dto.reportingManagerId) {
      const manager = await this.prisma.employee.findFirst({
        where: { id: dto.reportingManagerId, organizationId, deletedAt: null },
      });
      if (!manager) throw new NotFoundException('Reporting manager not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          firstName: dto.firstName,
          middleName: dto.middleName ?? null,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          gender: dto.gender ?? null,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          alternatePhone: dto.alternatePhone ?? null,
          bloodGroup: dto.bloodGroup ?? null,
          nationality: dto.nationality ?? 'Indian',
        },
      });

      const employee = await tx.employee.create({
        data: {
          organizationId,
          personId: person.id,
          employeeNumber: dto.employeeNumber,
          joiningDate: new Date(dto.joiningDate),
          employeeTypeId: dto.employeeTypeId ?? null,
          departmentId: dto.departmentId ?? null,
          designationId: dto.designationId ?? null,
          campusId: dto.campusId ?? null,
          reportingManagerId: dto.reportingManagerId ?? null,
        },
        include: {
          person: true,
          department: true,
          designation: true,
          campus: true,
        },
      });

      return this.formatEmployee(employee);
    });
  }

  async findTeachers(organizationId: string, query: ListEmployeesDto) {
    const {
      search,
      departmentId,
      designationId,
      employeeTypeId,
      status,
      campusId,
      employmentType,
      page = 1,
      limit = 25,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId, deletedAt: null };

    if (status) where.employmentStatus = status;
    if (campusId) where.campusId = campusId;
    if (departmentId) where.departmentId = departmentId;
    if (designationId) where.designationId = designationId;
    if (employeeTypeId) where.employeeTypeId = employeeTypeId;
    if (employmentType) where.employmentType = employmentType;
    if (query.category) where.employeeType = { category: query.category };

    if (search) {
      where.OR = [
        { person: { firstName: { contains: search, mode: 'insensitive' } } },
        { person: { lastName: { contains: search, mode: 'insensitive' } } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { person: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          person: true,
          department: true,
          designation: true,
          campus: true,
          employeeType: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: employees.map(this.formatEmployee),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findTeacher(organizationId: string, teacherId: string) {
    const teacher = await this.prisma.employee.findFirst({
      where: { id: teacherId, organizationId, deletedAt: null },
      include: {
        person: true,
        department: true,
        designation: true,
        employeeType: true,
        campus: true,
        reportingManager: { include: { person: true } },
        teacherAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            academicYear: true,
            class: true,
            section: true,
            subject: true,
          },
          orderBy: { startDate: 'desc' },
        },
      },
    });
    if (!teacher) throw new NotFoundException('Employee not found');
    return this.formatEmployee(teacher);
  }

  async updateTeacher(
    organizationId: string,
    teacherId: string,
    dto: UpdateTeacherDto,
  ) {
    const teacher = await this.prisma.employee.findFirst({
      where: { id: teacherId, organizationId, deletedAt: null },
      include: { person: true },
    });
    if (!teacher) throw new NotFoundException('Employee not found');

    if (dto.campusId) {
      const campus = await this.prisma.campus.findFirst({
        where: { id: dto.campusId, organizationId, deletedAt: null },
      });
      if (!campus) throw new NotFoundException('Campus not found');
    }

    if (dto.departmentId) {
      const dept = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, organizationId },
      });
      if (!dept) throw new NotFoundException('Department not found');
    }

    if (dto.designationId) {
      const desig = await this.prisma.designation.findFirst({
        where: { id: dto.designationId, organizationId },
      });
      if (!desig) throw new NotFoundException('Designation not found');
    }

    if (dto.reportingManagerId) {
      const manager = await this.prisma.employee.findFirst({
        where: { id: dto.reportingManagerId, organizationId, deletedAt: null },
      });
      if (!manager) throw new NotFoundException('Reporting manager not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.person.update({
        where: { id: teacher.personId },
        data: {
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
          ...(dto.middleName !== undefined ? { middleName: dto.middleName ?? null } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
          ...(dto.dateOfBirth !== undefined ? { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null } : {}),
          ...(dto.gender !== undefined ? { gender: dto.gender ?? null } : {}),
          ...(dto.email !== undefined ? { email: dto.email ?? null } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone ?? null } : {}),
          ...(dto.alternatePhone !== undefined ? { alternatePhone: dto.alternatePhone ?? null } : {}),
          ...(dto.bloodGroup !== undefined ? { bloodGroup: dto.bloodGroup ?? null } : {}),
          ...(dto.nationality !== undefined ? { nationality: dto.nationality ?? null } : {}),
        },
      });

      const updated = await tx.employee.update({
        where: { id: teacherId },
        data: {
          ...(dto.employmentStatus !== undefined ? { employmentStatus: dto.employmentStatus } : {}),
          ...(dto.employmentType !== undefined ? { employmentType: dto.employmentType ?? null } : {}),
          ...(dto.joiningDate !== undefined ? { joiningDate: new Date(dto.joiningDate) } : {}),
          ...(dto.leavingDate !== undefined ? { leavingDate: dto.leavingDate ? new Date(dto.leavingDate) : null } : {}),
          ...(dto.leavingReason !== undefined ? { leavingReason: dto.leavingReason ?? null } : {}),
          ...(dto.probationStart !== undefined ? { probationStart: dto.probationStart ? new Date(dto.probationStart) : null } : {}),
          ...(dto.probationEnd !== undefined ? { probationEnd: dto.probationEnd ? new Date(dto.probationEnd) : null } : {}),
          ...(dto.confirmationDate !== undefined ? { confirmationDate: dto.confirmationDate ? new Date(dto.confirmationDate) : null } : {}),
          ...(dto.contractStart !== undefined ? { contractStart: dto.contractStart ? new Date(dto.contractStart) : null } : {}),
          ...(dto.contractEnd !== undefined ? { contractEnd: dto.contractEnd ? new Date(dto.contractEnd) : null } : {}),
          ...(dto.noticePeriodDays !== undefined ? { noticePeriodDays: dto.noticePeriodDays ?? null } : {}),
          ...(dto.workLocation !== undefined ? { workLocation: dto.workLocation ?? null } : {}),
          ...(dto.employeeTypeId !== undefined ? { employeeTypeId: dto.employeeTypeId ?? null } : {}),
          ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId ?? null } : {}),
          ...(dto.designationId !== undefined ? { designationId: dto.designationId ?? null } : {}),
          ...(dto.campusId !== undefined ? { campusId: dto.campusId ?? null } : {}),
          ...(dto.reportingManagerId !== undefined ? { reportingManagerId: dto.reportingManagerId ?? null } : {}),
        },
        include: {
          person: true,
          department: true,
          designation: true,
          campus: true,
        },
      });

      return this.formatEmployee(updated);
    });
  }

  async deleteTeacher(organizationId: string, teacherId: string) {
    const teacher = await this.prisma.employee.findFirst({
      where: { id: teacherId, organizationId, deletedAt: null },
    });
    if (!teacher) throw new NotFoundException('Employee not found');

    await this.prisma.employee.update({
      where: { id: teacherId },
      data: { deletedAt: new Date(), employmentStatus: 'ARCHIVED' },
    });
  }

  // ─── Assignments ──────────────────────────────────────────────

  async createAssignment(
    organizationId: string,
    teacherId: string,
    dto: CreateAssignmentDto,
  ) {
    await this.findTeacher(organizationId, teacherId);

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, organizationId },
    });
    if (!academicYear) throw new NotFoundException('Academic year not found');

    const academicClass = await this.prisma.academicClass.findFirst({
      where: { id: dto.classId, organizationId },
    });
    if (!academicClass) throw new NotFoundException('Class not found');

    const section = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, academicClassId: dto.classId },
    });
    if (!section) throw new NotFoundException('Section not found');

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, organizationId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    if (dto.isClassTeacher) {
      const existingClassTeacher = await this.prisma.teacherAssignment.findFirst({
        where: {
          academicYearId: dto.academicYearId,
          sectionId: dto.sectionId,
          isClassTeacher: true,
          status: 'ACTIVE',
        },
      });
      if (existingClassTeacher) {
        throw new BadRequestException(
          'This section already has a class teacher for the selected academic year',
        );
      }
    }

    return this.prisma.teacherAssignment.create({
      data: {
        academicYearId: dto.academicYearId,
        teacherId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        subjectId: dto.subjectId,
        isClassTeacher: dto.isClassTeacher ?? false,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
      include: {
        academicYear: true,
        class: true,
        section: true,
        subject: true,
      },
    });
  }

  async findAssignments(organizationId: string, teacherId: string) {
    await this.findTeacher(organizationId, teacherId);

    return this.prisma.teacherAssignment.findMany({
      where: { teacherId },
      include: {
        academicYear: true,
        class: true,
        section: true,
        subject: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async deleteAssignment(
    organizationId: string,
    teacherId: string,
    assignmentId: string,
  ) {
    await this.findTeacher(organizationId, teacherId);

    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: { id: assignmentId, teacherId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.prisma.teacherAssignment.delete({ where: { id: assignmentId } });
  }

  // ─── Qualifications ───────────────────────────────────────────

  async findQualifications(organizationId: string, employeeId: string) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.employeeQualification.findMany({
      where: { employeeId },
      orderBy: [{ endYear: 'desc' }, { startYear: 'desc' }],
    });
  }

  async createQualification(
    organizationId: string,
    employeeId: string,
    dto: CreateQualificationDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.employeeQualification.create({
      data: {
        employeeId,
        degree: dto.degree,
        institution: dto.institution,
        university: dto.university ?? null,
        specialization: dto.specialization ?? null,
        startYear: dto.startYear,
        endYear: dto.endYear ?? null,
        percentage: dto.percentage ? parseFloat(dto.percentage) : null,
        grade: dto.grade ?? null,
        verificationStatus: dto.verificationStatus ?? 'PENDING',
      },
    });
  }

  async updateQualification(
    organizationId: string,
    employeeId: string,
    qId: string,
    dto: UpdateQualificationDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    const record = await this.prisma.employeeQualification.findFirst({
      where: { id: qId, employeeId },
    });
    if (!record) throw new NotFoundException('Qualification not found');

    return this.prisma.employeeQualification.update({
      where: { id: qId },
      data: {
        ...(dto.degree !== undefined ? { degree: dto.degree } : {}),
        ...(dto.institution !== undefined ? { institution: dto.institution } : {}),
        ...(dto.university !== undefined ? { university: dto.university ?? null } : {}),
        ...(dto.specialization !== undefined ? { specialization: dto.specialization ?? null } : {}),
        ...(dto.startYear !== undefined ? { startYear: dto.startYear } : {}),
        ...(dto.endYear !== undefined ? { endYear: dto.endYear ?? null } : {}),
        ...(dto.percentage !== undefined ? { percentage: dto.percentage ? parseFloat(dto.percentage) : null } : {}),
        ...(dto.grade !== undefined ? { grade: dto.grade ?? null } : {}),
        ...(dto.verificationStatus !== undefined ? { verificationStatus: dto.verificationStatus } : {}),
      },
    });
  }

  async deleteQualification(
    organizationId: string,
    employeeId: string,
    qId: string,
  ) {
    await this.findTeacher(organizationId, employeeId);
    const record = await this.prisma.employeeQualification.findFirst({
      where: { id: qId, employeeId },
    });
    if (!record) throw new NotFoundException('Qualification not found');
    await this.prisma.employeeQualification.delete({ where: { id: qId } });
  }

  // ─── Experience ───────────────────────────────────────────────

  async findExperience(organizationId: string, employeeId: string) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.employeeExperience.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' },
    });
  }

  async createExperience(
    organizationId: string,
    employeeId: string,
    dto: CreateExperienceDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.employeeExperience.create({
      data: {
        employeeId,
        organization: dto.organization,
        designation: dto.designation,
        department: dto.department ?? null,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        responsibilities: dto.responsibilities ?? null,
        reasonForLeaving: dto.reasonForLeaving ?? null,
      },
    });
  }

  async updateExperience(
    organizationId: string,
    employeeId: string,
    expId: string,
    dto: UpdateExperienceDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    const record = await this.prisma.employeeExperience.findFirst({
      where: { id: expId, employeeId },
    });
    if (!record) throw new NotFoundException('Experience record not found');

    return this.prisma.employeeExperience.update({
      where: { id: expId },
      data: {
        ...(dto.organization !== undefined ? { organization: dto.organization } : {}),
        ...(dto.designation !== undefined ? { designation: dto.designation } : {}),
        ...(dto.department !== undefined ? { department: dto.department ?? null } : {}),
        ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: dto.endDate ? new Date(dto.endDate) : null } : {}),
        ...(dto.responsibilities !== undefined ? { responsibilities: dto.responsibilities ?? null } : {}),
        ...(dto.reasonForLeaving !== undefined ? { reasonForLeaving: dto.reasonForLeaving ?? null } : {}),
      },
    });
  }

  async deleteExperience(
    organizationId: string,
    employeeId: string,
    expId: string,
  ) {
    await this.findTeacher(organizationId, employeeId);
    const record = await this.prisma.employeeExperience.findFirst({
      where: { id: expId, employeeId },
    });
    if (!record) throw new NotFoundException('Experience record not found');
    await this.prisma.employeeExperience.delete({ where: { id: expId } });
  }

  // ─── Emergency Contacts ───────────────────────────────────────

  async findEmergencyContacts(organizationId: string, employeeId: string) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.employeeEmergencyContact.findMany({
      where: { employeeId },
      orderBy: { priority: 'asc' },
    });
  }

  async createEmergencyContact(
    organizationId: string,
    employeeId: string,
    dto: CreateEmergencyContactDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.employeeEmergencyContact.create({
      data: {
        employeeId,
        name: dto.name,
        relationship: dto.relationship,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone ?? null,
        address: dto.address ?? null,
        priority: dto.priority ?? 1,
      },
    });
  }

  async updateEmergencyContact(
    organizationId: string,
    employeeId: string,
    contactId: string,
    dto: UpdateEmergencyContactDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    const record = await this.prisma.employeeEmergencyContact.findFirst({
      where: { id: contactId, employeeId },
    });
    if (!record) throw new NotFoundException('Emergency contact not found');

    return this.prisma.employeeEmergencyContact.update({
      where: { id: contactId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.relationship !== undefined ? { relationship: dto.relationship } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.alternatePhone !== undefined ? { alternatePhone: dto.alternatePhone ?? null } : {}),
        ...(dto.address !== undefined ? { address: dto.address ?? null } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      },
    });
  }

  async deleteEmergencyContact(
    organizationId: string,
    employeeId: string,
    contactId: string,
  ) {
    await this.findTeacher(organizationId, employeeId);
    const record = await this.prisma.employeeEmergencyContact.findFirst({
      where: { id: contactId, employeeId },
    });
    if (!record) throw new NotFoundException('Emergency contact not found');
    await this.prisma.employeeEmergencyContact.delete({ where: { id: contactId } });
  }

  // ─── Lifecycle Events ─────────────────────────────────────────

  async findLifecycleEvents(organizationId: string, employeeId: string) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.employeeLifecycleEvent.findMany({
      where: { employeeId },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async createLifecycleEvent(
    organizationId: string,
    employeeId: string,
    dto: CreateLifecycleEventDto,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId, deletedAt: null },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.$transaction(async (tx) => {
      const event = await tx.employeeLifecycleEvent.create({
        data: {
          employeeId,
          eventType: dto.eventType,
          fromStatus: employee.employmentStatus,
          toStatus: dto.toStatus,
          effectiveDate: new Date(dto.effectiveDate),
          reason: dto.reason ?? null,
          remarks: dto.remarks ?? null,
        },
      });

      await tx.employee.update({
        where: { id: employeeId },
        data: { employmentStatus: dto.toStatus },
      });

      return event;
    });
  }

  // ─── Departments ──────────────────────────────────────────────

  async getDepartments(organizationId: string) {
    const departments = await this.prisma.department.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            employees: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: (d as any).code ?? null,
      description: (d as any).description ?? null,
      employeeCount: d._count.employees,
    }));
  }

  // ─── Private helpers ──────────────────────────────────────────

  private formatEmployee(employee: any) {
    const { person, reportingManager, ...rest } = employee;
    return {
      ...rest,
      name: `${person.firstName}${person.middleName ? ' ' + person.middleName : ''} ${person.lastName}`,
      person,
      reportingManager: reportingManager
        ? {
            ...reportingManager,
            name: `${reportingManager.person.firstName} ${reportingManager.person.lastName}`,
          }
        : null,
    };
  }
}
