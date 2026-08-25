import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { CreateGuardianDto } from './dto/create-guardian.dto';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  // ─── Students ─────────────────────────────────────────────────

  async createStudent(organizationId: string, dto: CreateStudentDto) {
    const existing = await this.prisma.student.findUnique({
      where: {
        organizationId_admissionNumber: {
          organizationId,
          admissionNumber: dto.admissionNumber,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Admission number '${dto.admissionNumber}' already exists`,
      );
    }

    if (dto.currentCampusId) {
      const campus = await this.prisma.campus.findFirst({
        where: { id: dto.currentCampusId, organizationId, deletedAt: null },
      });
      if (!campus) throw new NotFoundException('Campus not found');
    }

    if (dto.houseId) {
      const house = await this.prisma.house.findFirst({
        where: { id: dto.houseId, organizationId },
      });
      if (!house) throw new NotFoundException('House not found');
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

      const student = await tx.student.create({
        data: {
          organizationId,
          personId: person.id,
          admissionNumber: dto.admissionNumber,
          registrationNumber: dto.registrationNumber ?? null,
          admissionDate: new Date(dto.admissionDate),
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : null,
          currentCampusId: dto.currentCampusId ?? null,
          houseId: dto.houseId ?? null,
        },
        include: {
          person: true,
          house: true,
        },
      });

      return this.formatStudent(student);
    });
  }

  async findStudents(organizationId: string) {
    const students = await this.prisma.student.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        person: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            academicYear: true,
            class: true,
            section: true,
          },
          orderBy: { enrollmentDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return students.map(this.formatStudent);
  }

  async findStudent(organizationId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, organizationId, deletedAt: null },
      include: {
        person: true,
        house: true,
        enrollments: {
          include: {
            academicYear: true,
            class: true,
            section: true,
          },
          orderBy: { enrollmentDate: 'desc' },
        },
        studentGuardians: {
          include: {
            guardian: {
              include: { person: true },
            },
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return this.formatStudentDetail(student);
  }

  async updateStudent(
    organizationId: string,
    studentId: string,
    dto: UpdateStudentDto,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, organizationId, deletedAt: null },
      include: { person: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    if (dto.currentCampusId) {
      const campus = await this.prisma.campus.findFirst({
        where: { id: dto.currentCampusId, organizationId, deletedAt: null },
      });
      if (!campus) throw new NotFoundException('Campus not found');
    }

    if (dto.houseId) {
      const house = await this.prisma.house.findFirst({
        where: { id: dto.houseId, organizationId },
      });
      if (!house) throw new NotFoundException('House not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.person.update({
        where: { id: student.personId },
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

      const updated = await tx.student.update({
        where: { id: studentId },
        data: {
          ...(dto.registrationNumber !== undefined
            ? { registrationNumber: dto.registrationNumber ?? null }
            : {}),
          ...(dto.studentStatus !== undefined ? { studentStatus: dto.studentStatus } : {}),
          ...(dto.joiningDate !== undefined
            ? { joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : null }
            : {}),
          ...(dto.leavingDate !== undefined
            ? { leavingDate: dto.leavingDate ? new Date(dto.leavingDate) : null }
            : {}),
          ...(dto.leavingReason !== undefined ? { leavingReason: dto.leavingReason ?? null } : {}),
          ...(dto.currentCampusId !== undefined
            ? { currentCampusId: dto.currentCampusId ?? null }
            : {}),
          ...(dto.houseId !== undefined ? { houseId: dto.houseId ?? null } : {}),
        },
        include: {
          person: true,
          house: true,
        },
      });

      return this.formatStudent(updated);
    });
  }

  async deleteStudent(organizationId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, organizationId, deletedAt: null },
    });
    if (!student) throw new NotFoundException('Student not found');

    await this.prisma.student.update({
      where: { id: studentId },
      data: { deletedAt: new Date(), studentStatus: 'INACTIVE' },
    });
  }

  // ─── Enrollments ──────────────────────────────────────────────

  async createEnrollment(
    organizationId: string,
    studentId: string,
    dto: CreateEnrollmentDto,
  ) {
    await this.findStudent(organizationId, studentId);

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, organizationId },
    });
    if (!academicYear) throw new NotFoundException('Academic year not found');

    const campus = await this.prisma.campus.findFirst({
      where: { id: dto.campusId, organizationId, deletedAt: null },
    });
    if (!campus) throw new NotFoundException('Campus not found');

    const academicClass = await this.prisma.academicClass.findFirst({
      where: { id: dto.classId, organizationId },
    });
    if (!academicClass) throw new NotFoundException('Class not found');

    const section = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, campusId: dto.campusId, academicClassId: dto.classId },
    });
    if (!section) throw new NotFoundException('Section not found');

    const duplicate = await this.prisma.studentEnrollment.findUnique({
      where: {
        studentId_academicYearId: {
          studentId,
          academicYearId: dto.academicYearId,
        },
      },
    });
    if (duplicate) {
      throw new ConflictException(
        'Student is already enrolled for this academic year',
      );
    }

    return this.prisma.studentEnrollment.create({
      data: {
        studentId,
        academicYearId: dto.academicYearId,
        campusId: dto.campusId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        rollNumber: dto.rollNumber ?? null,
        enrollmentDate: new Date(dto.enrollmentDate),
      },
      include: {
        academicYear: true,
        class: true,
        section: true,
      },
    });
  }

  async findEnrollments(organizationId: string, studentId: string) {
    await this.findStudent(organizationId, studentId);

    return this.prisma.studentEnrollment.findMany({
      where: { studentId },
      include: {
        academicYear: true,
        class: true,
        section: true,
      },
      orderBy: { enrollmentDate: 'desc' },
    });
  }

  // ─── Guardians ────────────────────────────────────────────────

  async addGuardian(
    organizationId: string,
    studentId: string,
    dto: CreateGuardianDto,
  ) {
    await this.findStudent(organizationId, studentId);

    if (dto.isPrimary) {
      const existingPrimary = await this.prisma.studentGuardian.findFirst({
        where: { studentId, isPrimary: true },
      });
      if (existingPrimary) {
        throw new BadRequestException(
          'Student already has a primary guardian. Update the existing one first.',
        );
      }
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
          phone: dto.phone,
          alternatePhone: dto.alternatePhone ?? null,
        },
      });

      const guardian = await tx.guardian.create({
        data: {
          personId: person.id,
          occupation: dto.occupation ?? null,
          employer: dto.employer ?? null,
          annualIncome: dto.annualIncome ?? null,
          education: dto.education ?? null,
        },
      });

      const studentGuardian = await tx.studentGuardian.create({
        data: {
          studentId,
          guardianId: guardian.id,
          relationship: dto.relationship,
          isPrimary: dto.isPrimary ?? false,
          isEmergencyContact: dto.isEmergencyContact ?? false,
          canPickup: dto.canPickup ?? false,
          canReceiveNotifications: dto.canReceiveNotifications ?? true,
        },
        include: {
          guardian: {
            include: { person: true },
          },
        },
      });

      return studentGuardian;
    });
  }

  async findGuardians(organizationId: string, studentId: string) {
    await this.findStudent(organizationId, studentId);

    return this.prisma.studentGuardian.findMany({
      where: { studentId },
      include: {
        guardian: {
          include: { person: true },
        },
      },
      orderBy: { isPrimary: 'desc' },
    });
  }

  async removeGuardian(
    organizationId: string,
    studentId: string,
    studentGuardianId: string,
  ) {
    await this.findStudent(organizationId, studentId);

    const link = await this.prisma.studentGuardian.findFirst({
      where: { id: studentGuardianId, studentId },
    });
    if (!link) throw new NotFoundException('Guardian link not found');

    await this.prisma.studentGuardian.delete({ where: { id: studentGuardianId } });
  }

  // ─── Private helpers ──────────────────────────────────────────

  private formatStudent(student: any) {
    return {
      ...student,
      name: `${student.person.firstName} ${student.person.lastName}`,
    };
  }

  private formatStudentDetail(student: any) {
    return {
      ...student,
      name: `${student.person.firstName} ${student.person.lastName}`,
    };
  }
}
