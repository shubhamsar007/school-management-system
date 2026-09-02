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
import { ListStudentsDto } from './dto/list-students.dto';

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
          preferredName: dto.preferredName ?? null,
          motherTongue: dto.motherTongue ?? null,
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
          religion: dto.religion ?? null,
          category: dto.category ?? null,
          caste: dto.caste ?? null,
          studentType: dto.studentType ?? null,
          admissionSource: dto.admissionSource ?? null,
        },
        include: {
          person: true,
          house: true,
        },
      });

      // Create addresses if provided
      if (dto.permanentAddress) {
        await tx.personAddress.create({
          data: {
            personId: person.id,
            type: 'PERMANENT',
            line1: dto.permanentAddress.line1 ?? null,
            line2: dto.permanentAddress.line2 ?? null,
            city: dto.permanentAddress.city ?? null,
            state: dto.permanentAddress.state ?? null,
            country: dto.permanentAddress.country ?? null,
            postalCode: dto.permanentAddress.postalCode ?? null,
          },
        });
      }
      if (dto.currentAddress) {
        await tx.personAddress.create({
          data: {
            personId: person.id,
            type: 'CURRENT',
            line1: dto.currentAddress.line1 ?? null,
            line2: dto.currentAddress.line2 ?? null,
            city: dto.currentAddress.city ?? null,
            state: dto.currentAddress.state ?? null,
            country: dto.currentAddress.country ?? null,
            postalCode: dto.currentAddress.postalCode ?? null,
          },
        });
      }

      return this.formatStudent(student);
    });
  }

  async findStudents(organizationId: string, dto: ListStudentsDto) {
    const { search, academicYearId, classId, sectionId, status, gender, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      deletedAt: null,
      ...(status ? { studentStatus: status } : {}),
      ...(gender ? { person: { gender } } : {}),
      ...(search
        ? (() => {
            const parts = search.trim().split(/\s+/);
            const OR: any[] = [
              { admissionNumber: { contains: search, mode: 'insensitive' } },
              { person: { firstName: { contains: search, mode: 'insensitive' } } },
              { person: { lastName:  { contains: search, mode: 'insensitive' } } },
            ];
            // Full-name search: "Shubham Sarvaiya" → firstName contains "Shubham" AND lastName contains "Sarvaiya"
            if (parts.length >= 2) {
              OR.push({
                AND: [
                  { person: { firstName: { contains: parts[0],                    mode: 'insensitive' } } },
                  { person: { lastName:  { contains: parts[parts.length - 1]!, mode: 'insensitive' } } },
                ],
              });
            }
            return { OR };
          })()
        : {}),
      ...((academicYearId || classId || sectionId)
        ? {
            enrollments: {
              some: {
                status: 'ACTIVE',
                ...(academicYearId ? { academicYearId } : {}),
                ...(classId ? { classId } : {}),
                ...(sectionId ? { sectionId } : {}),
              },
            },
          }
        : {}),
    };

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
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
        skip,
        take: limit,
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students.map(this.formatStudent),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStudentStats(organizationId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, active, inactive, boys, girls, newAdmissions] = await Promise.all([
      this.prisma.student.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.student.count({
        where: { organizationId, deletedAt: null, studentStatus: 'ACTIVE' },
      }),
      this.prisma.student.count({
        where: { organizationId, deletedAt: null, studentStatus: 'INACTIVE' },
      }),
      this.prisma.student.count({
        where: { organizationId, deletedAt: null, person: { gender: 'MALE' } },
      }),
      this.prisma.student.count({
        where: { organizationId, deletedAt: null, person: { gender: 'FEMALE' } },
      }),
      this.prisma.student.count({
        where: {
          organizationId,
          deletedAt: null,
          admissionDate: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    return { total, active, inactive, boys, girls, newAdmissions };
  }

  async findStudent(organizationId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, organizationId, deletedAt: null },
      include: {
        person: {
          include: { addresses: true },
        },
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
          designation: dto.designation ?? null,
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
          canAccessPortal: dto.canAccessPortal ?? false,
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
