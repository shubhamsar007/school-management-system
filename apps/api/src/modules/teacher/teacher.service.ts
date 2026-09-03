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
import { CreateBankDetailDto } from './dto/create-bank-detail.dto';
import { UpdateBankDetailDto } from './dto/update-bank-detail.dto';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateOnboardingTaskDto } from './dto/update-onboarding-task.dto';
import { CreateOffboardingDto } from './dto/create-offboarding.dto';
import { UpdateOffboardingTaskDto } from './dto/update-offboarding-task.dto';

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

  // ─── Form Options ─────────────────────────────────────────────

  async getFormOptions(organizationId: string) {
    const [departments, designations, employeeTypes, campuses] = await Promise.all([
      this.prisma.department.findMany({
        where: { organizationId, status: 'ACTIVE' },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.designation.findMany({
        where: { organizationId, status: 'ACTIVE' },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.employeeType.findMany({
        where: { organizationId, status: 'ACTIVE' },
        select: { id: true, name: true, code: true, category: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.campus.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { departments, designations, employeeTypes, campuses };
  }

  // ─── Performance Reviews ──────────────────────────────────────

  async findPerformanceReviews(organizationId: string, employeeId: string) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.performanceReview.findMany({
      where: { employeeId },
      include: { criteria: true, goals: true },
      orderBy: { reviewDate: 'desc' },
    });
  }

  async createPerformanceReview(
    organizationId: string,
    employeeId: string,
    dto: import('./dto/create-performance-review.dto').CreatePerformanceReviewDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.performanceReview.create({
      data: {
        organizationId,
        employeeId,
        academicYearId: dto.academicYearId,
        reviewType: dto.reviewType,
        reviewedBy: dto.reviewedBy,
        reviewDate: new Date(dto.reviewDate),
        overallRating: dto.overallRating ?? null,
        remarks: dto.remarks ?? null,
        ...(dto.criteria && {
          criteria: { create: dto.criteria.map((c) => ({ criteriaName: c.criteriaName, rating: c.rating, remarks: c.remarks ?? null })) },
        }),
        ...(dto.goals && {
          goals: { create: dto.goals.map((g) => ({ goal: g.goal, target: g.target ?? null, status: g.status ?? 'PENDING' })) },
        }),
      },
      include: { criteria: true, goals: true },
    });
  }

  // ─── Training Records ─────────────────────────────────────────

  async findTrainingRecords(organizationId: string, employeeId: string) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.trainingRecord.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' },
    });
  }

  async createTrainingRecord(
    organizationId: string,
    employeeId: string,
    dto: import('./dto/create-training-record.dto').CreateTrainingRecordDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.trainingRecord.create({
      data: {
        employeeId,
        title: dto.title,
        trainingType: dto.trainingType,
        provider: dto.provider ?? null,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        durationHours: dto.durationHours ?? null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        verificationStatus: dto.verificationStatus ?? 'PENDING',
      },
    });
  }

  async deleteTrainingRecord(organizationId: string, employeeId: string, recordId: string) {
    await this.findTeacher(organizationId, employeeId);
    const record = await this.prisma.trainingRecord.findFirst({ where: { id: recordId, employeeId } });
    if (!record) throw new NotFoundException('Training record not found');
    await this.prisma.trainingRecord.delete({ where: { id: recordId } });
  }

  // ─── Assets ───────────────────────────────────────────────────

  async findAssets(organizationId: string, employeeId: string) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.employeeAsset.findMany({
      where: { employeeId },
      orderBy: { issueDate: 'desc' },
    });
  }

  async createAsset(
    organizationId: string,
    employeeId: string,
    dto: import('./dto/create-asset.dto').CreateAssetDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.employeeAsset.create({
      data: {
        organizationId,
        employeeId,
        assetType: dto.assetType,
        assetCode: dto.assetCode ?? null,
        description: dto.description ?? null,
        issueDate: new Date(dto.issueDate),
        expectedReturn: dto.expectedReturn ? new Date(dto.expectedReturn) : null,
        condition: dto.condition ?? 'GOOD',
        issuedBy: dto.issuedBy ?? null,
      },
    });
  }

  async updateAsset(
    organizationId: string,
    employeeId: string,
    assetId: string,
    dto: import('./dto/update-asset.dto').UpdateAssetDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    const asset = await this.prisma.employeeAsset.findFirst({ where: { id: assetId, employeeId } });
    if (!asset) throw new NotFoundException('Asset not found');
    return this.prisma.employeeAsset.update({
      where: { id: assetId },
      data: {
        ...(dto.returnedDate !== undefined ? { returnedDate: dto.returnedDate ? new Date(dto.returnedDate) : null } : {}),
        ...(dto.returnCondition !== undefined ? { returnCondition: dto.returnCondition ?? null } : {}),
        ...(dto.expectedReturn !== undefined ? { expectedReturn: dto.expectedReturn ? new Date(dto.expectedReturn) : null } : {}),
        ...(dto.description !== undefined ? { description: dto.description ?? null } : {}),
        ...(dto.condition !== undefined ? { condition: dto.condition } : {}),
      },
    });
  }

  // ─── Bank Details ─────────────────────────────────────────────

  async findBankDetails(organizationId: string, employeeId: string) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.employeeBankDetail.findMany({
      where: { employeeId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createBankDetail(organizationId: string, employeeId: string, dto: CreateBankDetailDto) {
    await this.findTeacher(organizationId, employeeId);
    if (dto.isPrimary) {
      await this.prisma.employeeBankDetail.updateMany({
        where: { employeeId },
        data: { isPrimary: false },
      });
    }
    return this.prisma.employeeBankDetail.create({
      data: {
        employeeId,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        ifscCode: dto.ifscCode,
        accountType: dto.accountType ?? 'SAVINGS',
        isPrimary: dto.isPrimary ?? false,
      },
    });
  }

  async updateBankDetail(
    organizationId: string,
    employeeId: string,
    detailId: string,
    dto: UpdateBankDetailDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    const detail = await this.prisma.employeeBankDetail.findFirst({ where: { id: detailId, employeeId } });
    if (!detail) throw new NotFoundException('Bank detail not found');
    if (dto.isPrimary) {
      await this.prisma.employeeBankDetail.updateMany({
        where: { employeeId, id: { not: detailId } },
        data: { isPrimary: false },
      });
    }
    return this.prisma.employeeBankDetail.update({
      where: { id: detailId },
      data: {
        ...(dto.bankName !== undefined ? { bankName: dto.bankName } : {}),
        ...(dto.accountNumber !== undefined ? { accountNumber: dto.accountNumber } : {}),
        ...(dto.ifscCode !== undefined ? { ifscCode: dto.ifscCode } : {}),
        ...(dto.accountType !== undefined ? { accountType: dto.accountType } : {}),
        ...(dto.isPrimary !== undefined ? { isPrimary: dto.isPrimary } : {}),
      },
    });
  }

  async deleteBankDetail(organizationId: string, employeeId: string, detailId: string) {
    await this.findTeacher(organizationId, employeeId);
    const detail = await this.prisma.employeeBankDetail.findFirst({ where: { id: detailId, employeeId } });
    if (!detail) throw new NotFoundException('Bank detail not found');
    await this.prisma.employeeBankDetail.delete({ where: { id: detailId } });
  }

  // ─── Onboarding ───────────────────────────────────────────────

  async findOnboarding(organizationId: string, employeeId: string) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.employeeOnboarding.findUnique({
      where: { employeeId },
      include: { tasks: { orderBy: { category: 'asc' } } },
    });
  }

  async createOnboarding(organizationId: string, employeeId: string, dto: CreateOnboardingDto) {
    await this.findTeacher(organizationId, employeeId);
    const existing = await this.prisma.employeeOnboarding.findUnique({ where: { employeeId } });
    if (existing) throw new ConflictException('Onboarding record already exists for this employee');
    return this.prisma.employeeOnboarding.create({
      data: {
        employeeId,
        tasks: {
          create: (dto.tasks ?? []).map((t) => ({
            taskName: t.taskName,
            category: t.category,
            isRequired: t.isRequired ?? true,
          })),
        },
      },
      include: { tasks: { orderBy: { category: 'asc' } } },
    });
  }

  async updateOnboardingTask(
    organizationId: string,
    employeeId: string,
    taskId: string,
    dto: UpdateOnboardingTaskDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    const onboarding = await this.prisma.employeeOnboarding.findUnique({ where: { employeeId } });
    if (!onboarding) throw new NotFoundException('Onboarding record not found');
    const task = await this.prisma.onboardingTask.findFirst({ where: { id: taskId, onboardingId: onboarding.id } });
    if (!task) throw new NotFoundException('Onboarding task not found');

    const updated = await this.prisma.onboardingTask.update({
      where: { id: taskId },
      data: {
        ...(dto.isCompleted !== undefined ? {
          isCompleted: dto.isCompleted,
          completedAt: dto.isCompleted ? new Date() : null,
        } : {}),
        ...(dto.completedBy !== undefined ? { completedBy: dto.completedBy ?? null } : {}),
        ...(dto.remarks !== undefined ? { remarks: dto.remarks ?? null } : {}),
      },
    });

    // Auto-complete onboarding if all required tasks are done
    const pendingRequired = await this.prisma.onboardingTask.count({
      where: { onboardingId: onboarding.id, isRequired: true, isCompleted: false },
    });
    if (pendingRequired === 0) {
      await this.prisma.employeeOnboarding.update({
        where: { id: onboarding.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    return updated;
  }

  // ─── Offboarding ──────────────────────────────────────────────

  async findOffboarding(organizationId: string, employeeId: string) {
    await this.findTeacher(organizationId, employeeId);
    return this.prisma.employeeOffboarding.findUnique({
      where: { employeeId },
      include: { tasks: { orderBy: { category: 'asc' } } },
    });
  }

  async createOffboarding(organizationId: string, employeeId: string, dto: CreateOffboardingDto) {
    await this.findTeacher(organizationId, employeeId);
    const existing = await this.prisma.employeeOffboarding.findUnique({ where: { employeeId } });
    if (existing) throw new ConflictException('Offboarding record already exists for this employee');
    return this.prisma.employeeOffboarding.create({
      data: {
        employeeId,
        exitType: dto.exitType,
        exitDate: new Date(dto.exitDate),
        lastWorkingDate: new Date(dto.lastWorkingDate),
        reason: dto.reason ?? null,
        tasks: {
          create: (dto.tasks ?? []).map((t) => ({
            taskName: t.taskName,
            category: t.category,
            isRequired: t.isRequired ?? true,
          })),
        },
      },
      include: { tasks: { orderBy: { category: 'asc' } } },
    });
  }

  async updateOffboardingTask(
    organizationId: string,
    employeeId: string,
    taskId: string,
    dto: UpdateOffboardingTaskDto,
  ) {
    await this.findTeacher(organizationId, employeeId);
    const offboarding = await this.prisma.employeeOffboarding.findUnique({ where: { employeeId } });
    if (!offboarding) throw new NotFoundException('Offboarding record not found');
    const task = await this.prisma.offboardingTask.findFirst({ where: { id: taskId, offboardingId: offboarding.id } });
    if (!task) throw new NotFoundException('Offboarding task not found');

    const updated = await this.prisma.offboardingTask.update({
      where: { id: taskId },
      data: {
        ...(dto.isCompleted !== undefined ? {
          isCompleted: dto.isCompleted,
          completedAt: dto.isCompleted ? new Date() : null,
        } : {}),
        ...(dto.completedBy !== undefined ? { completedBy: dto.completedBy ?? null } : {}),
        ...(dto.remarks !== undefined ? { remarks: dto.remarks ?? null } : {}),
      },
    });

    // Auto-complete offboarding if all required tasks are done
    const pendingRequired = await this.prisma.offboardingTask.count({
      where: { offboardingId: offboarding.id, isRequired: true, isCompleted: false },
    });
    if (pendingRequired === 0) {
      await this.prisma.employeeOffboarding.update({
        where: { id: offboarding.id },
        data: { status: 'COMPLETED' },
      });
    }

    return updated;
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
