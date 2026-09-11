import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../database/prisma.service';
import { ConfirmAssignmentDto } from './dto/confirm-assignment.dto';
import { CreateManualRequestDto } from './dto/create-manual-request.dto';
import { UpsertPolicyDto } from './dto/upsert-policy.dto';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Algorithm constants ──────────────────────────────────────
const MAX_SUBJECT_PROFICIENCY = 40;
const MAX_WORKLOAD = 30;
const MAX_FAIRNESS = 20;
const MAX_DEPT_AFFINITY = 10;

@Injectable()
export class SubstitutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Policy ───────────────────────────────────────────────────

  async getPolicy(organizationId: string) {
    const policy = await this.prisma.substitutionPolicy.findUnique({ where: { organizationId } });
    return policy ?? {
      organizationId,
      maxSubsPerDay: 2, maxSubsPerWeek: 6,
      autoAssignThreshold: 85, escalateAfterMinutes: 5, fairnessWindowDays: 7,
      weightSubject: 40, weightWorkload: 30, weightFairness: 20, weightDept: 10,
      mode: 'HYBRID', notifyTeacher: true, notifyParents: false, subjectMatchRequired: false,
    };
  }

  async upsertPolicy(organizationId: string, dto: UpsertPolicyDto) {
    return this.prisma.substitutionPolicy.upsert({
      where: { organizationId },
      create: { organizationId, ...dto },
      update: { ...dto },
    });
  }

  // ─── Trigger ──────────────────────────────────────────────────

  /**
   * Called after a leave request is approved.
   * Creates one SubstitutionRequest per day of leave, then for each day finds
   * the affected timetable entries and creates SubstitutionAssignments.
   * Also runs the scoring algorithm and stores candidate scores.
   */
  async triggerForLeaveRequest(organizationId: string, leaveRequestId: string) {
    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: { id: leaveRequestId, organizationId },
      include: { employee: true },
    });
    if (!leaveRequest) throw new NotFoundException('Leave request not found');
    if (leaveRequest.status !== 'APPROVED') {
      throw new BadRequestException('Substitution can only be triggered for approved leave requests');
    }

    // Find the active timetable for the employee's campus
    const activeTimetable = await this.prisma.timetable.findFirst({
      where: { campusId: leaveRequest.employee.campusId ?? '', organizationId, status: 'ACTIVE' },
    });
    if (!activeTimetable) {
      return { message: 'No active timetable found for campus — no substitutions created', requests: [] };
    }

    const academicYearId = activeTimetable.academicYearId;
    const requests: object[] = [];

    // Iterate over each day of the leave period
    const current = new Date(leaveRequest.startDate);
    const end = new Date(leaveRequest.endDate);

    while (current <= end) {
      const dayOfWeek = current.getDay() === 0 ? 7 : current.getDay(); // JS: 0=Sun, convert to 1=Mon...7=Sun

      // Find entries for this teacher on this day of week in the active timetable
      const affectedEntries = await this.prisma.timetableEntry.findMany({
        where: { timetableId: activeTimetable.id, teacherId: leaveRequest.employeeId, dayOfWeek },
        include: { period: true, section: true, subject: true },
      });

      if (affectedEntries.length > 0) {
        // Check if a request already exists for this leave + date
        const existing = await this.prisma.substitutionRequest.findFirst({
          where: { leaveRequestId, date: new Date(current) },
        });

        let subRequest = existing;

        if (!subRequest) {
          subRequest = await this.prisma.substitutionRequest.create({
            data: {
              organizationId,
              leaveRequestId,
              academicYearId,
              date: new Date(current),
              status: 'PENDING',
            },
          });
        }

        // Create assignments for each affected entry (skip if already exists)
        for (const entry of affectedEntries) {
          const existingAssignment = await this.prisma.substitutionAssignment.findFirst({
            where: { substitutionRequestId: subRequest.id, timetableEntryId: entry.id },
          });
          if (!existingAssignment) {
            await this.prisma.substitutionAssignment.create({
              data: {
                substitutionRequestId: subRequest.id,
                timetableEntryId: entry.id,
                originalTeacherId: leaveRequest.employeeId,
                status: 'SUGGESTED',
              },
            });
          }
        }

        // Run scoring algorithm for this request
        await this.runScoringAlgorithm(organizationId, subRequest.id, leaveRequest.employeeId, affectedEntries, academicYearId, activeTimetable.id, new Date(current));
        // Auto-confirm if policy allows (HYBRID/AUTO_ASSIGN mode)
        await this.autoConfirmBestCandidate(organizationId, subRequest.id);

        requests.push(subRequest);
        await this.writeAudit(organizationId, 'TRIGGERED', null, subRequest.id, undefined, { leaveRequestId });
      }

      current.setDate(current.getDate() + 1);
    }

    return { message: `Created ${requests.length} substitution request(s)`, requests };
  }

  // ─── Acting Teacher ───────────────────────────────────────────

  async getActingTeacher(organizationId: string, timetableEntryId: string, date: string) {
    const targetDate = new Date(date);
    const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);   end.setHours(23, 59, 59, 999);

    // Find a confirmed substitution assignment for this entry on this date
    const assignment = await this.prisma.substitutionAssignment.findFirst({
      where: {
        timetableEntryId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        substitutionRequest: {
          organizationId,
          date: { gte: start, lte: end },
        },
      },
      include: {
        substitutionRequest: true,
      },
    });

    if (!assignment) {
      // No substitution — return original teacher from timetable entry
      const entry = await this.prisma.timetableEntry.findUnique({
        where: { id: timetableEntryId },
        select: { teacherId: true },
      });
      return { actingTeacherId: entry?.teacherId ?? null, isSubstitute: false, assignmentId: null };
    }

    return {
      actingTeacherId: assignment.substituteTeacherId,
      isSubstitute: true,
      assignmentId: assignment.id,
      originalTeacherId: assignment.originalTeacherId,
    };
  }

  // ─── Queries ──────────────────────────────────────────────────

  async findRequests(
    organizationId: string,
    filters: {
      status?: string;
      date?: string;
      leaveRequestId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.date ? { date: new Date(filters.date) } : {}),
      ...(filters.leaveRequestId ? { leaveRequestId: filters.leaveRequestId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.substitutionRequest.findMany({
        where,
        include: {
          leaveRequest: { include: { employee: true, leaveType: true } },
          assignments: true,
        },
        orderBy: { date: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.substitutionRequest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findRequest(organizationId: string, id: string) {
    const request = await this.prisma.substitutionRequest.findFirst({
      where: { id, organizationId },
      include: {
        leaveRequest: { include: { employee: true, leaveType: true } },
        assignments: true,
        candidateScores: {
          orderBy: { totalScore: 'desc' },
        },
      },
    });
    if (!request) throw new NotFoundException('Substitution request not found');
    return request;
  }

  /** Return the ranked candidate list for a substitution request */
  async getRankedCandidates(organizationId: string, requestId: string) {
    const request = await this.prisma.substitutionRequest.findFirst({
      where: { id: requestId, organizationId },
      include: { leaveRequest: true },
    });
    if (!request) throw new NotFoundException('Substitution request not found');

    const scores = await this.prisma.substitutionCandidateScore.findMany({
      where: { substitutionRequestId: requestId },
      orderBy: { totalScore: 'desc' },
    });

    // Enrich with employee info (no Prisma relation on CandidateScore, query separately)
    const enriched = await Promise.all(
      scores.map(async (score) => {
        const employee = await this.prisma.employee.findUnique({
          where: { id: score.candidateEmployeeId },
          include: { person: true, department: true, designation: true },
        });
        return { ...score, employee };
      }),
    );

    return {
      requestId,
      date: request.date,
      qualified: enriched.filter((s) => !s.disqualifiedReason),
      disqualified: enriched.filter((s) => !!s.disqualifiedReason),
    };
  }

  // ─── Today's Coverage ─────────────────────────────────────────

  async getTodayCoverage(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const requests = await this.prisma.substitutionRequest.findMany({
      where: {
        organizationId,
        date: { gte: today, lt: tomorrow },
        status: { not: 'CANCELLED' },
      },
      include: {
        assignments: {
          where: { status: { not: 'CANCELLED' } },
        },
      },
    });

    // Collect all unique assignment data
    const allAssignments = requests.flatMap((r) =>
      r.assignments.map((a) => ({ ...a, requestId: r.id })),
    );

    // Enrich each assignment with timetableEntry, original teacher, and substitute
    const enrichedAssignments = await Promise.all(
      allAssignments.map(async (assignment) => {
        const [entry, originalTeacher, substituteEmployee] = await Promise.all([
          this.prisma.timetableEntry.findUnique({
            where: { id: assignment.timetableEntryId },
            include: { period: true, section: true, subject: true },
          }),
          this.prisma.employee.findUnique({
            where: { id: assignment.originalTeacherId },
            include: { person: true },
          }),
          assignment.substituteTeacherId
            ? this.prisma.employee.findUnique({
                where: { id: assignment.substituteTeacherId },
                include: { person: true },
              })
            : Promise.resolve(null),
        ]);

        return { assignment, entry, originalTeacher, substituteEmployee };
      }),
    );

    // Compute KPIs
    const uniqueAbsentTeacherIds = new Set(
      allAssignments.map((a) => a.originalTeacherId),
    );

    const covered = allAssignments.filter((a) =>
      ['CONFIRMED', 'COMPLETED'].includes(a.status),
    );
    const uncovered = allAssignments.filter((a) =>
      ['SUGGESTED', 'DECLINED'].includes(a.status),
    );
    const awaitingConfirmation = allAssignments.filter(
      (a) => a.status === 'SUGGESTED',
    );
    const manualAssigned = allAssignments.filter(
      (a) => a.status === 'CONFIRMED' && a.assignedBy !== null,
    );
    const autoAssigned = allAssignments.filter(
      (a) => a.status === 'CONFIRMED' && a.assignedBy === null,
    );

    const affectedPeriods = allAssignments.length;
    const coverageRate =
      affectedPeriods > 0
        ? Math.round((covered.length / affectedPeriods) * 100)
        : 0;

    // Build period board
    const periods = enrichedAssignments.map(
      ({ assignment, entry, originalTeacher, substituteEmployee }) => {
        let status: 'COVERED' | 'PENDING' | 'UNRESOLVED';
        if (['CONFIRMED', 'COMPLETED'].includes(assignment.status)) {
          status = 'COVERED';
        } else if (
          assignment.status === 'DECLINED' &&
          !assignment.substituteTeacherId
        ) {
          status = 'UNRESOLVED';
        } else {
          status = 'PENDING';
        }

        const personName = (
          emp: { person: { firstName: string; lastName: string } } | null,
        ) => (emp ? `${emp.person.firstName} ${emp.person.lastName}`.trim() : null);

        return {
          assignmentId: assignment.id,
          requestId: assignment.requestId,
          periodName: entry?.period?.name ?? 'Unknown',
          startTime: entry?.period?.startTime
            ? entry.period.startTime.toISOString()
            : null,
          className: entry?.section?.name ?? 'Unknown',
          subject: entry?.subject?.name ?? 'Unknown',
          absentTeacher: personName(originalTeacher) ?? 'Unknown',
          substitute: personName(substituteEmployee),
          score: assignment.algorithmScore
            ? Number(assignment.algorithmScore)
            : null,
          status,
        };
      },
    );

    return {
      date: today.toISOString().split('T')[0],
      kpis: {
        pendingCoverage: awaitingConfirmation.length,
        todayRequired: affectedPeriods,
        covered: covered.length,
        uncovered: uncovered.length,
        coverageRate,
        autoAssigned: autoAssigned.length,
        manualAssigned: manualAssigned.length,
        awaitingConfirmation: awaitingConfirmation.length,
        teachersAbsent: uniqueAbsentTeacherIds.size,
        affectedPeriods,
      },
      periods,
    };
  }

  // ─── Assignments List ─────────────────────────────────────────

  async findAssignments(
    organizationId: string,
    filters: {
      status?: string;
      date?: string;
      teacherId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    const where = {
      substitutionRequest: {
        organizationId,
        ...(filters.date ? { date: new Date(filters.date) } : {}),
      },
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.teacherId ? { substituteTeacherId: filters.teacherId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.substitutionAssignment.findMany({
        where,
        include: {
          substitutionRequest: {
            include: {
              leaveRequest: {
                include: { employee: { include: { person: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.substitutionAssignment.count({ where }),
    ]);

    // Enrich each assignment with timetable entry and substitute person
    const enriched = await Promise.all(
      data.map(async (assignment) => {
        const [entry, substituteEmployee] = await Promise.all([
          this.prisma.timetableEntry.findUnique({
            where: { id: assignment.timetableEntryId },
            include: { period: true, section: true, subject: true },
          }),
          assignment.substituteTeacherId
            ? this.prisma.employee.findUnique({
                where: { id: assignment.substituteTeacherId },
                include: { person: true },
              })
            : Promise.resolve(null),
        ]);
        return { ...assignment, timetableEntry: entry, substituteEmployee };
      }),
    );

    return { data: enriched, total, page, limit };
  }

  // ─── Manual Request ───────────────────────────────────────────

  async createManualRequest(
    organizationId: string,
    dto: CreateManualRequestDto,
    _userId: string,
  ) {
    // Verify the employee exists in this org
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    // Find active timetable for the employee's campus
    const activeTimetable = await this.prisma.timetable.findFirst({
      where: {
        campusId: employee.campusId ?? '',
        organizationId,
        status: 'ACTIVE',
      },
    });
    if (!activeTimetable) {
      throw new BadRequestException('No active timetable found for campus');
    }

    const date = new Date(dto.date);
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

    // Find timetable entries for this employee on the date's day of week
    let affectedEntries = await this.prisma.timetableEntry.findMany({
      where: {
        timetableId: activeTimetable.id,
        teacherId: dto.employeeId,
        dayOfWeek,
        ...(dto.periodIds && dto.periodIds.length > 0
          ? { periodId: { in: dto.periodIds } }
          : {}),
      },
      include: { period: true, section: true, subject: true },
    });

    if (affectedEntries.length === 0) {
      throw new BadRequestException(
        'No timetable entries found for this employee on the specified date',
      );
    }

    // Check if a substitution request already exists for this leave + date
    const existing = dto.leaveRequestId
      ? await this.prisma.substitutionRequest.findFirst({
          where: { leaveRequestId: dto.leaveRequestId, date },
        })
      : null;

    let subRequest = existing;

    if (!subRequest) {
      subRequest = await this.prisma.substitutionRequest.create({
        data: {
          organizationId,
          ...(dto.leaveRequestId ? { leaveRequestId: dto.leaveRequestId } : {}),
          academicYearId: activeTimetable.academicYearId,
          date,
          status: 'PENDING',
        },
      });
    }

    // Create assignments for each entry (skip if already exists)
    for (const entry of affectedEntries) {
      const existingAssignment = await this.prisma.substitutionAssignment.findFirst({
        where: { substitutionRequestId: subRequest.id, timetableEntryId: entry.id },
      });
      if (!existingAssignment) {
        await this.prisma.substitutionAssignment.create({
          data: {
            substitutionRequestId: subRequest.id,
            timetableEntryId: entry.id,
            originalTeacherId: dto.employeeId,
            status: 'SUGGESTED',
          },
        });
      }
    }

    // Run scoring algorithm
    await this.runScoringAlgorithm(
      organizationId,
      subRequest.id,
      dto.employeeId,
      affectedEntries,
      activeTimetable.academicYearId,
      activeTimetable.id,
      date,
    );
    // Auto-confirm if policy allows (HYBRID/AUTO_ASSIGN mode)
    await this.autoConfirmBestCandidate(organizationId, subRequest.id);

    return this.prisma.substitutionRequest.findUnique({
      where: { id: subRequest.id },
      include: { assignments: true, candidateScores: { orderBy: { totalScore: 'desc' } } },
    });
  }

  // ─── Retry Scoring ────────────────────────────────────────────

  async retryScoring(organizationId: string, requestId: string) {
    const request = await this.prisma.substitutionRequest.findFirst({
      where: { id: requestId, organizationId },
      include: {
        assignments: true,
      },
    });
    if (!request) throw new NotFoundException('Substitution request not found');
    if (request.status === 'CANCELLED') {
      throw new BadRequestException('Cannot re-score a cancelled request');
    }

    if (request.assignments.length === 0) {
      throw new BadRequestException('No assignments found for this request');
    }

    // Get the original teacher from the first assignment (length > 0 guaranteed above)
    const firstAssignment = request.assignments[0]!;
    const originalTeacherId = firstAssignment.originalTeacherId;

    // Fetch affected timetable entries for all assignments
    const affectedEntries = await Promise.all(
      request.assignments.map((a) =>
        this.prisma.timetableEntry.findUnique({
          where: { id: a.timetableEntryId },
          include: { period: true, section: true, subject: true },
        }),
      ),
    );

    const validEntries = affectedEntries.filter(
      (e): e is NonNullable<typeof e> => e !== null,
    );

    if (validEntries.length === 0) {
      throw new BadRequestException('Could not resolve timetable entries for this request');
    }

    // Derive the timetableId from the first valid entry (length > 0 guaranteed above)
    const firstEntry = validEntries[0]!;
    const timetableId = firstEntry.timetableId;

    await this.runScoringAlgorithm(
      organizationId,
      requestId,
      originalTeacherId,
      validEntries,
      request.academicYearId,
      timetableId,
      new Date(request.date),
    );

    // Auto-confirm if policy allows (HYBRID/AUTO_ASSIGN mode)
    await this.autoConfirmBestCandidate(organizationId, requestId);

    return { message: 'Scoring algorithm re-run successfully', requestId };
  }

  // ─── Assignments ──────────────────────────────────────────────

  async confirmAssignment(
    organizationId: string,
    assignmentId: string,
    dto: ConfirmAssignmentDto,
    confirmedBy: string,
  ) {
    const assignment = await this.getAssignmentOrFail(organizationId, assignmentId);

    if (!['SUGGESTED', 'DECLINED'].includes(assignment.status)) {
      throw new BadRequestException(`Assignment with status '${assignment.status}' cannot be confirmed`);
    }

    // Verify substitute teacher exists and is active
    const substitute = await this.prisma.employee.findFirst({
      where: { id: dto.substituteTeacherId, organizationId, employmentStatus: 'ACTIVE' },
    });
    if (!substitute) throw new NotFoundException('Substitute teacher not found or not active');

    const updated = await this.prisma.substitutionAssignment.update({
      where: { id: assignmentId },
      data: {
        substituteTeacherId: dto.substituteTeacherId,
        status: 'CONFIRMED',
        assignedBy: confirmedBy,
        confirmedAt: new Date(),
        notifiedAt: new Date(), // In a real system this triggers a notification job
      },
    });

    await this.writeAudit(organizationId, 'CONFIRMED', confirmedBy, assignment.substitutionRequestId, assignmentId, { substituteTeacherId: dto.substituteTeacherId });

    // Attendance overlay: upsert substitute's EmployeeAttendance for the date
    const subDate = new Date(assignment.substitutionRequest.date);
    subDate.setHours(0, 0, 0, 0);

    const substituteEmployee = await this.prisma.employee.findUnique({
      where: { id: dto.substituteTeacherId },
      select: { campusId: true },
    });

    if (substituteEmployee?.campusId) {
      await this.prisma.employeeAttendance.upsert({
        where: { employeeId_date: { employeeId: dto.substituteTeacherId, date: subDate } },
        create: {
          employeeId: dto.substituteTeacherId,
          campusId: substituteEmployee.campusId,
          date: subDate,
          status: 'PRESENT',
          remarks: `Substitute for assignment ${assignmentId}`,
          markedBy: confirmedBy,
        },
        update: {
          status: 'PRESENT',
          remarks: `Substitute for assignment ${assignmentId}`,
          markedBy: confirmedBy,
        },
      });
    }

    // Update request status
    await this.refreshRequestStatus(assignment.substitutionRequestId);

    // Fire notification event (fire-and-forget)
    this.eventEmitter.emit('notification.dispatch', {
      eventType: 'SUBSTITUTE_ASSIGNED',
      organizationId,
      subjectId: dto.substituteTeacherId,
      payload: {
        substituteTeacherId: dto.substituteTeacherId,
        assignmentId,
        date: assignment.substitutionRequest?.date?.toISOString().slice(0, 10) ?? '',
      },
    });

    return updated;
  }

  async declineAssignment(
    organizationId: string,
    assignmentId: string,
    reason?: string,
  ) {
    const assignment = await this.getAssignmentOrFail(organizationId, assignmentId);
    if (assignment.status !== 'CONFIRMED') {
      throw new BadRequestException('Only CONFIRMED assignments can be declined');
    }

    const updated = await this.prisma.substitutionAssignment.update({
      where: { id: assignmentId },
      data: {
        substituteTeacherId: null,
        status: 'DECLINED',
        confirmedAt: null,
        notifiedAt: null,
        assignedBy: null,
        ...(reason ? { declineReason: reason } : { declineReason: null }),
      },
    });

    await this.writeAudit(organizationId, 'DECLINED', null, assignment.substitutionRequestId, assignmentId, { reason: reason ?? null });

    await this.refreshRequestStatus(assignment.substitutionRequestId);

    // Fire notification event to the teacher who was previously assigned (fire-and-forget)
    if (assignment.substituteTeacherId) {
      this.eventEmitter.emit('notification.dispatch', {
        eventType: 'SUBSTITUTE_DECLINED',
        organizationId,
        subjectId: assignment.substituteTeacherId,
        payload: {
          substituteTeacherId: assignment.substituteTeacherId,
          assignmentId,
          reason: reason ?? 'No reason provided',
        },
      });
    }

    return updated;
  }

  async cancelRequest(organizationId: string, requestId: string) {
    const request = await this.prisma.substitutionRequest.findFirst({
      where: { id: requestId, organizationId },
    });
    if (!request) throw new NotFoundException('Substitution request not found');
    if (request.status === 'CANCELLED') {
      throw new BadRequestException('Request is already cancelled');
    }

    await this.prisma.substitutionAssignment.updateMany({
      where: { substitutionRequestId: requestId, status: { notIn: ['COMPLETED'] } },
      data: { status: 'CANCELLED' },
    });

    const cancelled = await this.prisma.substitutionRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    await this.writeAudit(organizationId, 'CANCELLED', null, requestId);

    return cancelled;
  }

  // ─── Reassign & Escalate ──────────────────────────────────────

  async reassignAfterDecline(organizationId: string, assignmentId: string) {
    const assignment = await this.getAssignmentOrFail(organizationId, assignmentId);

    if (!['DECLINED', 'SUGGESTED'].includes(assignment.status)) {
      throw new BadRequestException('Only DECLINED or SUGGESTED assignments can be reassigned');
    }

    const scores = await this.prisma.substitutionCandidateScore.findMany({
      where: {
        substitutionRequestId: assignment.substitutionRequestId,
        disqualifiedReason: null,
      },
      orderBy: { totalScore: 'desc' },
    });

    for (const score of scores) {
      const employee = await this.prisma.employee.findFirst({
        where: { id: score.candidateEmployeeId, organizationId, employmentStatus: 'ACTIVE' },
      });
      if (!employee) continue;

      const updated = await this.prisma.substitutionAssignment.update({
        where: { id: assignmentId },
        data: {
          substituteTeacherId: score.candidateEmployeeId,
          status: 'CONFIRMED',
          assignedBy: null,
          confirmedAt: new Date(),
          notifiedAt: new Date(),
          declineReason: null,
        },
      });

      await this.refreshRequestStatus(assignment.substitutionRequestId);
      await this.writeAudit(organizationId, 'REASSIGNED', null, assignment.substitutionRequestId, assignmentId, { newCandidateId: score.candidateEmployeeId });
      return { message: 'Reassigned to next best candidate', assignment: updated };
    }

    return { message: 'No qualified candidate available for reassignment', assignment: null };
  }

  async escalateRequest(organizationId: string, requestId: string) {
    const request = await this.prisma.substitutionRequest.findFirst({
      where: { id: requestId, organizationId },
    });
    if (!request) throw new NotFoundException('Substitution request not found');

    if (['CANCELLED', 'FULLY_ASSIGNED'].includes(request.status)) {
      throw new BadRequestException(`Cannot escalate a request with status '${request.status}'`);
    }

    const escalated = await this.prisma.substitutionRequest.update({
      where: { id: requestId },
      data: {
        status: 'ESCALATED',
        escalatedAt: new Date(),
      },
    });

    await this.writeAudit(organizationId, 'ESCALATED', null, requestId);

    return escalated;
  }

  // ─── Global Day Optimization ──────────────────────────────────

  /**
   * Greedy global optimization for all unresolved requests on a given date.
   * Strategy: sort requests by number of qualified candidates ascending (hardest first),
   * then assign the best available candidate — skipping candidates already picked
   * for an overlapping period in this optimization pass.
   */
  async optimizeDate(organizationId: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    // Fetch all unresolved requests for the date
    const requests = await this.prisma.substitutionRequest.findMany({
      where: {
        organizationId,
        date: { gte: targetDate, lt: nextDate },
        status: { in: ['PENDING', 'PARTIALLY_ASSIGNED', 'ESCALATED'] },
      },
      include: {
        assignments: {
          where: { status: 'SUGGESTED' },
        },
      },
    });

    if (requests.length === 0) {
      return { message: 'No unresolved requests for this date', assigned: 0, skipped: 0 };
    }

    // For each request, count qualified candidates
    const requestsWithCounts = await Promise.all(
      requests.map(async (req) => {
        const qualifiedCount = await this.prisma.substitutionCandidateScore.count({
          where: { substitutionRequestId: req.id, disqualifiedReason: null },
        });
        return { req, qualifiedCount };
      }),
    );

    // Sort: hardest to fill first (fewest qualified candidates)
    requestsWithCounts.sort((a, b) => a.qualifiedCount - b.qualifiedCount);

    // Track: candidateId → Set of periodIds already assigned in this pass
    const assignedCandidatePeriods = new Map<string, Set<string>>();

    let totalAssigned = 0;
    let totalSkipped = 0;

    for (const { req } of requestsWithCounts) {
      for (const assignment of req.assignments) {
        // Get period for this assignment's timetable entry
        const timetableEntry = await this.prisma.timetableEntry.findUnique({
          where: { id: assignment.timetableEntryId },
          select: { periodId: true },
        });
        const periodId = timetableEntry?.periodId;

        // Get ranked candidates for this request
        const rankedScores = await this.prisma.substitutionCandidateScore.findMany({
          where: { substitutionRequestId: req.id, disqualifiedReason: null },
          orderBy: { totalScore: 'desc' },
        });

        let picked = false;
        for (const score of rankedScores) {
          const candidateId = score.candidateEmployeeId;
          const existingPeriods = assignedCandidatePeriods.get(candidateId) ?? new Set<string>();

          // Skip if this candidate is already assigned to the same period in this pass
          if (periodId && existingPeriods.has(periodId)) continue;

          // Verify still active
          const employee = await this.prisma.employee.findFirst({
            where: { id: candidateId, organizationId, employmentStatus: 'ACTIVE' },
            select: { id: true, campusId: true },
          });
          if (!employee) continue;

          // Confirm the assignment
          await this.prisma.substitutionAssignment.update({
            where: { id: assignment.id },
            data: {
              substituteTeacherId: candidateId,
              status: 'CONFIRMED',
              assignedBy: null,
              confirmedAt: new Date(),
              notifiedAt: new Date(),
              algorithmScore: score.totalScore,
            },
          });

          await this.writeAudit(organizationId, 'OPTIMIZED', 'system', req.id, assignment.id, { candidateId, periodId });

          // Attendance overlay
          if (employee.campusId) {
            await this.prisma.employeeAttendance.upsert({
              where: { employeeId_date: { employeeId: candidateId, date: targetDate } },
              create: {
                employeeId: candidateId,
                campusId: employee.campusId,
                date: targetDate,
                status: 'PRESENT',
                remarks: `Optimized substitute (assignment ${assignment.id})`,
                markedBy: 'system',
              },
              update: {
                status: 'PRESENT',
                remarks: `Optimized substitute (assignment ${assignment.id})`,
              },
            });
          }

          // Record this assignment in the pass tracker
          if (periodId) {
            if (!assignedCandidatePeriods.has(candidateId)) {
              assignedCandidatePeriods.set(candidateId, new Set());
            }
            assignedCandidatePeriods.get(candidateId)!.add(periodId);
          }

          totalAssigned++;
          picked = true;
          break;
        }

        if (!picked) totalSkipped++;
      }

      await this.refreshRequestStatus(req.id);
    }

    return {
      message: `Optimized ${requests.length} request(s): ${totalAssigned} assigned, ${totalSkipped} could not be filled`,
      assigned: totalAssigned,
      skipped: totalSkipped,
    };
  }

  // ─── Scoring Algorithm ────────────────────────────────────────

  private async runScoringAlgorithm(
    organizationId: string,
    requestId: string,
    leavingTeacherId: string,
    affectedEntries: Array<{
      id: string;
      timetableId: string;
      periodId: string;
      subjectId: string | null;
      section: { campusId: string };
    }>,
    academicYearId: string,
    timetableId: string,
    date: Date,
  ) {
    // Delete previous scores for this request (re-run safe)
    await this.prisma.substitutionCandidateScore.deleteMany({ where: { substitutionRequestId: requestId } });

    const campusId = affectedEntries[0]?.section.campusId;
    if (!campusId) return;

    // Fetch policy (fall back to defaults if not configured)
    const policy = await this.prisma.substitutionPolicy.findUnique({ where: { organizationId } })
      ?? { maxSubsPerDay: 2, maxSubsPerWeek: 6, weightSubject: 40, weightWorkload: 30, weightFairness: 20, weightDept: 10, subjectMatchRequired: false };

    // Get the leaving teacher's department for affinity scoring
    const leavingTeacher = await this.prisma.employee.findUnique({
      where: { id: leavingTeacherId },
    });

    // Get all active employees at the same campus (excluding the leaving teacher)
    const candidates = await this.prisma.employee.findMany({
      where: {
        organizationId,
        campusId,
        employmentStatus: 'ACTIVE',
        NOT: { id: leavingTeacherId },
      },
    });

    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
    const affectedPeriodIds = affectedEntries.map((e) => e.periodId);
    const subjectIds = affectedEntries.map((e) => e.subjectId).filter(Boolean) as string[];

    // Count how many substitutions have been done this academic year per candidate
    const subCountRows = await this.prisma.substitutionAssignment.groupBy({
      by: ['substituteTeacherId'],
      where: {
        substituteTeacherId: { not: null },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        substitutionRequest: { academicYearId },
      },
      _count: { id: true },
    });
    const subCountMap: Record<string, number> = {};
    for (const row of subCountRows) {
      if (row.substituteTeacherId) {
        subCountMap[row.substituteTeacherId] = row._count.id;
      }
    }
    const maxSubCount = Math.max(0, ...Object.values(subCountMap));

    // Count existing periods this week for each candidate (workload)
    const workloadRows = await this.prisma.timetableEntry.groupBy({
      by: ['teacherId'],
      where: {
        timetableId,
        dayOfWeek,
        teacherId: { in: candidates.map((c) => c.id) },
      },
      _count: { id: true },
    });
    const workloadMap: Record<string, number> = {};
    for (const row of workloadRows) {
      if (row.teacherId) workloadMap[row.teacherId] = row._count.id;
    }
    const maxWorkload = Math.max(0, ...Object.values(workloadMap));

    // Count today's confirmed substitutions for workload cap check
    const todayStart = new Date(date.toDateString());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const todaySubRows = await this.prisma.substitutionAssignment.groupBy({
      by: ['substituteTeacherId'],
      where: {
        substituteTeacherId: { in: candidates.map((c) => c.id), not: null },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        substitutionRequest: { date: { gte: todayStart, lt: todayEnd } },
      },
      _count: { id: true },
    });
    const todaySubMap: Record<string, number> = {};
    for (const row of todaySubRows) {
      if (row.substituteTeacherId) todaySubMap[row.substituteTeacherId] = row._count.id;
    }

    for (const candidate of candidates) {
      let disqualifiedReason: string | null = null;

      // Disqualify: already on approved leave that day
      const onLeave = await this.prisma.leaveRequest.findFirst({
        where: {
          employeeId: candidate.id,
          status: 'APPROVED',
          startDate: { lte: date },
          endDate: { gte: date },
        },
      });
      if (onLeave) {
        disqualifiedReason = 'On approved leave';
      }

      // Disqualify: already teaching in one of the affected periods
      if (!disqualifiedReason) {
        const clash = await this.prisma.timetableEntry.findFirst({
          where: {
            timetableId,
            dayOfWeek,
            periodId: { in: affectedPeriodIds },
            teacherId: candidate.id,
          },
        });
        if (clash) {
          disqualifiedReason = 'Already assigned to another class during this period';
        }
      }

      // Disqualify: daily substitution cap reached
      if (!disqualifiedReason) {
        const todayCount = todaySubMap[candidate.id] ?? 0;
        if (todayCount >= policy.maxSubsPerDay) {
          disqualifiedReason = `Daily substitution limit reached (${policy.maxSubsPerDay}/day)`;
        }
      }

      // Disqualify: marked unavailable on this day of week
      if (!disqualifiedReason) {
        const availability = await this.prisma.teacherAvailability.findUnique({
          where: { employeeId_dayOfWeek: { employeeId: candidate.id, dayOfWeek } },
        });
        if (availability && !availability.isAvailable) {
          disqualifiedReason = availability.note
            ? `Unavailable: ${availability.note}`
            : 'Marked unavailable on this day';
        }
      }

      // Disqualify: already CONFIRMED as substitute for one of these periods today
      if (!disqualifiedReason) {
        const confirmedSubsToday = await this.prisma.substitutionAssignment.findMany({
          where: {
            substituteTeacherId: candidate.id,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            NOT: { substitutionRequestId: requestId },
            substitutionRequest: { date: { gte: todayStart, lt: todayEnd }, organizationId },
          },
          select: { timetableEntryId: true },
        });
        if (confirmedSubsToday.length > 0) {
          const confirmedEntryIds = confirmedSubsToday.map((a) => a.timetableEntryId);
          const conflict = await this.prisma.timetableEntry.findFirst({
            where: { id: { in: confirmedEntryIds }, periodId: { in: affectedPeriodIds } },
          });
          if (conflict) {
            disqualifiedReason = 'Already confirmed as substitute for this period today';
          }
        }
      }

      // Disqualify: weekly substitution cap exceeded
      if (!disqualifiedReason) {
        const weekStart = new Date(date);
        const dow = weekStart.getDay();
        weekStart.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekSubCount = await this.prisma.substitutionAssignment.count({
          where: {
            substituteTeacherId: candidate.id,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            substitutionRequest: { date: { gte: weekStart, lt: weekEnd } },
          },
        });
        if (weekSubCount >= policy.maxSubsPerWeek) {
          disqualifiedReason = `Weekly substitution limit reached (${policy.maxSubsPerWeek}/week)`;
        }
      }

      // Disqualify: date falls in a teacher unavailability override range
      if (!disqualifiedReason) {
        const override = await this.prisma.teacherUnavailabilityOverride.findFirst({
          where: {
            employeeId: candidate.id,
            startDate: { lte: date },
            endDate:   { gte: date },
          },
        });
        if (override) {
          disqualifiedReason = override.reason
            ? `On planned leave: ${override.reason}`
            : 'Date-range unavailability set';
        }
      }

      // Disqualify: subject match strictly required but teacher has never taught it
      if (!disqualifiedReason && policy.subjectMatchRequired && subjectIds.length > 0) {
        const taughtCount = await this.prisma.teacherAssignment.count({
          where: { teacherId: candidate.id, subjectId: { in: subjectIds } },
        });
        if (taughtCount === 0) {
          disqualifiedReason = 'No qualifying subject record found';
        }
      }

      // ── Compute scores ────────────────────────────────────────

      // Subject Proficiency: has this teacher taught these subjects before?
      let subjectProficiencyScore = new Decimal(0);
      if (subjectIds.length > 0) {
        const taughtCount = await this.prisma.teacherAssignment.count({
          where: {
            teacherId: candidate.id,
            subjectId: { in: subjectIds },
          },
        });
        const proficiencyRatio = Math.min(taughtCount / subjectIds.length, 1);
        subjectProficiencyScore = new Decimal(policy.weightSubject * proficiencyRatio);
      } else {
        // No subject info — give partial credit
        subjectProficiencyScore = new Decimal(policy.weightSubject / 2);
      }

      // Workload: fewer periods this day = more available = higher score
      const candidateLoad = workloadMap[candidate.id] ?? 0;
      const workloadScore =
        maxWorkload > 0
          ? new Decimal(policy.weightWorkload * (1 - candidateLoad / (maxWorkload + 1)))
          : new Decimal(policy.weightWorkload);

      // Fairness: fewer past substitutions = higher score
      const subCount = subCountMap[candidate.id] ?? 0;
      const fairnessScore =
        maxSubCount > 0
          ? new Decimal(policy.weightFairness * (1 - subCount / (maxSubCount + 1)))
          : new Decimal(policy.weightFairness);

      // Department Affinity: same department as leaving teacher
      const deptAffinityScore =
        leavingTeacher?.departmentId &&
        candidate.departmentId === leavingTeacher.departmentId
          ? new Decimal(policy.weightDept)
          : new Decimal(0);

      // Pool bonus: member of at least one active pool for this org
      const poolMembership = await this.prisma.substitutePoolMember.findFirst({
        where: {
          employeeId: candidate.id,
          pool: { organizationId, isActive: true },
        },
      });
      const poolBonusScore = poolMembership
        ? new Decimal(
            await this.prisma.substitutePool
              .findFirst({ where: { organizationId, isActive: true, members: { some: { employeeId: candidate.id } } }, select: { poolBonusPts: true } })
              .then((p) => p?.poolBonusPts ?? 5),
          )
        : new Decimal(0);

      const totalScore = subjectProficiencyScore
        .plus(workloadScore)
        .plus(fairnessScore)
        .plus(deptAffinityScore)
        .plus(poolBonusScore);

      await this.prisma.substitutionCandidateScore.create({
        data: {
          substitutionRequestId: requestId,
          candidateEmployeeId: candidate.id,
          subjectProficiencyScore,
          workloadScore,
          fairnessScore,
          departmentAffinityScore: deptAffinityScore,
          totalScore,
          ...(disqualifiedReason ? { disqualifiedReason } : {}),
        },
      });
    }
  }

  /**
   * After scoring, auto-confirm the best qualified candidate if policy allows it.
   * AUTO_ASSIGN: always auto-assign top candidate.
   * HYBRID: auto-assign only if top candidate score >= autoAssignThreshold.
   * MANUAL / AUTO_SUGGEST: do nothing — require human action.
   */
  private async autoConfirmBestCandidate(organizationId: string, requestId: string) {
    const policy = await this.prisma.substitutionPolicy.findUnique({ where: { organizationId } })
      ?? { mode: 'HYBRID' as const, autoAssignThreshold: 85 };

    if (policy.mode === 'MANUAL' || policy.mode === 'AUTO_SUGGEST') return;

    // Only act on SUGGESTED (unconfirmed) assignments
    const pendingAssignments = await this.prisma.substitutionAssignment.findMany({
      where: { substitutionRequestId: requestId, status: 'SUGGESTED' },
    });
    if (pendingAssignments.length === 0) return;

    // Track which candidates have been auto-assigned in this call to prevent double-booking
    const alreadyPickedInThisCall = new Set<string>();

    for (const assignment of pendingAssignments) {
      // Best qualified candidate not already picked in this call
      const topScore = await this.prisma.substitutionCandidateScore.findFirst({
        where: {
          substitutionRequestId: requestId,
          disqualifiedReason: null,
          candidateEmployeeId: { notIn: [...alreadyPickedInThisCall] },
        },
        orderBy: { totalScore: 'desc' },
      });

      if (!topScore) continue;

      const score = Number(topScore.totalScore);
      const shouldAutoAssign =
        policy.mode === 'AUTO_ASSIGN' || score >= policy.autoAssignThreshold;

      if (!shouldAutoAssign) continue;

      // Verify candidate is still active
      const candidate = await this.prisma.employee.findFirst({
        where: { id: topScore.candidateEmployeeId, organizationId, employmentStatus: 'ACTIVE' },
        select: { id: true, campusId: true },
      });
      if (!candidate) continue;

      await this.prisma.substitutionAssignment.update({
        where: { id: assignment.id },
        data: {
          substituteTeacherId: topScore.candidateEmployeeId,
          status: 'CONFIRMED',
          assignedBy: null, // null = system auto-assigned
          confirmedAt: new Date(),
          notifiedAt: new Date(),
          algorithmScore: topScore.totalScore,
        },
      });

      // Attendance overlay
      const req = await this.prisma.substitutionRequest.findUnique({ where: { id: requestId } });
      if (req && candidate.campusId) {
        const subDate = new Date(req.date);
        subDate.setHours(0, 0, 0, 0);
        await this.prisma.employeeAttendance.upsert({
          where: { employeeId_date: { employeeId: topScore.candidateEmployeeId, date: subDate } },
          create: {
            employeeId: topScore.candidateEmployeeId,
            campusId: candidate.campusId,
            date: subDate,
            status: 'PRESENT',
            remarks: `Auto-assigned substitute (assignment ${assignment.id})`,
            markedBy: 'system',
          },
          update: {
            status: 'PRESENT',
            remarks: `Auto-assigned substitute (assignment ${assignment.id})`,
          },
        });
      }

      await this.writeAudit(organizationId, 'AUTO_CONFIRMED', 'system', requestId, assignment.id, { candidateId: topScore.candidateEmployeeId, score: Number(topScore.totalScore) });

      alreadyPickedInThisCall.add(topScore.candidateEmployeeId);
    }

    await this.refreshRequestStatus(requestId);
  }

  // ─── Teacher Availability ─────────────────────────────────────

  async getTeacherAvailability(organizationId: string, employeeId: string) {
    // Verify employee belongs to org
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const availability = await this.prisma.teacherAvailability.findMany({
      where: { employeeId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Return all 7 days (fill defaults for missing days)
    const days = [1, 2, 3, 4, 5, 6, 7];
    const slots = days.map((d) => {
      const found = availability.find((a) => a.dayOfWeek === d);
      return found
        ? { dayOfWeek: found.dayOfWeek, isAvailable: found.isAvailable, note: found.note }
        : { dayOfWeek: d, isAvailable: true, note: null };
    });
    return { employeeId, slots };
  }

  async setTeacherAvailability(
    organizationId: string,
    employeeId: string,
    availability: Array<{ dayOfWeek: number; isAvailable: boolean; note?: string }>,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const results = await Promise.all(
      availability.map((a) =>
        this.prisma.teacherAvailability.upsert({
          where: { employeeId_dayOfWeek: { employeeId, dayOfWeek: a.dayOfWeek } },
          create: { employeeId, dayOfWeek: a.dayOfWeek, isAvailable: a.isAvailable, note: a.note ?? null },
          update: { isAvailable: a.isAvailable, note: a.note ?? null },
        }),
      ),
    );
    return {
      employeeId,
      slots: results.map((r) => ({ dayOfWeek: r.dayOfWeek, isAvailable: r.isAvailable, note: r.note })),
    };
  }

  // ─── Substitute Pools ─────────────────────────────────────────

  async createPool(organizationId: string, dto: { name: string; description?: string; isActive?: boolean; poolBonusPts?: number }) {
    return this.prisma.substitutePool.create({
      data: { organizationId, name: dto.name, description: dto.description ?? null, isActive: dto.isActive ?? true, poolBonusPts: dto.poolBonusPts ?? 5 },
      include: { members: true },
    });
  }

  async listPools(organizationId: string) {
    const pools = await this.prisma.substitutePool.findMany({
      where: { organizationId },
      include: { members: true },
      orderBy: { createdAt: 'asc' },
    });
    return pools.map((p) => ({ ...p, memberCount: p.members.length }));
  }

  async updatePool(organizationId: string, poolId: string, dto: { name?: string; description?: string; isActive?: boolean; poolBonusPts?: number }) {
    const pool = await this.prisma.substitutePool.findFirst({ where: { id: poolId, organizationId } });
    if (!pool) throw new NotFoundException('Pool not found');
    return this.prisma.substitutePool.update({ where: { id: poolId }, data: dto, include: { members: true } });
  }

  async deletePool(organizationId: string, poolId: string) {
    const pool = await this.prisma.substitutePool.findFirst({ where: { id: poolId, organizationId } });
    if (!pool) throw new NotFoundException('Pool not found');
    await this.prisma.substitutePool.delete({ where: { id: poolId } });
    return { message: 'Pool deleted' };
  }

  async getPoolMembers(organizationId: string, poolId: string) {
    const pool = await this.prisma.substitutePool.findFirst({ where: { id: poolId, organizationId } });
    if (!pool) throw new NotFoundException('Pool not found');
    const members = await this.prisma.substitutePoolMember.findMany({
      where: { poolId },
      orderBy: { addedAt: 'desc' },
    });
    const enriched = await Promise.all(
      members.map(async (m) => {
        const employee = await this.prisma.employee.findUnique({
          where: { id: m.employeeId },
          include: { person: true, department: true, designation: true },
        });
        return { ...m, employee };
      }),
    );
    return enriched;
  }

  async addPoolMember(organizationId: string, poolId: string, employeeId: string) {
    const pool = await this.prisma.substitutePool.findFirst({ where: { id: poolId, organizationId } });
    if (!pool) throw new NotFoundException('Pool not found');
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.prisma.substitutePoolMember.upsert({
      where: { poolId_employeeId: { poolId, employeeId } },
      create: { poolId, employeeId },
      update: {},
    });
  }

  async removePoolMember(organizationId: string, poolId: string, employeeId: string) {
    const pool = await this.prisma.substitutePool.findFirst({ where: { id: poolId, organizationId } });
    if (!pool) throw new NotFoundException('Pool not found');
    await this.prisma.substitutePoolMember.deleteMany({ where: { poolId, employeeId } });
    return { message: 'Member removed' };
  }

  // ─── Unavailability Overrides ─────────────────────────────────

  async createUnavailabilityOverride(
    organizationId: string,
    dto: { employeeId: string; startDate: string; endDate: string; reason?: string },
  ) {
    const employee = await this.prisma.employee.findFirst({ where: { id: dto.employeeId, organizationId } });
    if (!employee) throw new NotFoundException('Employee not found');
    if (new Date(dto.startDate) > new Date(dto.endDate)) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }
    return this.prisma.teacherUnavailabilityOverride.create({
      data: {
        employeeId: dto.employeeId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason ?? null,
      },
    });
  }

  async listUnavailabilityOverrides(organizationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.prisma.teacherUnavailabilityOverride.findMany({
      where: { employeeId },
      orderBy: { startDate: 'asc' },
    });
  }

  async deleteUnavailabilityOverride(organizationId: string, id: string) {
    const override = await this.prisma.teacherUnavailabilityOverride.findUnique({ where: { id } });
    if (!override) throw new NotFoundException('Override not found');
    // Verify the employee belongs to this org
    const employee = await this.prisma.employee.findFirst({ where: { id: override.employeeId, organizationId } });
    if (!employee) throw new NotFoundException('Override not found');
    await this.prisma.teacherUnavailabilityOverride.delete({ where: { id } });
    return { message: 'Override deleted' };
  }

  // ─── Audit Log ────────────────────────────────────────────────

  async getAuditLog(organizationId: string, requestId: string) {
    const request = await this.prisma.substitutionRequest.findFirst({ where: { id: requestId, organizationId } });
    if (!request) throw new NotFoundException('Substitution request not found');
    return this.prisma.substitutionAuditLog.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private async getAssignmentOrFail(organizationId: string, assignmentId: string) {
    const assignment = await this.prisma.substitutionAssignment.findFirst({
      where: { id: assignmentId },
      include: { substitutionRequest: true },
    });
    if (!assignment || assignment.substitutionRequest.organizationId !== organizationId) {
      throw new NotFoundException('Assignment not found');
    }
    return assignment;
  }

  private async writeAudit(
    organizationId: string,
    action: string,
    actor: string | null,
    requestId?: string,
    assignmentId?: string,
    details?: object,
  ) {
    try {
      await this.prisma.substitutionAuditLog.create({
        data: {
          organizationId,
          action,
          actor: actor ?? 'system',
          requestId: requestId ?? null,
          assignmentId: assignmentId ?? null,
          details: details as any ?? null,
        },
      });
    } catch {
      // Audit failures must never break the main flow
    }
  }

  private async refreshRequestStatus(requestId: string) {
    // Don't overwrite ESCALATED status — let it stay until manually resolved
    const currentRequest = await this.prisma.substitutionRequest.findUnique({ where: { id: requestId } });
    if (currentRequest?.status === 'ESCALATED') return;

    const assignments = await this.prisma.substitutionAssignment.findMany({
      where: { substitutionRequestId: requestId },
    });

    const total = assignments.length;
    const confirmed = assignments.filter((a) => a.status === 'CONFIRMED').length;
    const cancelled = assignments.filter((a) => a.status === 'CANCELLED').length;

    let status = 'PENDING';
    if (cancelled === total) {
      status = 'CANCELLED';
    } else if (confirmed === total - cancelled) {
      status = 'FULLY_ASSIGNED';
    } else if (confirmed > 0) {
      status = 'PARTIALLY_ASSIGNED';
    }

    await this.prisma.substitutionRequest.update({
      where: { id: requestId },
      data: { status },
    });
  }
}
