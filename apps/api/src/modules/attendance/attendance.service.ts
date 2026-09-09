import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SubstitutionService } from '../substitution/substitution.service';
import { MarkStudentAttendanceDto } from './dto/mark-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-student-attendance.dto';
import { MarkEmployeeAttendanceDto } from './dto/mark-employee-attendance.dto';
import { UpdateEmployeeAttendanceDto } from './dto/update-employee-attendance.dto';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { RejectLeaveRequestDto } from './dto/review-leave-request.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateCorrectionDto } from './dto/create-correction.dto';
import { AllocateLeaveBalancesDto } from './dto/allocate-leave-balances.dto';
import { CreateLeaveAdjustmentDto } from './dto/create-leave-adjustment.dto';
import { SubmitLeaveEncashmentDto } from './dto/submit-leave-encashment.dto';
import { RejectLeaveEncashmentDto } from './dto/reject-leave-encashment.dto';
import { RunCarryForwardDto } from './dto/run-carry-forward.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private substitutionService: SubstitutionService,
  ) {}

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

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update request status to APPROVED
      const updated = await tx.leaveRequest.update({
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

      // 2. Increment leaveBalance.used — find the academic year containing startDate
      const academicYear = await tx.academicYear.findFirst({
        where: {
          organizationId,
          startDate: { lte: request.startDate },
          endDate: { gte: request.startDate },
        },
      });

      if (academicYear) {
        await tx.leaveBalance.upsert({
          where: {
            employeeId_leaveTypeId_academicYearId: {
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              academicYearId: academicYear.id,
            },
          },
          create: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            academicYearId: academicYear.id,
            allocated: 0,
            used: request.totalDays,
          },
          update: {
            used: { increment: request.totalDays },
          },
        });
      }

      // 3. Auto-mark attendance ON_LEAVE for each date in the range
      const employee = await tx.employee.findFirst({
        where: { id: request.employeeId },
        select: { campusId: true },
      });

      const campusId = employee?.campusId;
      if (campusId) {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(0, 0, 0, 0);

        const current = new Date(start);
        while (current <= end) {
          const dateSnap = new Date(current);
          await tx.employeeAttendance.upsert({
            where: {
              employeeId_date: { employeeId: request.employeeId, date: dateSnap },
            },
            create: {
              employeeId: request.employeeId,
              campusId,
              date: dateSnap,
              status: 'ON_LEAVE',
              markedBy: approverId,
            },
            update: {
              status: 'ON_LEAVE',
              campusId,
              markedBy: approverId,
            },
          });
          current.setUTCDate(current.getUTCDate() + 1);
        }
      }

      return updated;
    });

    // Auto-trigger substitution requests (non-blocking — silently skipped if no timetable)
    this.substitutionService.triggerForLeaveRequest(organizationId, requestId).catch(() => void 0);

    return result;
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

  async bulkApproveLeaveRequests(
    organizationId: string,
    ids: string[],
    approverId: string,
  ) {
    const approved: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of ids) {
      try {
        await this.approveLeaveRequest(organizationId, id, approverId);
        approved.push(id);
      } catch (e: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        failed.push({ id, reason: (e?.message as string) ?? 'Unknown error' });
      }
    }

    return { approved: approved.length, failed };
  }

  async bulkRejectLeaveRequests(
    organizationId: string,
    ids: string[],
    approverId: string,
    rejectionReason?: string,
  ) {
    const rejected: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of ids) {
      try {
        await this.rejectLeaveRequest(organizationId, id, approverId, {
          rejectionReason,
        });
        rejected.push(id);
      } catch (e: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        failed.push({ id, reason: (e?.message as string) ?? 'Unknown error' });
      }
    }

    return { rejected: rejected.length, failed };
  }

  async cancelApprovedLeaveRequest(
    organizationId: string,
    requestId: string,
    cancellerId: string,
  ) {
    const request = await this.findLeaveRequest(organizationId, requestId);

    if (request.status !== 'APPROVED') {
      throw new BadRequestException(
        `Only approved leave requests can be cancelled this way. Current status: ${request.status.toLowerCase()}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark as CANCELLED
      const updated = await tx.leaveRequest.update({
        where: { id: requestId },
        data: { status: 'CANCELLED' },
        include: {
          leaveType: true,
          employee: { include: { person: true } },
        },
      });

      // 2. Restore balance — find the academic year
      const academicYear = await tx.academicYear.findFirst({
        where: {
          organizationId,
          startDate: { lte: request.startDate },
          endDate: { gte: request.startDate },
        },
        select: { id: true },
      });

      if (academicYear) {
        await tx.leaveBalance.updateMany({
          where: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            academicYearId: academicYear.id,
          },
          data: {
            used: { decrement: Math.max(request.totalDays, 0) },
          },
        });
      }

      // 3. Revert ON_LEAVE attendance → ABSENT for the leave period
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(0, 0, 0, 0);

      await tx.employeeAttendance.updateMany({
        where: {
          employeeId: request.employeeId,
          date: { gte: start, lte: end },
          status: 'ON_LEAVE',
        },
        data: { status: 'ABSENT', markedBy: cancellerId },
      });

      return updated;
    });
  }

  async getTeamAvailability(organizationId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate.setUTCHours(0, 0, 0, 0);

    // Max 60-day window
    const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000);
    if (diffDays > 60) {
      throw new BadRequestException('Date range cannot exceed 60 days');
    }

    const leaves = await this.prisma.leaveRequest.findMany({
      where: {
        organizationId,
        status: 'APPROVED',
        startDate: { lte: toDate },
        endDate: { gte: fromDate },
      },
      include: {
        employee: { include: { person: true } },
        leaveType: true,
      },
      orderBy: { employee: { person: { firstName: 'asc' } } },
    });

    // Build day-by-day map
    const days: Array<{
      date: string;
      onLeave: Array<{ employeeId: string; name: string; leaveType: string; isPaid: boolean }>;
    }> = [];

    const cur = new Date(fromDate);
    while (cur <= toDate) {
      const dateStr = cur.toISOString().slice(0, 10);
      const dayTs = cur.getTime();

      const onLeave = leaves
        .filter((r) => {
          const s = new Date(r.startDate); s.setUTCHours(0,0,0,0);
          const e = new Date(r.endDate); e.setUTCHours(0,0,0,0);
          return s.getTime() <= dayTs && e.getTime() >= dayTs;
        })
        .map((r) => ({
          employeeId: r.employeeId,
          name: `${r.employee.person.firstName} ${r.employee.person.lastName}`,
          leaveType: r.leaveType.name,
          isPaid: r.leaveType.isPaid,
        }));

      days.push({ date: dateStr, onLeave });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    // Unique employees on leave in this period
    const employeeSet = new Map<string, string>();
    for (const r of leaves) {
      employeeSet.set(
        r.employeeId,
        `${r.employee.person.firstName} ${r.employee.person.lastName}`,
      );
    }

    return {
      from,
      to,
      employees: Array.from(employeeSet.entries()).map(([id, name]) => ({ id, name })),
      days,
    };
  }

  // ─── Overview ─────────────────────────────────────────────────

  async getOverview(organizationId: string, campusId?: string, date?: string) {
    const parsedDate = date ? new Date(date) : new Date();
    // Normalise to midnight UTC so date-only comparison works
    parsedDate.setUTCHours(0, 0, 0, 0);

    const dateStr = parsedDate.toISOString().slice(0, 10);

    // ── Students ──────────────────────────────────────────────
    const studentTotal = await this.prisma.studentEnrollment.count({
      where: {
        ...(campusId ? { campusId } : {}),
        student: { organizationId },
        status: 'ACTIVE',
        academicYear: { status: 'ACTIVE' },
      },
    });

    const studentGroups = await this.prisma.studentAttendance.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        date: parsedDate,
        student: { organizationId },
        ...(campusId
          ? { enrollment: { campusId } }
          : {}),
      },
    });

    const sCounts = this.toCountMap(studentGroups);
    const sPresent = sCounts['PRESENT'] ?? 0;
    const sAbsent = sCounts['ABSENT'] ?? 0;
    const sLate = sCounts['LATE'] ?? 0;
    const sHalfDay = sCounts['HALF_DAY'] ?? 0;
    const sExcused = sCounts['EXCUSED'] ?? 0;
    const sMarked = sPresent + sAbsent + sLate + sHalfDay + sExcused;
    const sRate = studentTotal > 0 ? Math.min(100, ((sPresent + sLate) / studentTotal) * 100) : 0;

    // ── Staff ─────────────────────────────────────────────────
    const staffTotal = await this.prisma.employee.count({
      where: {
        organizationId,
        employmentStatus: 'ACTIVE',
        deletedAt: null,
        ...(campusId ? { campusId } : {}),
      },
    });

    const staffGroups = await this.prisma.employeeAttendance.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        date: parsedDate,
        employee: { organizationId },
        ...(campusId ? { campusId } : {}),
      },
    });

    const empCounts = this.toCountMap(staffGroups);
    const ePresent = empCounts['PRESENT'] ?? 0;
    const eAbsent = empCounts['ABSENT'] ?? 0;
    const eLate = empCounts['LATE'] ?? 0;
    const eOnLeave = empCounts['ON_LEAVE'] ?? 0;
    const eWfh = empCounts['WORK_FROM_HOME'] ?? 0;
    const eHalfDay = empCounts['HALF_DAY'] ?? 0;
    const eMarked = ePresent + eAbsent + eLate + eOnLeave + eWfh + eHalfDay;
    const eRate = staffTotal > 0 ? Math.min(100, ((ePresent + eLate) / staffTotal) * 100) : 0;

    // ── Alerts ────────────────────────────────────────────────
    const pendingLeaveRequests = await this.prisma.leaveRequest.count({
      where: { organizationId, status: 'PENDING' },
    });

    return {
      date: dateStr,
      students: {
        total: studentTotal,
        marked: sMarked,
        present: sPresent,
        absent: sAbsent,
        late: sLate,
        halfDay: sHalfDay,
        excused: sExcused,
        rate: Math.round(sRate * 10) / 10,
      },
      staff: {
        total: staffTotal,
        marked: eMarked,
        present: ePresent,
        absent: eAbsent,
        late: eLate,
        onLeave: eOnLeave,
        wfh: eWfh,
        halfDay: eHalfDay,
        rate: Math.round(eRate * 10) / 10,
      },
      alerts: { pendingLeaveRequests },
    };
  }

  // ─── Roster ───────────────────────────────────────────────────

  async getRoster(organizationId: string, sectionId: string, academicYearId: string, date?: string) {
    const parsedDate = date ? new Date(date) : new Date();
    parsedDate.setUTCHours(0, 0, 0, 0);

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        sectionId,
        academicYearId,
        status: 'ACTIVE',
        student: { organizationId },
      },
      include: {
        student: { include: { person: true } },
      },
      orderBy: [
        { rollNumber: 'asc' },
        { student: { person: { firstName: 'asc' } } },
      ],
    });

    const studentIds = enrollments.map((e) => e.studentId);

    const attendanceRecords = await this.prisma.studentAttendance.findMany({
      where: {
        studentId: { in: studentIds },
        date: parsedDate,
      },
    });

    const attMap = new Map(attendanceRecords.map((a) => [a.studentId, a]));

    return enrollments.map((e) => {
      const att = attMap.get(e.studentId) ?? null;
      return {
        enrollmentId: e.id,
        studentId: e.studentId,
        rollNumber: e.rollNumber,
        student: {
          id: e.student.id,
          person: {
            firstName: e.student.person.firstName,
            lastName: e.student.person.lastName,
            gender: e.student.person.gender,
          },
        },
        attendance: att
          ? {
              id: att.id,
              status: att.status,
              checkInTime: att.checkInTime,
              checkOutTime: att.checkOutTime,
              remarks: att.remarks,
            }
          : null,
      };
    });
  }

  // ─── Leave Document ───────────────────────────────────────────

  async updateLeaveDocument(organizationId: string, requestId: string, documentUrl: string) {
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id: requestId, organizationId },
    });
    if (!request) throw new NotFoundException('Leave request not found');

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { documentUrl },
    });
  }

  // ─── Leave Substitutions ──────────────────────────────────────

  async getLeaveSubstitutions(organizationId: string, leaveRequestId: string) {
    return this.prisma.substitutionRequest.findMany({
      where: { leaveRequestId, organizationId },
      include: {
        assignments: {
          include: {
            substitutionCandidates: {
              orderBy: { totalScore: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  // ─── Leave Balances ───────────────────────────────────────────

  async getLeaveBalances(organizationId: string, employeeId: string, academicYearId?: string) {
    // Verify employee belongs to this organization
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const balances = await this.prisma.leaveBalance.findMany({
      where: {
        employeeId,
        ...(academicYearId ? { academicYearId } : {}),
      },
      include: { leaveType: true },
    });

    // Batch-fetch pending counts per leaveTypeId for this employee
    const pendingGroups = await this.prisma.leaveRequest.groupBy({
      by: ['leaveTypeId'],
      _count: { leaveTypeId: true },
      where: {
        employeeId,
        status: 'PENDING',
      },
    });

    const pendingMap = new Map(pendingGroups.map((g) => [g.leaveTypeId, g._count.leaveTypeId]));

    return balances.map((b) => {
      const pending = pendingMap.get(b.leaveTypeId) ?? 0;
      const remaining = Math.max(0, b.allocated - b.used - pending);
      return {
        leaveTypeId: b.leaveTypeId,
        allocated: b.allocated,
        used: b.used,
        pending,
        remaining,
        leaveType: {
          id: b.leaveType.id,
          name: b.leaveType.name,
          code: b.leaveType.code,
          isPaid: b.leaveType.isPaid,
          annualLimit: b.leaveType.annualLimit,
        },
      };
    });
  }

  // ─── Sessions ─────────────────────────────────────────────────

  async createSession(organizationId: string, userId: string, dto: CreateSessionDto) {
    const date = new Date(dto.date);
    date.setUTCHours(0, 0, 0, 0);

    return this.prisma.attendanceSession.upsert({
      where: {
        sectionId_academicYearId_date: {
          sectionId: dto.sectionId,
          academicYearId: dto.academicYearId,
          date,
        },
      },
      create: {
        organizationId,
        campusId: dto.campusId,
        sectionId: dto.sectionId,
        academicYearId: dto.academicYearId,
        date,
        status: 'OPEN',
        createdBy: userId,
      },
      update: {},
      include: {
        section: { include: { academicClass: true } },
      },
    });
  }

  async findSessions(
    organizationId: string,
    filters: { sectionId?: string; campusId?: string; date?: string; status?: string; from?: string; to?: string },
  ) {
    const where: any = { organizationId };
    if (filters.sectionId) where.sectionId = filters.sectionId;
    if (filters.campusId) where.campusId = filters.campusId;
    if (filters.status) where.status = filters.status;
    if (filters.date) {
      const d = new Date(filters.date);
      d.setUTCHours(0, 0, 0, 0);
      where.date = d;
    } else if (filters.from || filters.to) {
      where.date = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }

    return this.prisma.attendanceSession.findMany({
      where,
      include: {
        section: { include: { academicClass: true } },
        _count: { select: { corrections: true } },
      },
      orderBy: [{ date: 'desc' }],
    });
  }

  async findSession(organizationId: string, id: string) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { id, organizationId },
      include: {
        section: { include: { academicClass: true } },
        _count: { select: { corrections: true } },
      },
    });
    if (!session) throw new NotFoundException('Attendance session not found');
    return session;
  }

  async submitSession(organizationId: string, id: string, userId: string) {
    const session = await this.findSession(organizationId, id);
    if (session.status !== 'OPEN') {
      throw new BadRequestException(`Session is already ${session.status.toLowerCase()}`);
    }
    return this.prisma.attendanceSession.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date(), submittedBy: userId },
      include: { section: { include: { academicClass: true } } },
    });
  }

  async lockSession(organizationId: string, id: string, userId: string) {
    const session = await this.findSession(organizationId, id);
    if (session.status !== 'SUBMITTED' && session.status !== 'OPEN') {
      throw new BadRequestException(`Session is already ${session.status.toLowerCase()}`);
    }
    return this.prisma.attendanceSession.update({
      where: { id },
      data: { status: 'LOCKED', lockedAt: new Date(), lockedBy: userId },
      include: { section: { include: { academicClass: true } } },
    });
  }

  // ─── Corrections ──────────────────────────────────────────────

  async createCorrection(organizationId: string, userId: string, dto: CreateCorrectionDto) {
    const existing = await this.prisma.attendanceCorrection.findFirst({
      where: { attendanceId: dto.attendanceId, status: 'PENDING' },
    });
    if (existing) {
      throw new ConflictException('A pending correction already exists for this attendance record');
    }

    return this.prisma.attendanceCorrection.create({
      data: {
        organizationId,
        attendanceId: dto.attendanceId,
        attendanceType: dto.attendanceType,
        originalStatus: dto.originalStatus,
        requestedStatus: dto.requestedStatus,
        reason: dto.reason,
        requestedBy: userId,
        ...(dto.sessionId !== undefined ? { sessionId: dto.sessionId } : {}),
      },
    });
  }

  async findCorrections(
    organizationId: string,
    filters: { status?: string; attendanceType?: string; sessionId?: string },
  ) {
    return this.prisma.attendanceCorrection.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.attendanceType ? { attendanceType: filters.attendanceType } : {}),
        ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveCorrection(organizationId: string, correctionId: string, reviewerId: string) {
    const correction = await this.prisma.attendanceCorrection.findFirst({
      where: { id: correctionId, organizationId },
    });
    if (!correction) throw new NotFoundException('Correction not found');
    if (correction.status !== 'PENDING') {
      throw new BadRequestException(`Correction is already ${correction.status.toLowerCase()}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.attendanceCorrection.update({
        where: { id: correctionId },
        data: { status: 'APPROVED', reviewedBy: reviewerId, reviewedAt: new Date() },
      });

      if (correction.attendanceType === 'STUDENT') {
        await tx.studentAttendance.update({
          where: { id: correction.attendanceId },
          data: { status: correction.requestedStatus, markedBy: reviewerId },
        });
      } else if (correction.attendanceType === 'EMPLOYEE') {
        await tx.employeeAttendance.update({
          where: { id: correction.attendanceId },
          data: { status: correction.requestedStatus, markedBy: reviewerId },
        });
      }

      return updated;
    });
  }

  async rejectCorrection(
    organizationId: string,
    correctionId: string,
    reviewerId: string,
    rejectionReason?: string,
  ) {
    const correction = await this.prisma.attendanceCorrection.findFirst({
      where: { id: correctionId, organizationId },
    });
    if (!correction) throw new NotFoundException('Correction not found');
    if (correction.status !== 'PENDING') {
      throw new BadRequestException(`Correction is already ${correction.status.toLowerCase()}`);
    }

    return this.prisma.attendanceCorrection.update({
      where: { id: correctionId },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        ...(rejectionReason !== undefined ? { rejectionReason } : {}),
      },
    });
  }

  // ─── Analytics ────────────────────────────────────────────────

  async getStudentHistory(organizationId: string, studentId: string, year: number, month: number) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, organizationId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: true, section: true },
          take: 1,
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const records = await this.prisma.studentAttendance.findMany({
      where: {
        studentId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { date: 'asc' },
    });

    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const halfDay = records.filter((r) => r.status === 'HALF_DAY').length;
    const excused = records.filter((r) => r.status === 'EXCUSED').length;
    const totalDays = records.length;
    const rate = totalDays > 0 ? Math.round(((present + late) / totalDays) * 1000) / 10 : 0;

    return {
      records: records.map((r) => ({
        id: r.id,
        date: r.date.toISOString().slice(0, 10),
        status: r.status,
        checkInTime: r.checkInTime ? r.checkInTime.toISOString() : null,
        checkOutTime: r.checkOutTime ? r.checkOutTime.toISOString() : null,
        remarks: r.remarks,
      })),
      summary: { present, absent, late, halfDay, excused, rate },
      month,
      year,
    };
  }

  async getSectionSummary(
    organizationId: string,
    sectionId: string,
    academicYearId: string,
    from?: string,
    to?: string,
  ) {
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        sectionId,
        academicYearId,
        status: 'ACTIVE',
        student: { organizationId },
      },
      include: {
        student: { include: { person: true } },
      },
      orderBy: [
        { rollNumber: 'asc' },
        { student: { person: { firstName: 'asc' } } },
      ],
    });

    if (enrollments.length === 0) return [];

    const studentIds = enrollments.map((e) => e.studentId);

    const dateFilter: any = {};
    if (from || to) {
      dateFilter.date = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const records = await this.prisma.studentAttendance.findMany({
      where: {
        studentId: { in: studentIds },
        ...dateFilter,
      },
    });

    const byStudent = new Map<string, typeof records>();
    for (const r of records) {
      if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, []);
      byStudent.get(r.studentId)!.push(r);
    }

    return enrollments.map((e) => {
      const recs = byStudent.get(e.studentId) ?? [];
      const present = recs.filter((r) => r.status === 'PRESENT').length;
      const absent = recs.filter((r) => r.status === 'ABSENT').length;
      const late = recs.filter((r) => r.status === 'LATE').length;
      const halfDay = recs.filter((r) => r.status === 'HALF_DAY').length;
      const excused = recs.filter((r) => r.status === 'EXCUSED').length;
      const totalDays = recs.length;
      const rate = totalDays > 0 ? Math.round(((present + late) / totalDays) * 1000) / 10 : 0;

      return {
        studentId: e.studentId,
        enrollmentId: e.id,
        rollNumber: e.rollNumber,
        student: {
          id: e.student.id,
          person: {
            firstName: e.student.person.firstName,
            lastName: e.student.person.lastName,
          },
        },
        present,
        absent,
        late,
        halfDay,
        excused,
        totalDays,
        rate,
      };
    });
  }

  async getClassSummaries(organizationId: string, academicYearId: string, campusId?: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const sections = await this.prisma.section.findMany({
      where: {
        academicClass: { organizationId },
        ...(campusId ? { campusId } : {}),
      },
      include: { academicClass: true },
      orderBy: [{ academicClass: { level: 'asc' } }, { name: 'asc' }],
    });

    const results = await Promise.all(
      sections.map(async (sec) => {
        const studentCount = await this.prisma.studentEnrollment.count({
          where: {
            sectionId: sec.id,
            academicYearId,
            status: 'ACTIVE',
            student: { organizationId },
          },
        });

        const groups = await this.prisma.studentAttendance.groupBy({
          by: ['status'],
          _count: { status: true },
          where: {
            enrollment: { sectionId: sec.id, academicYearId },
            student: { organizationId },
            date: { gte: startOfMonth, lte: endOfMonth },
          },
        });

        const counts = this.toCountMap(groups);
        const present = counts['PRESENT'] ?? 0;
        const absent = counts['ABSENT'] ?? 0;
        const late = counts['LATE'] ?? 0;
        const total = present + absent + late + (counts['HALF_DAY'] ?? 0) + (counts['EXCUSED'] ?? 0);
        const rate = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 0;

        return {
          sectionId: sec.id,
          sectionName: sec.name,
          className: sec.academicClass.name,
          level: sec.academicClass.level ?? null,
          studentCount,
          present,
          absent,
          late,
          rate,
        };
      }),
    );

    return results;
  }

  async getAttendanceTrends(organizationId: string, campusId?: string, months = 6) {
    const now = new Date();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const groups = await this.prisma.studentAttendance.groupBy({
        by: ['status'],
        _count: { status: true },
        where: {
          student: { organizationId },
          date: { gte: startOfMonth, lte: endOfMonth },
          ...(campusId ? { enrollment: { campusId } } : {}),
        },
      });

      const counts = this.toCountMap(groups);
      const present = counts['PRESENT'] ?? 0;
      const absent = counts['ABSENT'] ?? 0;
      const late = counts['LATE'] ?? 0;
      const total = present + absent + late + (counts['HALF_DAY'] ?? 0) + (counts['EXCUSED'] ?? 0);
      const rate = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 0;

      const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      result.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`,
        present,
        absent,
        late,
        total,
        rate,
      });
    }

    return result;
  }

  // ─── Leave Balance Allocation ─────────────────────────────────

  async allocateLeaveBalances(organizationId: string, dto: AllocateLeaveBalancesDto) {
    // Get all active employees
    const employees = await this.prisma.employee.findMany({
      where: { organizationId, employmentStatus: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });

    // Get active leave types (or just the one specified)
    const leaveTypes = await this.prisma.leaveType.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        ...(dto.leaveTypeId ? { id: dto.leaveTypeId } : {}),
      },
      select: { id: true, annualLimit: true },
    });

    let count = 0;

    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        const allocated = leaveType.annualLimit ?? 0;

        await this.prisma.leaveBalance.upsert({
          where: {
            employeeId_leaveTypeId_academicYearId: {
              employeeId: employee.id,
              leaveTypeId: leaveType.id,
              academicYearId: dto.academicYearId,
            },
          },
          create: {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            academicYearId: dto.academicYearId,
            allocated,
            used: 0,
          },
          update: {
            allocated,
            ...(dto.resetExisting ? { used: 0 } : {}),
          },
        });
        count++;
      }
    }

    return { count };
  }

  // ─── Leave Balance Ledger ─────────────────────────────────────

  async getLeaveBalanceLedger(
    organizationId: string,
    employeeId: string,
    leaveTypeId?: string,
    academicYearId?: string,
  ) {
    return this.prisma.leaveBalanceLedger.findMany({
      where: {
        employeeId,
        ...(leaveTypeId ? { leaveTypeId } : {}),
        ...(academicYearId ? { academicYearId } : {}),
        leaveType: { organizationId },
      },
      include: { leaveType: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Leave Adjustments ────────────────────────────────────────

  async createLeaveAdjustment(
    organizationId: string,
    adjustedBy: string,
    dto: CreateLeaveAdjustmentDto,
  ) {
    const { employeeId, leaveTypeId, academicYearId, delta, reason } = dto;

    return this.prisma.$transaction(async (tx) => {
      await tx.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_academicYearId: { employeeId, leaveTypeId, academicYearId },
        },
        create: { employeeId, leaveTypeId, academicYearId, allocated: Math.max(0, delta), used: 0 },
        update: { allocated: { increment: delta } },
      });

      const current = await tx.leaveBalance.findUniqueOrThrow({
        where: {
          employeeId_leaveTypeId_academicYearId: { employeeId, leaveTypeId, academicYearId },
        },
      });

      const balanceAfter = current.allocated - current.used;

      const adjustment = await tx.leaveAdjustment.create({
        data: { organizationId, employeeId, leaveTypeId, academicYearId, delta, reason, adjustedBy },
      });

      await tx.leaveBalanceLedger.create({
        data: {
          employeeId,
          leaveTypeId,
          academicYearId,
          delta,
          balanceAfter,
          reason,
          source: 'ADJUSTMENT',
          referenceId: adjustment.id,
          createdBy: adjustedBy,
        },
      });

      return adjustment;
    });
  }

  async getLeaveAdjustments(
    organizationId: string,
    employeeId?: string,
    leaveTypeId?: string,
    academicYearId?: string,
  ) {
    return this.prisma.leaveAdjustment.findMany({
      where: {
        organizationId,
        ...(employeeId ? { employeeId } : {}),
        ...(leaveTypeId ? { leaveTypeId } : {}),
        ...(academicYearId ? { academicYearId } : {}),
      },
      include: { leaveType: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Carry Forward ────────────────────────────────────────────

  async runCarryForward(organizationId: string, performedBy: string, dto: RunCarryForwardDto) {
    const { fromAcademicYearId, toAcademicYearId } = dto;

    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { organizationId, carryForward: true, status: 'ACTIVE' },
      select: { id: true },
    });

    if (leaveTypes.length === 0) return { processed: 0 };

    const leaveTypeIds = leaveTypes.map((lt) => lt.id);

    const balances = await this.prisma.leaveBalance.findMany({
      where: { leaveTypeId: { in: leaveTypeIds }, academicYearId: fromAcademicYearId },
    });

    let processed = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const balance of balances) {
        const remaining = balance.allocated - balance.used;
        if (remaining <= 0) continue;

        await tx.leaveBalance.upsert({
          where: {
            employeeId_leaveTypeId_academicYearId: {
              employeeId: balance.employeeId,
              leaveTypeId: balance.leaveTypeId,
              academicYearId: toAcademicYearId,
            },
          },
          create: {
            employeeId: balance.employeeId,
            leaveTypeId: balance.leaveTypeId,
            academicYearId: toAcademicYearId,
            allocated: remaining,
            used: 0,
          },
          update: { allocated: { increment: remaining } },
        });

        const updated = await tx.leaveBalance.findUniqueOrThrow({
          where: {
            employeeId_leaveTypeId_academicYearId: {
              employeeId: balance.employeeId,
              leaveTypeId: balance.leaveTypeId,
              academicYearId: toAcademicYearId,
            },
          },
        });

        await tx.leaveBalanceLedger.create({
          data: {
            employeeId: balance.employeeId,
            leaveTypeId: balance.leaveTypeId,
            academicYearId: toAcademicYearId,
            delta: remaining,
            balanceAfter: updated.allocated - updated.used,
            reason: `Carry forward from academic year ${fromAcademicYearId}`,
            source: 'CARRY_FORWARD',
            referenceId: fromAcademicYearId,
            createdBy: performedBy,
          },
        });

        processed++;
      }
    });

    return { processed };
  }

  // ─── Leave Encashment ─────────────────────────────────────────

  async submitLeaveEncashment(
    organizationId: string,
    employeeId: string,
    requestedBy: string,
    dto: SubmitLeaveEncashmentDto,
  ) {
    const { leaveTypeId, academicYearId, days, amountPerDay } = dto;

    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.leaveBalance.findUnique({
        where: { employeeId_leaveTypeId_academicYearId: { employeeId, leaveTypeId, academicYearId } },
      });

      const available = balance ? balance.allocated - balance.used : 0;
      if (available < days) {
        throw new BadRequestException(
          `Insufficient leave balance. Available: ${available}, Requested: ${days}`,
        );
      }

      const totalAmount = days * amountPerDay;

      const encashment = await tx.leaveEncashment.create({
        data: {
          organizationId,
          employeeId,
          leaveTypeId,
          academicYearId,
          days,
          amountPerDay,
          totalAmount,
          status: 'PENDING',
          requestedBy,
        },
      });

      await tx.leaveBalance.update({
        where: { employeeId_leaveTypeId_academicYearId: { employeeId, leaveTypeId, academicYearId } },
        data: { allocated: { decrement: days } },
      });

      const updated = await tx.leaveBalance.findUniqueOrThrow({
        where: { employeeId_leaveTypeId_academicYearId: { employeeId, leaveTypeId, academicYearId } },
      });

      await tx.leaveBalanceLedger.create({
        data: {
          employeeId,
          leaveTypeId,
          academicYearId,
          delta: -days,
          balanceAfter: updated.allocated - updated.used,
          reason: `Encashment request for ${days} day(s)`,
          source: 'ENCASHMENT',
          referenceId: encashment.id,
          createdBy: requestedBy,
        },
      });

      return encashment;
    });
  }

  async approveLeaveEncashment(organizationId: string, encashmentId: string, approverId: string) {
    const encashment = await this.prisma.leaveEncashment.findFirst({
      where: { id: encashmentId, organizationId, status: 'PENDING' },
    });

    if (!encashment) {
      throw new NotFoundException('Encashment request not found or already processed');
    }

    return this.prisma.leaveEncashment.update({
      where: { id: encashmentId },
      data: { status: 'APPROVED', approvedBy: approverId, approvedAt: new Date() },
    });
  }

  async rejectLeaveEncashment(
    organizationId: string,
    encashmentId: string,
    approverId: string,
    dto: RejectLeaveEncashmentDto,
  ) {
    const encashment = await this.prisma.leaveEncashment.findFirst({
      where: { id: encashmentId, organizationId, status: 'PENDING' },
    });

    if (!encashment) {
      throw new NotFoundException('Encashment request not found or already processed');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.leaveEncashment.update({
        where: { id: encashmentId },
        data: {
          status: 'REJECTED',
          approvedBy: approverId,
          approvedAt: new Date(),
          rejectionReason: dto.reason,
        },
      });

      await tx.leaveBalance.update({
        where: {
          employeeId_leaveTypeId_academicYearId: {
            employeeId: encashment.employeeId,
            leaveTypeId: encashment.leaveTypeId,
            academicYearId: encashment.academicYearId,
          },
        },
        data: { allocated: { increment: encashment.days } },
      });

      const updated = await tx.leaveBalance.findUniqueOrThrow({
        where: {
          employeeId_leaveTypeId_academicYearId: {
            employeeId: encashment.employeeId,
            leaveTypeId: encashment.leaveTypeId,
            academicYearId: encashment.academicYearId,
          },
        },
      });

      await tx.leaveBalanceLedger.create({
        data: {
          employeeId: encashment.employeeId,
          leaveTypeId: encashment.leaveTypeId,
          academicYearId: encashment.academicYearId,
          delta: encashment.days,
          balanceAfter: updated.allocated - updated.used,
          reason: `Encashment rejected: ${dto.reason}`,
          source: 'ENCASHMENT',
          referenceId: encashmentId,
          createdBy: approverId,
        },
      });
    });
  }

  async getLeaveEncashments(organizationId: string, employeeId?: string, status?: string) {
    return this.prisma.leaveEncashment.findMany({
      where: {
        organizationId,
        ...(employeeId ? { employeeId } : {}),
        ...(status ? { status } : {}),
      },
      include: { leaveType: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Leave Analytics ──────────────────────────────────────────

  async getLeaveUtilizationReport(
    organizationId: string,
    academicYearId?: string,
    leaveTypeId?: string,
  ) {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        organizationId,
        status: 'APPROVED',
        ...(leaveTypeId ? { leaveTypeId } : {}),
        ...(academicYearId
          ? {
              employee: {
                leaveBalances: {
                  some: { academicYearId },
                },
              },
            }
          : {}),
      },
      include: {
        leaveType: { select: { id: true, name: true, code: true, isPaid: true } },
        employee: {
          select: {
            id: true,
            person: { select: { firstName: true, lastName: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    // By leave type
    const byType = new Map<string, { id: string; name: string; code: string; isPaid: boolean; totalDays: number; count: number }>();
    // By department
    const byDept = new Map<string, { id: string; name: string; totalDays: number; count: number }>();
    // By month (YYYY-MM)
    const byMonth = new Map<string, { month: string; label: string; totalDays: number; count: number }>();

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    for (const req of requests) {
      // Type aggregation
      const typeKey = req.leaveTypeId;
      if (!byType.has(typeKey)) {
        byType.set(typeKey, { id: req.leaveType.id, name: req.leaveType.name, code: req.leaveType.code, isPaid: req.leaveType.isPaid, totalDays: 0, count: 0 });
      }
      const t = byType.get(typeKey)!;
      t.totalDays += req.totalDays;
      t.count++;

      // Department aggregation
      const deptId = req.employee.department?.id ?? 'unassigned';
      const deptName = req.employee.department?.name ?? 'Unassigned';
      if (!byDept.has(deptId)) byDept.set(deptId, { id: deptId, name: deptName, totalDays: 0, count: 0 });
      const d = byDept.get(deptId)!;
      d.totalDays += req.totalDays;
      d.count++;

      // Month aggregation (by startDate)
      const start = new Date(req.startDate);
      const monthKey = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`;
      if (!byMonth.has(monthKey)) byMonth.set(monthKey, { month: monthKey, label: monthLabel, totalDays: 0, count: 0 });
      const m = byMonth.get(monthKey)!;
      m.totalDays += req.totalDays;
      m.count++;
    }

    return {
      totalRequests: requests.length,
      totalDays: requests.reduce((s, r) => s + r.totalDays, 0),
      byType: [...byType.values()].sort((a, b) => b.totalDays - a.totalDays),
      byDepartment: [...byDept.values()].sort((a, b) => b.totalDays - a.totalDays),
      byMonth: [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  async getAbsenteeismHeatmap(organizationId: string, year: number, month?: number) {
    const start = month
      ? new Date(Date.UTC(year, month - 1, 1))
      : new Date(Date.UTC(year, 0, 1));
    const end = month
      ? new Date(Date.UTC(year, month, 0, 23, 59, 59))
      : new Date(Date.UTC(year, 11, 31, 23, 59, 59));

    const records = await this.prisma.employeeAttendance.groupBy({
      by: ['date'],
      _count: { date: true },
      where: {
        employee: { organizationId, deletedAt: null },
        status: 'ABSENT',
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'asc' },
    });

    return records.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      count: r._count.date,
    }));
  }

  async getExpiringBalances(organizationId: string, academicYearId: string, daysThreshold = 30) {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: academicYearId, organizationId },
      select: { endDate: true },
    });
    if (!academicYear) throw new NotFoundException('Academic year not found');

    const daysLeft = Math.ceil(
      (new Date(academicYear.endDate).getTime() - Date.now()) / 86400000,
    );

    if (daysLeft > daysThreshold) return { daysLeft, expiring: [] };

    const balances = await this.prisma.leaveBalance.findMany({
      where: {
        academicYearId,
        leaveType: { organizationId },
        allocated: { gt: 0 },
      },
      include: {
        leaveType: { select: { name: true, code: true, carryForward: true } },
      },
    });

    const expiring = balances
      .map((b) => ({ ...b, remaining: b.allocated - b.used }))
      .filter((b) => b.remaining > 0 && !b.leaveType.carryForward);

    return { daysLeft, expiring };
  }

  async getLeavePatternAnalysis(organizationId: string, academicYearId?: string) {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        organizationId,
        status: 'APPROVED',
        ...(academicYearId
          ? {
              employee: { leaveBalances: { some: { academicYearId } } },
            }
          : {}),
      },
      select: {
        employeeId: true,
        startDate: true,
        totalDays: true,
        employee: {
          select: { person: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    // Count per employee per day-of-week
    const empDow = new Map<string, { name: string; dow: number[] }>();

    for (const req of requests) {
      if (!empDow.has(req.employeeId)) {
        empDow.set(req.employeeId, {
          name: `${req.employee.person.firstName} ${req.employee.person.lastName}`,
          dow: [0, 0, 0, 0, 0, 0, 0],
        });
      }
      const dow = new Date(req.startDate).getUTCDay(); // 0=Sun, 1=Mon
      empDow.get(req.employeeId)!.dow[dow]++;
    }

    const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const flags: Array<{
      employeeId: string;
      employeeName: string;
      flag: string;
      detail: string;
    }> = [];

    for (const [employeeId, data] of empDow) {
      const total = data.dow.reduce((a, b) => a + b, 0);
      if (total < 3) continue; // not enough data

      // Monday-heavy: Mon >= 40% of all leaves
      const monPct = total > 0 ? data.dow[1] / total : 0;
      if (monPct >= 0.4) {
        flags.push({
          employeeId,
          employeeName: data.name,
          flag: 'MONDAY_HEAVY',
          detail: `${Math.round(monPct * 100)}% of leaves start on Monday (${data.dow[1]} of ${total})`,
        });
      }

      // Friday-heavy: Fri >= 40%
      const friPct = total > 0 ? data.dow[5] / total : 0;
      if (friPct >= 0.4) {
        flags.push({
          employeeId,
          employeeName: data.name,
          flag: 'FRIDAY_HEAVY',
          detail: `${Math.round(friPct * 100)}% of leaves start on Friday (${data.dow[5]} of ${total})`,
        });
      }

      // Weekend-adjacent: Mon + Fri combined >= 60%
      const weekendAdj = data.dow[1] + data.dow[5];
      const weekendAdjPct = total > 0 ? weekendAdj / total : 0;
      if (weekendAdjPct >= 0.6 && monPct < 0.4 && friPct < 0.4) {
        flags.push({
          employeeId,
          employeeName: data.name,
          flag: 'WEEKEND_ADJACENT',
          detail: `${Math.round(weekendAdjPct * 100)}% of leaves are Mon or Fri (${weekendAdj} of ${total})`,
        });
      }
    }

    return { flags };
  }

  async getCarryForwardReport(organizationId: string, toAcademicYearId: string) {
    const ledgerEntries = await this.prisma.leaveBalanceLedger.findMany({
      where: {
        academicYearId: toAcademicYearId,
        source: 'CARRY_FORWARD',
        leaveType: { organizationId },
      },
      include: {
        leaveType: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by employee
    const byEmployee = new Map<string, { employeeId: string; totalCarried: number; entries: typeof ledgerEntries }>();
    for (const entry of ledgerEntries) {
      if (!byEmployee.has(entry.employeeId)) {
        byEmployee.set(entry.employeeId, { employeeId: entry.employeeId, totalCarried: 0, entries: [] });
      }
      const e = byEmployee.get(entry.employeeId)!;
      e.totalCarried += entry.delta;
      e.entries.push(entry);
    }

    return {
      toAcademicYearId,
      employeeCount: byEmployee.size,
      totalDaysCarried: ledgerEntries.reduce((s, e) => s + e.delta, 0),
      details: ledgerEntries,
    };
  }

  async getLeaveCostReport(organizationId: string, academicYearId?: string) {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        organizationId,
        status: 'APPROVED',
        leaveType: { isPaid: true },
      },
      select: {
        employeeId: true,
        totalDays: true,
        employee: {
          select: {
            person: { select: { firstName: true, lastName: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

    // Fetch active salary structures for all involved employees
    const employeeIds = [...new Set(requests.map((r) => r.employeeId))];
    const salaryStructures = await this.prisma.salaryStructure.findMany({
      where: { employeeId: { in: employeeIds }, status: 'ACTIVE' },
      select: { employeeId: true, grossSalary: true },
    });
    const salaryMap = new Map<string, number>(
      salaryStructures.map((s) => [s.employeeId, Number(s.grossSalary)]),
    );

    const WORKING_DAYS_PER_MONTH = 26;

    const byEmployee = new Map<string, {
      employeeId: string;
      name: string;
      department: string;
      paidLeaveDays: number;
      estimatedCost: number;
    }>();

    for (const req of requests) {
      const grossSalary = salaryMap.get(req.employeeId) ?? 0;
      const dailyRate = grossSalary / WORKING_DAYS_PER_MONTH;
      const cost = req.totalDays * dailyRate;

      if (!byEmployee.has(req.employeeId)) {
        byEmployee.set(req.employeeId, {
          employeeId: req.employeeId,
          name: `${req.employee.person.firstName} ${req.employee.person.lastName}`,
          department: req.employee.department?.name ?? 'Unassigned',
          paidLeaveDays: 0,
          estimatedCost: 0,
        });
      }
      const e = byEmployee.get(req.employeeId)!;
      e.paidLeaveDays += req.totalDays;
      e.estimatedCost += cost;
    }

    const rows = [...byEmployee.values()]
      .map((r) => ({ ...r, estimatedCost: Math.round(r.estimatedCost * 100) / 100 }))
      .sort((a, b) => b.estimatedCost - a.estimatedCost);

    return {
      totalPaidLeaveDays: rows.reduce((s, r) => s + r.paidLeaveDays, 0),
      totalEstimatedCost: Math.round(rows.reduce((s, r) => s + r.estimatedCost, 0) * 100) / 100,
      rows,
    };
  }

  // ─── Health Alerts ────────────────────────────────────────────

  async getStudentHealthAlerts(
    organizationId: string,
    campusId?: string,
    academicYearId?: string,
  ) {
    const enrollmentWhere: any = {
      student: { organizationId },
      status: 'ACTIVE',
      ...(academicYearId ? { academicYearId } : {}),
      ...(campusId ? { campusId } : {}),
    };

    // Fetch enrollments to get the set of studentIds in scope
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: enrollmentWhere,
      select: { studentId: true, student: { select: { person: { select: { firstName: true, lastName: true } } } } },
    });

    if (enrollments.length === 0) {
      return { belowThreshold: [], consecutiveAbsent: [], frequentLate: [] };
    }

    const studentIds = [...new Set(enrollments.map((e) => e.studentId))];

    // Build a name map
    const nameMap = new Map<string, string>();
    for (const e of enrollments) {
      if (!nameMap.has(e.studentId)) {
        nameMap.set(e.studentId, `${e.student.person.firstName} ${e.student.person.lastName}`);
      }
    }

    // ── belowThreshold: (present+late)/total < 0.75 ──────────────
    const attendanceGroups = await this.prisma.studentAttendance.groupBy({
      by: ['studentId', 'status'],
      _count: { status: true },
      where: {
        studentId: { in: studentIds },
        ...(academicYearId ? { enrollment: { academicYearId } } : {}),
      },
    });

    // Group by studentId
    const byStudentStatus = new Map<string, Record<string, number>>();
    for (const g of attendanceGroups) {
      if (!byStudentStatus.has(g.studentId)) byStudentStatus.set(g.studentId, {});
      byStudentStatus.get(g.studentId)![g.status] = g._count.status;
    }

    const belowThreshold: Array<{ studentId: string; studentName: string; rate: number }> = [];
    for (const [studentId, counts] of byStudentStatus) {
      const present = counts['PRESENT'] ?? 0;
      const late = counts['LATE'] ?? 0;
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      if (total === 0) continue;
      const rate = (present + late) / total;
      if (rate < 0.75) {
        belowThreshold.push({
          studentId,
          studentName: nameMap.get(studentId) ?? studentId,
          rate: Math.round(rate * 1000) / 10,
        });
      }
    }

    // ── consecutiveAbsent: 3+ consecutive ABSENT in last 5 days ──
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setUTCDate(fiveDaysAgo.getUTCDate() - 4);

    const recentRecords = await this.prisma.studentAttendance.findMany({
      where: {
        studentId: { in: studentIds },
        date: { gte: fiveDaysAgo, lte: now },
      },
      select: { studentId: true, date: true, status: true },
      orderBy: { date: 'asc' },
    });

    const byStudent = new Map<string, Array<{ date: Date; status: string }>>();
    for (const r of recentRecords) {
      if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, []);
      byStudent.get(r.studentId)!.push({ date: r.date, status: r.status });
    }

    const consecutiveAbsent: Array<{ studentId: string; studentName: string; count: number; lastDate: string }> = [];
    for (const [studentId, records] of byStudent) {
      const sorted = records.sort((a, b) => b.date.getTime() - a.date.getTime());
      // Check last 3 days
      const lastThree = sorted.slice(0, 3);
      if (lastThree.length >= 3 && lastThree.every((r) => r.status === 'ABSENT')) {
        consecutiveAbsent.push({
          studentId,
          studentName: nameMap.get(studentId) ?? studentId,
          count: lastThree.length,
          lastDate: sorted[0].date.toISOString().slice(0, 10),
        });
      }
    }

    // ── frequentLate: 5+ LATE records in current calendar month ──
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const lateGroups = await this.prisma.studentAttendance.groupBy({
      by: ['studentId'],
      _count: { studentId: true },
      where: {
        studentId: { in: studentIds },
        status: 'LATE',
        date: { gte: startOfMonth, lte: now },
      },
      having: { studentId: { _count: { gte: 5 } } },
    });

    const frequentLate = lateGroups.map((g) => ({
      studentId: g.studentId,
      studentName: nameMap.get(g.studentId) ?? g.studentId,
      count: g._count.studentId,
    }));

    return { belowThreshold, consecutiveAbsent, frequentLate };
  }

  async getStaffHealthAlerts(
    organizationId: string,
    campusId?: string,
    date?: string,
  ) {
    const parsedDate = date ? new Date(date) : new Date();
    parsedDate.setUTCHours(0, 0, 0, 0);

    const empWhere: any = {
      employee: { organizationId },
      date: parsedDate,
      ...(campusId ? { campusId } : {}),
    };

    // Fetch employees to build name map
    const allEmployees = await this.prisma.employee.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(campusId ? { campusId } : {}),
      },
      select: {
        id: true,
        person: { select: { firstName: true, lastName: true } },
      },
    });
    const empNameMap = new Map<string, string>(
      allEmployees.map((e) => [e.id, `${e.person.firstName} ${e.person.lastName}`]),
    );
    const allEmpIds = allEmployees.map((e) => e.id);

    // ── missingCheckout ───────────────────────────────────────────
    const missingCheckoutRecords = await this.prisma.employeeAttendance.findMany({
      where: {
        ...empWhere,
        checkInTime: { not: null },
        checkOutTime: null,
        status: 'PRESENT',
      },
      select: { employeeId: true, date: true },
    });

    const missingCheckout = missingCheckoutRecords.map((r) => ({
      employeeId: r.employeeId,
      employeeName: empNameMap.get(r.employeeId) ?? r.employeeId,
      date: r.date.toISOString().slice(0, 10),
    }));

    // ── consecutiveAbsent (last 5 days) ──────────────────────────
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setUTCDate(fiveDaysAgo.getUTCDate() - 4);

    const recentEmpRecords = await this.prisma.employeeAttendance.findMany({
      where: {
        employee: { organizationId },
        ...(campusId ? { campusId } : {}),
        employeeId: { in: allEmpIds },
        date: { gte: fiveDaysAgo, lte: now },
      },
      select: { employeeId: true, date: true, status: true },
      orderBy: { date: 'asc' },
    });

    const byEmp = new Map<string, Array<{ date: Date; status: string }>>();
    for (const r of recentEmpRecords) {
      if (!byEmp.has(r.employeeId)) byEmp.set(r.employeeId, []);
      byEmp.get(r.employeeId)!.push({ date: r.date, status: r.status });
    }

    const consecutiveAbsent: Array<{ employeeId: string; employeeName: string; count: number; lastDate: string }> = [];
    for (const [employeeId, records] of byEmp) {
      const sorted = records.sort((a, b) => b.date.getTime() - a.date.getTime());
      const lastThree = sorted.slice(0, 3);
      if (lastThree.length >= 3 && lastThree.every((r) => r.status === 'ABSENT')) {
        consecutiveAbsent.push({
          employeeId,
          employeeName: empNameMap.get(employeeId) ?? employeeId,
          count: lastThree.length,
          lastDate: sorted[0].date.toISOString().slice(0, 10),
        });
      }
    }

    // ── belowHours: workHours < 7.5 today ────────────────────────
    const belowHoursRecords = await this.prisma.employeeAttendance.findMany({
      where: {
        ...empWhere,
        workHours: { lt: 7.5, not: null },
        status: { in: ['PRESENT', 'HALF_DAY'] },
      },
      select: { employeeId: true, workHours: true, date: true },
    });

    const belowHours = belowHoursRecords.map((r) => ({
      employeeId: r.employeeId,
      employeeName: empNameMap.get(r.employeeId) ?? r.employeeId,
      date: r.date.toISOString().slice(0, 10),
      workHours: r.workHours ?? undefined,
    }));

    return { missingCheckout, consecutiveAbsent, belowHours };
  }

  // ─── Private helpers ──────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toCountMap(groups: any[]): Record<string, number> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return Object.fromEntries(groups.map((g) => [g.status as string, g._count.status as number]));
  }

  private parseTime(timeStr: string): Date {
    // Parse HH:MM into a Date object (date part is arbitrary — Prisma stores as @db.Time)
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(1970, 0, 1, hours, minutes, 0);
    return d;
  }
}
