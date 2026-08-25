import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MarkStudentAttendanceDto } from './dto/mark-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-student-attendance.dto';
import { MarkEmployeeAttendanceDto } from './dto/mark-employee-attendance.dto';
import { UpdateEmployeeAttendanceDto } from './dto/update-employee-attendance.dto';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { RejectLeaveRequestDto } from './dto/review-leave-request.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // ─── Student Attendance ───────────────────────────────────────

  async markStudentAttendance(organizationId: string, markedBy: string, dto: MarkStudentAttendanceDto) {
    const date = new Date(dto.date);

    // Upsert each entry — allows re-marking attendance for the same day
    const results = await this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.prisma.studentAttendance.upsert({
          where: {
            studentId_date: { studentId: entry.studentId, date },
          },
          create: {
            studentId: entry.studentId,
            enrollmentId: entry.enrollmentId,
            date,
            status: entry.status,
            checkInTime: entry.checkInTime ? this.parseTime(entry.checkInTime) : null,
            checkOutTime: entry.checkOutTime ? this.parseTime(entry.checkOutTime) : null,
            remarks: entry.remarks ?? null,
            markedBy,
          },
          update: {
            enrollmentId: entry.enrollmentId,
            status: entry.status,
            checkInTime: entry.checkInTime ? this.parseTime(entry.checkInTime) : null,
            checkOutTime: entry.checkOutTime ? this.parseTime(entry.checkOutTime) : null,
            remarks: entry.remarks ?? null,
            markedBy,
          },
        }),
      ),
    );

    return { count: results.length, date: dto.date, records: results };
  }

  async findStudentAttendance(
    organizationId: string,
    filters: { studentId?: string; enrollmentId?: string; date?: string; from?: string; to?: string },
  ) {
    const where: any = {};

    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.enrollmentId) where.enrollmentId = filters.enrollmentId;
    if (filters.date) {
      where.date = new Date(filters.date);
    } else if (filters.from || filters.to) {
      where.date = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }

    return this.prisma.studentAttendance.findMany({
      where,
      include: {
        student: { include: { person: true } },
        enrollment: { include: { class: true, section: true } },
      },
      orderBy: [{ date: 'desc' }, { student: { person: { firstName: 'asc' } } }],
    });
  }

  async updateStudentAttendance(
    organizationId: string,
    attendanceId: string,
    markedBy: string,
    dto: UpdateStudentAttendanceDto,
  ) {
    const record = await this.prisma.studentAttendance.findFirst({
      where: { id: attendanceId, student: { organizationId } },
    });
    if (!record) throw new NotFoundException('Attendance record not found');

    return this.prisma.studentAttendance.update({
      where: { id: attendanceId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.checkInTime !== undefined
          ? { checkInTime: dto.checkInTime ? this.parseTime(dto.checkInTime) : null }
          : {}),
        ...(dto.checkOutTime !== undefined
          ? { checkOutTime: dto.checkOutTime ? this.parseTime(dto.checkOutTime) : null }
          : {}),
        ...(dto.remarks !== undefined ? { remarks: dto.remarks ?? null } : {}),
        markedBy,
      },
    });
  }

  // ─── Employee Attendance ──────────────────────────────────────

  async markEmployeeAttendance(organizationId: string, markedBy: string, dto: MarkEmployeeAttendanceDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organizationId, deletedAt: null },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const campus = await this.prisma.campus.findFirst({
      where: { id: dto.campusId, organizationId, deletedAt: null },
    });
    if (!campus) throw new NotFoundException('Campus not found');

    const date = new Date(dto.date);

    return this.prisma.employeeAttendance.upsert({
      where: {
        employeeId_date: { employeeId: dto.employeeId, date },
      },
      create: {
        employeeId: dto.employeeId,
        campusId: dto.campusId,
        date,
        status: dto.status,
        checkInTime: dto.checkInTime ? this.parseTime(dto.checkInTime) : null,
        checkOutTime: dto.checkOutTime ? this.parseTime(dto.checkOutTime) : null,
        workHours: dto.workHours ?? null,
        remarks: dto.remarks ?? null,
        markedBy,
      },
      update: {
        campusId: dto.campusId,
        status: dto.status,
        checkInTime: dto.checkInTime ? this.parseTime(dto.checkInTime) : null,
        checkOutTime: dto.checkOutTime ? this.parseTime(dto.checkOutTime) : null,
        workHours: dto.workHours ?? null,
        remarks: dto.remarks ?? null,
        markedBy,
      },
    });
  }

  async findEmployeeAttendance(
    organizationId: string,
    filters: { employeeId?: string; campusId?: string; date?: string; from?: string; to?: string },
  ) {
    const where: any = {
      employee: { organizationId },
    };

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.campusId) where.campusId = filters.campusId;
    if (filters.date) {
      where.date = new Date(filters.date);
    } else if (filters.from || filters.to) {
      where.date = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }

    return this.prisma.employeeAttendance.findMany({
      where,
      include: {
        employee: { include: { person: true } },
      },
      orderBy: [{ date: 'desc' }, { employee: { person: { firstName: 'asc' } } }],
    });
  }

  async updateEmployeeAttendance(
    organizationId: string,
    attendanceId: string,
    markedBy: string,
    dto: UpdateEmployeeAttendanceDto,
  ) {
    const record = await this.prisma.employeeAttendance.findFirst({
      where: { id: attendanceId, employee: { organizationId } },
    });
    if (!record) throw new NotFoundException('Attendance record not found');

    return this.prisma.employeeAttendance.update({
      where: { id: attendanceId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.checkInTime !== undefined
          ? { checkInTime: dto.checkInTime ? this.parseTime(dto.checkInTime) : null }
          : {}),
        ...(dto.checkOutTime !== undefined
          ? { checkOutTime: dto.checkOutTime ? this.parseTime(dto.checkOutTime) : null }
          : {}),
        ...(dto.workHours !== undefined ? { workHours: dto.workHours ?? null } : {}),
        ...(dto.remarks !== undefined ? { remarks: dto.remarks ?? null } : {}),
        markedBy,
      },
    });
  }

  // ─── Leave Types ──────────────────────────────────────────────

  async createLeaveType(organizationId: string, dto: CreateLeaveTypeDto) {
    const existing = await this.prisma.leaveType.findFirst({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Leave type code '${dto.code}' already exists`);
    }

    return this.prisma.leaveType.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        applicableTo: dto.applicableTo,
        annualLimit: dto.annualLimit ?? null,
        isPaid: dto.isPaid ?? true,
        carryForward: dto.carryForward ?? false,
      },
    });
  }

  async findLeaveTypes(organizationId: string) {
    return this.prisma.leaveType.findMany({
      where: { organizationId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  async updateLeaveType(organizationId: string, leaveTypeId: string, dto: UpdateLeaveTypeDto) {
    const leaveType = await this.prisma.leaveType.findFirst({
      where: { id: leaveTypeId, organizationId },
    });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    if (dto.code && dto.code !== leaveType.code) {
      const conflict = await this.prisma.leaveType.findFirst({
        where: { code: dto.code },
      });
      if (conflict) throw new ConflictException(`Leave type code '${dto.code}' already exists`);
    }

    return this.prisma.leaveType.update({
      where: { id: leaveTypeId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.applicableTo !== undefined ? { applicableTo: dto.applicableTo } : {}),
        ...(dto.annualLimit !== undefined ? { annualLimit: dto.annualLimit ?? null } : {}),
        ...(dto.isPaid !== undefined ? { isPaid: dto.isPaid } : {}),
        ...(dto.carryForward !== undefined ? { carryForward: dto.carryForward } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async deleteLeaveType(organizationId: string, leaveTypeId: string) {
    const leaveType = await this.prisma.leaveType.findFirst({
      where: { id: leaveTypeId, organizationId },
    });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const inUse = await this.prisma.leaveRequest.count({ where: { leaveTypeId } });
    if (inUse > 0) {
      throw new ConflictException('Leave type has existing requests and cannot be deleted');
    }

    await this.prisma.leaveType.delete({ where: { id: leaveTypeId } });
  }

  // ─── Leave Requests ───────────────────────────────────────────

  async createLeaveRequest(organizationId: string, employeeId: string, dto: CreateLeaveRequestDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId, deletedAt: null },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const leaveType = await this.prisma.leaveType.findFirst({
      where: { id: dto.leaveTypeId, organizationId, status: 'ACTIVE' },
    });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) {
      throw new BadRequestException('End date must be on or after start date');
    }

    return this.prisma.leaveRequest.create({
      data: {
        organizationId,
        employeeId,
        leaveTypeId: dto.leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays: dto.totalDays,
        reason: dto.reason ?? null,
      },
      include: {
        leaveType: true,
        employee: { include: { person: true } },
      },
    });
  }

  async findLeaveRequests(
    organizationId: string,
    filters: { employeeId?: string; status?: string },
  ) {
    return this.prisma.leaveRequest.findMany({
      where: {
        organizationId,
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: {
        leaveType: true,
        employee: { include: { person: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLeaveRequest(organizationId: string, requestId: string) {
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id: requestId, organizationId },
      include: {
        leaveType: true,
        employee: { include: { person: true } },
      },
    });
    if (!request) throw new NotFoundException('Leave request not found');
    return request;
  }

  async approveLeaveRequest(organizationId: string, requestId: string, approverId: string) {
    const request = await this.findLeaveRequest(organizationId, requestId);

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Leave request is already ${request.status.toLowerCase()}`);
    }

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
      },
      include: {
        leaveType: true,
        employee: { include: { person: true } },
      },
    });
  }

  async rejectLeaveRequest(
    organizationId: string,
    requestId: string,
    approverId: string,
    dto: RejectLeaveRequestDto,
  ) {
    const request = await this.findLeaveRequest(organizationId, requestId);

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Leave request is already ${request.status.toLowerCase()}`);
    }

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approvedBy: approverId,
        approvedAt: new Date(),
        rejectionReason: dto.rejectionReason ?? null,
      },
      include: {
        leaveType: true,
        employee: { include: { person: true } },
      },
    });
  }

  async cancelLeaveRequest(organizationId: string, requestId: string, employeeId: string) {
    const request = await this.findLeaveRequest(organizationId, requestId);

    if (request.employeeId !== employeeId) {
      throw new BadRequestException('You can only cancel your own leave requests');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Cannot cancel a ${request.status.toLowerCase()} request`);
    }

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
      include: {
        leaveType: true,
        employee: { include: { person: true } },
      },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────

  private parseTime(timeStr: string): Date {
    // Parse HH:MM into a Date object (date part is arbitrary — Prisma stores as @db.Time)
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(1970, 0, 1, hours, minutes, 0);
    return d;
  }
}
