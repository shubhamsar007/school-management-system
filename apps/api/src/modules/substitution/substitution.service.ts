import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfirmAssignmentDto } from './dto/confirm-assignment.dto';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Algorithm constants ──────────────────────────────────────
const MAX_SUBJECT_PROFICIENCY = 40;
const MAX_WORKLOAD = 30;
const MAX_FAIRNESS = 20;
const MAX_DEPT_AFFINITY = 10;

@Injectable()
export class SubstitutionService {
  constructor(private readonly prisma: PrismaService) {}

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

        requests.push(subRequest);
      }

      current.setDate(current.getDate() + 1);
    }

    return { message: `Created ${requests.length} substitution request(s)`, requests };
  }

  // ─── Queries ──────────────────────────────────────────────────

  async findRequests(
    organizationId: string,
    filters: { status?: string; date?: string; leaveRequestId?: string },
  ) {
    return this.prisma.substitutionRequest.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.date ? { date: new Date(filters.date) } : {}),
        ...(filters.leaveRequestId ? { leaveRequestId: filters.leaveRequestId } : {}),
      },
      include: {
        leaveRequest: { include: { employee: true, leaveType: true } },
        assignments: true,
      },
      orderBy: { date: 'asc' },
    });
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

    // Update request status
    await this.refreshRequestStatus(assignment.substitutionRequestId);

    return updated;
  }

  async declineAssignment(organizationId: string, assignmentId: string) {
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
      },
    });

    await this.refreshRequestStatus(assignment.substitutionRequestId);
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

    return this.prisma.substitutionRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });
  }

  // ─── Scoring Algorithm ────────────────────────────────────────

  private async runScoringAlgorithm(
    organizationId: string,
    requestId: string,
    leavingTeacherId: string,
    affectedEntries: Array<{
      id: string;
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

      // ── Compute scores ────────────────────────────────────────

      // Subject Proficiency (max 40): has this teacher taught these subjects before?
      let subjectProficiencyScore = new Decimal(0);
      if (subjectIds.length > 0) {
        const taughtCount = await this.prisma.teacherAssignment.count({
          where: {
            teacherId: candidate.id,
            subjectId: { in: subjectIds },
          },
        });
        const proficiencyRatio = Math.min(taughtCount / subjectIds.length, 1);
        subjectProficiencyScore = new Decimal(MAX_SUBJECT_PROFICIENCY * proficiencyRatio);
      } else {
        // No subject info — give partial credit
        subjectProficiencyScore = new Decimal(MAX_SUBJECT_PROFICIENCY / 2);
      }

      // Workload (max 30): fewer periods this day = more available = higher score
      const candidateLoad = workloadMap[candidate.id] ?? 0;
      const workloadScore =
        maxWorkload > 0
          ? new Decimal(MAX_WORKLOAD * (1 - candidateLoad / (maxWorkload + 1)))
          : new Decimal(MAX_WORKLOAD);

      // Fairness (max 20): fewer past substitutions = higher score
      const subCount = subCountMap[candidate.id] ?? 0;
      const fairnessScore =
        maxSubCount > 0
          ? new Decimal(MAX_FAIRNESS * (1 - subCount / (maxSubCount + 1)))
          : new Decimal(MAX_FAIRNESS);

      // Department Affinity (max 10): same department as leaving teacher
      const deptAffinityScore =
        leavingTeacher?.departmentId &&
        candidate.departmentId === leavingTeacher.departmentId
          ? new Decimal(MAX_DEPT_AFFINITY)
          : new Decimal(0);

      const totalScore = subjectProficiencyScore
        .plus(workloadScore)
        .plus(fairnessScore)
        .plus(deptAffinityScore);

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

  private async refreshRequestStatus(requestId: string) {
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
