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

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  // ─── Teachers ─────────────────────────────────────────────────

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

      return this.formatTeacher(employee);
    });
  }

  async findTeachers(organizationId: string) {
    const teachers = await this.prisma.employee.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        person: true,
        department: true,
        designation: true,
        campus: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return teachers.map(this.formatTeacher);
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
    if (!teacher) throw new NotFoundException('Teacher not found');
    return this.formatTeacher(teacher);
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
    if (!teacher) throw new NotFoundException('Teacher not found');

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
          ...(dto.dateOfBirth !== undefined
            ? { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null }
            : {}),
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
          ...(dto.joiningDate !== undefined
            ? { joiningDate: new Date(dto.joiningDate) }
            : {}),
          ...(dto.leavingDate !== undefined
            ? { leavingDate: dto.leavingDate ? new Date(dto.leavingDate) : null }
            : {}),
          ...(dto.employeeTypeId !== undefined ? { employeeTypeId: dto.employeeTypeId ?? null } : {}),
          ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId ?? null } : {}),
          ...(dto.designationId !== undefined ? { designationId: dto.designationId ?? null } : {}),
          ...(dto.campusId !== undefined ? { campusId: dto.campusId ?? null } : {}),
          ...(dto.reportingManagerId !== undefined
            ? { reportingManagerId: dto.reportingManagerId ?? null }
            : {}),
        },
        include: {
          person: true,
          department: true,
          designation: true,
          campus: true,
        },
      });

      return this.formatTeacher(updated);
    });
  }

  async deleteTeacher(organizationId: string, teacherId: string) {
    const teacher = await this.prisma.employee.findFirst({
      where: { id: teacherId, organizationId, deletedAt: null },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    await this.prisma.employee.update({
      where: { id: teacherId },
      data: { deletedAt: new Date(), employmentStatus: 'INACTIVE' },
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

    // Only one class teacher per section per academic year
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

  // ─── Private helpers ──────────────────────────────────────────

  private formatTeacher(teacher: any) {
    return {
      ...teacher,
      name: `${teacher.person.firstName} ${teacher.person.lastName}`,
    };
  }
}
