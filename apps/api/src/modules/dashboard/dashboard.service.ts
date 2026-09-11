import { Injectable } from '@nestjs/common';
import { StudentService } from '../student/student.service';
import { TeacherService } from '../teacher/teacher.service';
import { AttendanceService } from '../attendance/attendance.service';
import { AdmissionsService } from '../admissions/admissions.service';
import { ExaminationsService } from '../examinations/examinations.service';
import { SubstitutionService } from '../substitution/substitution.service';
import { PayrollService } from '../payroll/payroll.service';
import { PrismaService } from '../database/prisma.service';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

@Injectable()
export class DashboardService {
  constructor(
    private readonly studentService: StudentService,
    private readonly teacherService: TeacherService,
    private readonly attendanceService: AttendanceService,
    private readonly admissionsService: AdmissionsService,
    private readonly examinationsService: ExaminationsService,
    private readonly substitutionService: SubstitutionService,
    private readonly payrollService: PayrollService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Overview (Phase 1) ───────────────────────────────────────────────────

  async getOverview(organizationId: string) {
    const [students, staff, attendance, admissions] = await Promise.all([
      this.studentService.getStudentStats(organizationId),
      this.teacherService.getStats(organizationId),
      this.attendanceService.getOverview(organizationId),
      this.admissionsService.getStats(organizationId),
    ]);

    const actions = {
      admissionsPending: admissions.applications.pendingReview,
      leaveRequestsPending: (attendance as any).alerts?.pendingLeaveRequests ?? 0,
    };

    return { students, staff, attendance, admissions, actions };
  }

  // ─── Attendance Trend (Phase 2) ───────────────────────────────────────────

  async getAttendanceTrend(organizationId: string, months = 6) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    // Student trends — reuse existing service method (already optimised)
    const studentTrends = await this.attendanceService.getAttendanceTrends(
      organizationId,
      undefined,
      months,
    );

    // Staff trends — batch query then group in-memory
    const staffRecords = await this.prisma.employeeAttendance.findMany({
      where: {
        employee: { organizationId },
        date: { gte: startDate },
      },
      select: { date: true, status: true },
    });

    // Bucket staff records by "YYYY-M" key
    const staffByMonth = new Map<string, { present: number; total: number }>();
    for (const rec of staffRecords) {
      const key = `${rec.date.getFullYear()}-${rec.date.getMonth()}`;
      const bucket = staffByMonth.get(key) ?? { present: 0, total: 0 };
      bucket.total++;
      if (rec.status === 'PRESENT' || rec.status === 'LATE' || rec.status === 'HALF_DAY') {
        bucket.present++;
      }
      staffByMonth.set(key, bucket);
    }

    // Merge into a single monthly array aligned to studentTrends
    const months_data = studentTrends.map((st) => {
      const key = `${st.year}-${st.month - 1}`;
      const staffBucket = staffByMonth.get(key);
      const staffRate =
        staffBucket && staffBucket.total > 0
          ? Math.round((staffBucket.present / staffBucket.total) * 1000) / 10
          : 0;

      return {
        month: MONTH_LABELS[st.month - 1] as string,
        year: st.year,
        label: st.label,
        students: st.rate,
        staff: staffRate,
      };
    });

    return { months: months_data };
  }

  // ─── Finance Summary (Phase 2) ────────────────────────────────────────────

  async getFinanceSummary(organizationId: string, months = 6) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    // Confirmed payments in the window — batch query
    const payments = await this.prisma.feePayment.findMany({
      where: {
        organizationId,
        status: 'CONFIRMED',
        paymentDate: { gte: startDate },
      },
      select: { paymentDate: true, amount: true },
    });

    // Invoice aggregates (totals not filtered by date — school-wide)
    const [allInvoices, paidInvoices, overdueInvoices, partialInvoices] = await Promise.all([
      this.prisma.feeInvoice.aggregate({
        where: { organizationId, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      this.prisma.feeInvoice.aggregate({
        where: { organizationId, status: 'PAID' },
        _sum: { total: true },
      }),
      this.prisma.feeInvoice.aggregate({
        where: { organizationId, status: 'OVERDUE' },
        _sum: { total: true },
      }),
      this.prisma.feeInvoice.aggregate({
        where: { organizationId, status: 'PARTIALLY_PAID' },
        _sum: { total: true },
      }),
    ]);

    // Group payments by "YYYY-M" key in-memory
    const collectedByMonth = new Map<string, number>();
    for (const p of payments) {
      const key = `${p.paymentDate.getFullYear()}-${p.paymentDate.getMonth()}`;
      collectedByMonth.set(key, (collectedByMonth.get(key) ?? 0) + Number(p.amount));
    }

    // Build monthly array
    const monthly = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return {
        label: MONTH_LABELS[d.getMonth()] as string,
        year: d.getFullYear(),
        collected: Math.round(collectedByMonth.get(key) ?? 0),
      };
    });

    const totalBilled      = Number(allInvoices._sum.total      ?? 0);
    const totalPaid        = Number(paidInvoices._sum.total      ?? 0);
    const totalOverdue     = Number(overdueInvoices._sum.total   ?? 0);
    const totalPartial     = Number(partialInvoices._sum.total   ?? 0);
    const totalOutstanding = Math.max(0, totalBilled - totalPaid - totalPartial);
    const collectionRate   = totalBilled > 0
      ? Math.round((totalPaid / totalBilled) * 1000) / 10
      : 0;

    return {
      monthly,
      totals: {
        billed:        Math.round(totalBilled),
        collected:     Math.round(totalPaid),
        outstanding:   Math.round(totalOutstanding),
        overdue:       Math.round(totalOverdue),
        collectionRate,
      },
    };
  }

  // ─── Enrollment by Class (Phase 2) ────────────────────────────────────────

  async getEnrollment(organizationId: string) {
    // Batch: class metadata + enrollment counts in 2 queries
    const [classes, enrollmentGroups] = await Promise.all([
      this.prisma.academicClass.findMany({
        where: { organizationId, status: 'ACTIVE' },
        include: {
          sections: {
            where: { status: 'ACTIVE' },
            select: { id: true, capacity: true, name: true },
          },
        },
        orderBy: [{ level: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.studentEnrollment.groupBy({
        by: ['classId'],
        _count: { id: true },
        where: {
          status: 'ACTIVE',
          student: { organizationId },
        },
      }),
    ]);

    // Build lookup map: classId → enrolled count
    const enrolledByClass = new Map<string, number>(
      enrollmentGroups.map((g) => [g.classId, g._count.id]),
    );

    const classData = classes.map((cls) => {
      const enrolled = enrolledByClass.get(cls.id) ?? 0;
      const capacity = cls.sections.reduce((sum, s) => sum + (s.capacity ?? 0), 0) || null;
      const occupancy =
        capacity && capacity > 0
          ? Math.round((enrolled / capacity) * 1000) / 10
          : null;

      return {
        id: cls.id,
        name: cls.name,
        level: cls.level ?? 0,
        enrolled,
        capacity,
        occupancy,
        sections: cls.sections.length,
      };
    });

    const totalEnrolled  = classData.reduce((s, c) => s + c.enrolled, 0);
    const totalCapacity  = classData.reduce((s, c) => s + (c.capacity ?? 0), 0) || null;

    return { classes: classData, total: { enrolled: totalEnrolled, capacity: totalCapacity } };
  }

  // ─── Exam Progress (Phase 3) ──────────────────────────────────────────────

  async getExamProgress(organizationId: string) {
    // Fetch active (SCHEDULED + ONGOING) exams with their subjects
    const activeExams = await this.prisma.exam.findMany({
      where: { organizationId, status: { in: ['SCHEDULED', 'ONGOING'] } },
      include: {
        examType: { select: { name: true } },
        examSubjects: {
          select: {
            id: true,
            subjectId: true,
            classId: true,
            maxMarks: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    // For each active exam, compute marks-entry completion
    const examProgress = await Promise.all(
      activeExams.map(async (exam) => {
        const examSubjectIds = exam.examSubjects.map((s) => s.id);

        if (examSubjectIds.length === 0) {
          return {
            id: exam.id,
            name: exam.name,
            type: exam.examType?.name ?? null,
            status: exam.status,
            startDate: exam.startDate,
            endDate: exam.endDate,
            totalSubjects: 0,
            marksEntered: 0,
            pendingVerifications: 0,
            completionPct: 0,
          };
        }

        // Count marks entered and pending verifications in two parallel queries
        const [marksEntered, pendingVerifications] = await Promise.all([
          this.prisma.examMark.count({
            where: {
              examSubjectId: { in: examSubjectIds },
              isAbsent: false,
              marks: { not: null },
            },
          }),
          this.prisma.examMark.count({
            where: {
              examSubjectId: { in: examSubjectIds },
              verifiedBy: null,
              isAbsent: false,
              marks: { not: null },
            },
          }),
        ]);

        // Estimate expected marks = unique students enrolled × subjects
        const enrolledStudents = await this.prisma.studentEnrollment.count({
          where: {
            classId: { in: exam.examSubjects.map((s) => s.classId) },
            status: 'ACTIVE',
            student: { organizationId },
          },
        });

        const expected = enrolledStudents * exam.examSubjects.length;
        const completionPct =
          expected > 0 ? Math.round((marksEntered / expected) * 100) : 0;

        return {
          id: exam.id,
          name: exam.name,
          type: exam.examType?.name ?? null,
          status: exam.status,
          startDate: exam.startDate,
          endDate: exam.endDate,
          totalSubjects: exam.examSubjects.length,
          marksEntered,
          pendingVerifications,
          completionPct,
        };
      }),
    );

    // Completed exams in current academic year (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCompleted = await this.prisma.exam.count({
      where: {
        organizationId,
        status: 'COMPLETED',
        endDate: { gte: thirtyDaysAgo },
      },
    });

    return { exams: examProgress, recentCompleted };
  }

  // ─── Academic Performance (Phase 3) ──────────────────────────────────────

  async getAcademicPerformance(organizationId: string) {
    // Pull results from last 2 completed exams for trend comparison
    const completedExams = await this.prisma.exam.findMany({
      where: { organizationId, status: 'COMPLETED' },
      orderBy: { endDate: 'desc' },
      take: 2,
      select: { id: true, name: true, endDate: true },
    });

    if (completedExams.length === 0) {
      return { bySubject: [], byClass: [], latestExam: null, previousExam: null };
    }

    const latestExam = completedExams[0]!;
    const previousExam = completedExams[1] ?? null;

    // Subject-level average from ExamMark for latest exam
    const latestSubjectMarks = await this.prisma.examMark.groupBy({
      by: ['examSubjectId'],
      _avg: { marks: true },
      _count: { id: true },
      where: {
        examSubject: { examId: latestExam.id },
        isAbsent: false,
        marks: { not: null },
      },
    });

    // Enrich with subject names
    const examSubjectRows = await this.prisma.examSubject.findMany({
      where: { id: { in: latestSubjectMarks.map((r) => r.examSubjectId) } },
      select: { id: true, subjectId: true },
    });
    const subjectRows = await this.prisma.subject.findMany({
      where: { id: { in: [...new Set(examSubjectRows.map((s) => s.subjectId))] } },
      select: { id: true, name: true },
    });
    const subjectNameById = new Map(subjectRows.map((s) => [s.id, s.name]));
    const subjectMap = new Map(examSubjectRows.map((s) => [s.id, subjectNameById.get(s.subjectId) ?? 'Unknown']));

    // Aggregate by subject name (same subject may appear for multiple classes)
    const subjectAgg = new Map<string, { sum: number; count: number }>();
    for (const row of latestSubjectMarks) {
      const name = subjectMap.get(row.examSubjectId) ?? 'Unknown';
      const prev = subjectAgg.get(name) ?? { sum: 0, count: 0 };
      subjectAgg.set(name, {
        sum: prev.sum + Number(row._avg.marks ?? 0) * row._count.id,
        count: prev.count + row._count.id,
      });
    }

    const bySubject = Array.from(subjectAgg.entries())
      .map(([name, { sum, count }]) => ({
        subject: name,
        avgScore: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
        studentCount: count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 8);

    // Class-level average from ExamResult for latest exam
    const classResults = await this.prisma.examResult.findMany({
      where: { examId: latestExam.id },
      select: { studentId: true, percentage: true, resultStatus: true },
    });

    const studentEnrollments = await this.prisma.studentEnrollment.findMany({
      where: { studentId: { in: classResults.map((r) => r.studentId) }, status: 'ACTIVE' },
      include: { class: { select: { name: true } } },
    });
    const studentClassMap = new Map(studentEnrollments.map((e) => [e.studentId, e.class?.name ?? 'Unknown']));

    const classAgg = new Map<string, { sum: number; count: number; pass: number }>();
    for (const r of classResults) {
      const className = studentClassMap.get(r.studentId) ?? 'Unknown';
      const prev = classAgg.get(className) ?? { sum: 0, count: 0, pass: 0 };
      classAgg.set(className, {
        sum: prev.sum + Number(r.percentage ?? 0),
        count: prev.count + 1,
        pass: prev.pass + (r.resultStatus === 'PASS' ? 1 : 0),
      });
    }

    const byClass = Array.from(classAgg.entries())
      .map(([className, { sum, count, pass }]) => ({
        class: className,
        avgScore: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
        passRate: count > 0 ? Math.round((pass / count) * 100) : 0,
        studentCount: count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    return {
      bySubject,
      byClass,
      latestExam: { id: latestExam.id, name: latestExam.name },
      previousExam: previousExam ? { id: previousExam.id, name: previousExam.name } : null,
    };
  }

  // ─── At-Risk Students (Phase 3) ───────────────────────────────────────────

  async getAtRisk(organizationId: string) {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Low attendance (<75%) — group StudentAttendance by studentId
    const attendanceGroups = await this.prisma.studentAttendance.groupBy({
      by: ['studentId'],
      _count: { id: true },
      where: {
        student: { organizationId },
        date: { gte: thirtyDaysAgo },
        status: 'PRESENT',
      },
    });

    const totalDaysGroups = await this.prisma.studentAttendance.groupBy({
      by: ['studentId'],
      _count: { id: true },
      where: {
        student: { organizationId },
        date: { gte: thirtyDaysAgo },
      },
    });

    const totalDaysMap = new Map(totalDaysGroups.map((g) => [g.studentId, g._count.id]));
    const lowAttendanceIds = new Set<string>();
    const attendanceRateMap = new Map<string, number>();

    for (const g of attendanceGroups) {
      const total = totalDaysMap.get(g.studentId) ?? 0;
      if (total > 0) {
        const rate = (g._count.id / total) * 100;
        attendanceRateMap.set(g.studentId, Math.round(rate * 10) / 10);
        if (rate < 75) lowAttendanceIds.add(g.studentId);
      }
    }

    // 2. Overdue fees — group FeeInvoice by studentId
    const overdueInvoices = await this.prisma.feeInvoice.groupBy({
      by: ['studentId'],
      _sum: { total: true },
      _count: { id: true },
      where: { organizationId, status: 'OVERDUE' },
    });
    const overdueMap = new Map(
      overdueInvoices.map((inv) => [
        inv.studentId,
        { amount: Number(inv._sum.total ?? 0), count: inv._count.id },
      ]),
    );

    // 3. Declining marks — compare last 2 ExamResult % for each student
    const recentResults = await this.prisma.examResult.findMany({
      where: {
        exam: { organizationId, status: 'COMPLETED' },
      },
      orderBy: { exam: { startDate: 'desc' } },
      select: { studentId: true, percentage: true, examId: true },
    });

    // Keep last 2 results per student
    const studentResultsMap = new Map<string, { pct: number; examId: string }[]>();
    for (const r of recentResults) {
      const arr = studentResultsMap.get(r.studentId) ?? [];
      if (arr.length < 2) {
        arr.push({ pct: Number(r.percentage ?? 0), examId: r.examId });
        studentResultsMap.set(r.studentId, arr);
      }
    }

    const decliningIds = new Set<string>();
    for (const [studentId, results] of studentResultsMap.entries()) {
      if (results.length === 2 && results[0]!.pct < results[1]!.pct - 10) {
        decliningIds.add(studentId);
      }
    }

    // Collect all at-risk student IDs
    const overdueStudentIds = new Set(overdueMap.keys());
    const allAtRiskIds = new Set([
      ...lowAttendanceIds,
      ...overdueStudentIds,
      ...decliningIds,
    ]);

    if (allAtRiskIds.size === 0) {
      return {
        summary: { lowAttendance: 0, decliningMarks: 0, overduefees: 0, total: 0 },
        students: [],
      };
    }

    // Fetch student names for at-risk set (limit to 20 for dashboard)
    const atRiskStudents = await this.prisma.student.findMany({
      where: { id: { in: [...allAtRiskIds].slice(0, 20) }, organizationId },
      include: {
        person: { select: { firstName: true, lastName: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: { select: { name: true } } },
          take: 1,
        },
      },
      take: 20,
    });

    const students = atRiskStudents.map((s) => {
      const flags: string[] = [];
      if (lowAttendanceIds.has(s.id)) flags.push('attendance');
      if (decliningIds.has(s.id)) flags.push('marks');
      if (overdueStudentIds.has(s.id)) flags.push('fees');

      return {
        id: s.id,
        name: `${s.person.firstName} ${s.person.lastName}`,
        class: s.enrollments[0]?.class?.name ?? null,
        flags,
        attendanceRate: attendanceRateMap.get(s.id) ?? null,
        overdueAmount: overdueMap.get(s.id)?.amount ?? null,
      };
    });

    return {
      summary: {
        lowAttendance: lowAttendanceIds.size,
        decliningMarks: decliningIds.size,
        overduefees: overdueStudentIds.size,
        total: allAtRiskIds.size,
      },
      students,
    };
  }

  // ─── Substitution Summary (Phase 4) ──────────────────────────────────────

  async getSubstitutionSummary(organizationId: string) {
    // Reuse existing service — returns full KPIs + period board
    const today = await this.substitutionService.getTodayCoverage(organizationId);

    // 7-day trend: daily coverage rates
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyAssignments = await this.prisma.substitutionAssignment.findMany({
      where: {
        substitutionRequest: { organizationId },
        createdAt: { gte: sevenDaysAgo },
        status: { not: 'CANCELLED' },
      },
      select: { status: true, createdAt: true },
    });

    // Group by day
    const dayMap = new Map<string, { covered: number; total: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      dayMap.set(d.toISOString().split('T')[0]!, { covered: 0, total: 0 });
    }

    for (const a of weeklyAssignments) {
      const key = a.createdAt.toISOString().split('T')[0]!;
      if (dayMap.has(key)) {
        const bucket = dayMap.get(key)!;
        bucket.total++;
        if (a.status === 'CONFIRMED' || a.status === 'COMPLETED') bucket.covered++;
      }
    }

    const weekTrend = Array.from(dayMap.entries()).map(([date, { covered, total }]) => ({
      date,
      coverageRate: total > 0 ? Math.round((covered / total) * 100) : null,
      covered,
      total,
    }));

    return { kpis: today.kpis, weekTrend };
  }

  // ─── Staff HR (Phase 4) ───────────────────────────────────────────────────

  async getStaffHR(organizationId: string) {
    const stats = await this.teacherService.getStats(organizationId);

    // Department breakdown — group employees by department
    const [deptGroups, depts, employmentTypeGroups, recentJoiners] = await Promise.all([
      this.prisma.employee.groupBy({
        by: ['departmentId'],
        _count: { id: true },
        where: { organizationId, employmentStatus: { in: ['ACTIVE', 'PROBATION'] }, departmentId: { not: null } },
      }),
      this.prisma.department.findMany({
        where: { organizationId },
        select: { id: true, name: true },
      }),
      this.prisma.employee.groupBy({
        by: ['employmentType'],
        _count: { id: true },
        where: { organizationId, employmentStatus: { in: ['ACTIVE', 'PROBATION'] } },
      }),
      this.prisma.employee.findMany({
        where: {
          organizationId,
          joiningDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1),
          },
          employmentStatus: { in: ['ACTIVE', 'PROBATION'] },
        },
        select: { joiningDate: true },
        orderBy: { joiningDate: 'desc' },
      }),
    ]);

    const deptMap = new Map(depts.map((d) => [d.id, d.name]));
    const byDepartment = deptGroups
      .filter((g) => g.departmentId !== null)
      .map((g) => ({
        name: deptMap.get(g.departmentId!) ?? 'Other',
        count: g._count.id,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Employment type breakdown
    const byType = employmentTypeGroups.map((g) => ({
      type: g.employmentType ?? 'UNSPECIFIED',
      count: g._count.id,
    }));

    // Monthly joining trend (last 3 months)
    const joiningByMonth = new Map<string, number>();
    for (const e of recentJoiners) {
      if (!e.joiningDate) continue;
      const key = `${e.joiningDate.getFullYear()}-${e.joiningDate.getMonth()}`;
      joiningByMonth.set(key, (joiningByMonth.get(key) ?? 0) + 1);
    }

    const now = new Date();
    const joiningTrend = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return {
        label: MONTH_LABELS[d.getMonth()] as string,
        count: joiningByMonth.get(key) ?? 0,
      };
    });

    return {
      headline: stats,
      byDepartment,
      byType,
      joiningTrend,
      alerts: {
        probationEnding: stats.probationEnding,
        contractsExpiring: stats.contractsExpiring,
      },
    };
  }

  // ─── Leave Trends (Phase 4) ───────────────────────────────────────────────

  async getLeaveTrends(organizationId: string, months = 6) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const [leaveRequests, leaveTypes, pendingByType] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where: {
          organizationId,
          startDate: { gte: startDate },
          status: { in: ['APPROVED', 'PENDING'] },
        },
        select: {
          startDate: true,
          totalDays: true,
          status: true,
          leaveTypeId: true,
        },
      }),
      this.prisma.leaveType.findMany({
        where: { organizationId },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.leaveRequest.groupBy({
        by: ['leaveTypeId'],
        _count: { id: true },
        _sum: { totalDays: true },
        where: { organizationId, status: 'PENDING' },
      }),
    ]);

    const leaveTypeMap = new Map(leaveTypes.map((t) => [t.id, t]));

    // Monthly aggregation
    const monthlyMap = new Map<string, { approved: number; pending: number; days: number }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      monthlyMap.set(`${d.getFullYear()}-${d.getMonth()}`, { approved: 0, pending: 0, days: 0 });
    }

    for (const req of leaveRequests) {
      const key = `${req.startDate.getFullYear()}-${req.startDate.getMonth()}`;
      if (!monthlyMap.has(key)) continue;
      const bucket = monthlyMap.get(key)!;
      if (req.status === 'APPROVED') {
        bucket.approved++;
        bucket.days += req.totalDays;
      } else {
        bucket.pending++;
      }
    }

    const monthly = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = monthlyMap.get(key) ?? { approved: 0, pending: 0, days: 0 };
      return {
        label: MONTH_LABELS[d.getMonth()] as string,
        year: d.getFullYear(),
        approved: bucket.approved,
        pending: bucket.pending,
        totalDays: bucket.days,
      };
    });

    // Pending by leave type
    const pendingBreakdown = pendingByType.map((p) => ({
      type: leaveTypeMap.get(p.leaveTypeId)?.name ?? 'Other',
      count: p._count.id,
      days: Number(p._sum.totalDays ?? 0),
    })).sort((a, b) => b.count - a.count);

    const totalPending = pendingByType.reduce((s, p) => s + p._count.id, 0);
    const totalApprovedThisMonth = monthly[monthly.length - 1]?.approved ?? 0;

    return { monthly, pendingBreakdown, totalPending, totalApprovedThisMonth };
  }

  // ─── Year-over-Year Comparison (Phase 5) ─────────────────────────────────

  async getYoY(organizationId: string) {
    // Resolve current and previous academic years
    const [currentYear, previousYear] = await Promise.all([
      this.prisma.academicYear.findFirst({
        where: { organizationId, isCurrent: true },
        select: { id: true, name: true, startDate: true, endDate: true },
      }),
      this.prisma.academicYear.findFirst({
        where: { organizationId, isCurrent: false },
        orderBy: { startDate: 'desc' },
        select: { id: true, name: true, startDate: true, endDate: true },
      }),
    ]);

    if (!currentYear) {
      return { currentYear: null, previousYear: null, metrics: [] };
    }

    // Fetch current year actuals
    const [
      curEnrollment,
      curFees,
      curExams,
      curNewStaff,
    ] = await Promise.all([
      this.prisma.studentEnrollment.count({
        where: { academicYearId: currentYear.id, status: 'ACTIVE' },
      }),
      this.prisma.feePayment.aggregate({
        _sum: { amount: true },
        where: {
          organizationId,
          status: 'CONFIRMED',
          paymentDate: { gte: currentYear.startDate, lte: currentYear.endDate ?? new Date() },
        },
      }),
      this.prisma.exam.count({
        where: { organizationId, academicYearId: currentYear.id, status: 'COMPLETED' },
      }),
      this.prisma.employee.count({
        where: {
          organizationId,
          joiningDate: {
            gte: currentYear.startDate,
            lte: currentYear.endDate ?? new Date(),
          },
        },
      }),
    ]);

    // Fetch previous year actuals (if available)
    let prevEnrollment = 0;
    let prevFees       = 0;
    let prevExams      = 0;
    let prevNewStaff   = 0;

    if (previousYear) {
      const [pe, pf, px, ps] = await Promise.all([
        this.prisma.studentEnrollment.count({
          where: { academicYearId: previousYear.id, status: { not: 'WITHDRAWN' } },
        }),
        this.prisma.feePayment.aggregate({
          _sum: { amount: true },
          where: {
            organizationId,
            status: 'CONFIRMED',
            paymentDate: { gte: previousYear.startDate, lte: previousYear.endDate ?? currentYear.startDate },
          },
        }),
        this.prisma.exam.count({
          where: { organizationId, academicYearId: previousYear.id, status: 'COMPLETED' },
        }),
        this.prisma.employee.count({
          where: {
            organizationId,
            joiningDate: {
              gte: previousYear.startDate,
              lte: previousYear.endDate ?? currentYear.startDate,
            },
          },
        }),
      ]);

      prevEnrollment = pe;
      prevFees       = Math.round(Number(pf._sum.amount ?? 0));
      prevExams      = px;
      prevNewStaff   = ps;
    }

    const curFeesNum = Math.round(Number(curFees._sum.amount ?? 0));

    const delta = (cur: number, prev: number) => {
      const d = cur - prev;
      const pct = prev > 0 ? Math.round((d / prev) * 1000) / 10 : null;
      return { delta: d, deltaPercent: pct };
    };

    return {
      currentYear:  { id: currentYear.id,  name: currentYear.name },
      previousYear: previousYear ? { id: previousYear.id, name: previousYear.name } : null,
      metrics: [
        {
          key:      'enrollment',
          label:    'Students Enrolled',
          unit:     'students',
          current:  curEnrollment,
          previous: prevEnrollment,
          ...delta(curEnrollment, prevEnrollment),
        },
        {
          key:      'feeCollected',
          label:    'Fee Collected',
          unit:     '₹',
          current:  curFeesNum,
          previous: prevFees,
          ...delta(curFeesNum, prevFees),
        },
        {
          key:      'examsCompleted',
          label:    'Exams Completed',
          unit:     'exams',
          current:  curExams,
          previous: prevExams,
          ...delta(curExams, prevExams),
        },
        {
          key:      'newStaff',
          label:    'New Staff Joined',
          unit:     'staff',
          current:  curNewStaff,
          previous: prevNewStaff,
          ...delta(curNewStaff, prevNewStaff),
        },
      ],
    };
  }

  // ─── Dashboard Targets (Phase 5) ──────────────────────────────────────────

  private readonly TARGET_DEFAULTS: Record<string, number> = {
    studentAttendance:     90,
    staffAttendance:       95,
    feeCollectionRate:     85,
    admissionsConversion:  20,
    examPassRate:          80,
    substitutionCoverage:  95,
  };

  async getTargets(organizationId: string) {
    const settings = await this.prisma.setting.findMany({
      where: { organizationId, category: 'DASHBOARD_TARGETS' },
      select: { key: true, value: true },
    });

    const stored = new Map(
      settings.map((s) => [s.key, Number((s.value as { v: number }).v ?? s.value)]),
    );

    const targets = Object.entries(this.TARGET_DEFAULTS).map(([key, defaultVal]) => ({
      key,
      target: stored.get(key) ?? defaultVal,
      isCustom: stored.has(key),
    }));

    return { targets };
  }

  async updateTargets(organizationId: string, updates: Record<string, number>) {
    const upserts = Object.entries(updates)
      .filter(([key]) => key in this.TARGET_DEFAULTS)
      .map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { organizationId_key: { organizationId, key } },
          create: {
            organizationId,
            key,
            value: { v: value } as object,
            valueType: 'NUMBER',
            category: 'DASHBOARD_TARGETS',
          },
          update: { value: { v: value } as object },
        }),
      );

    await Promise.all(upserts);
    return this.getTargets(organizationId);
  }

  // ─── Payroll Summary (Phase 5) ────────────────────────────────────────────

  async getPayrollSummary(organizationId: string) {
    // Derive current Indian financial year (Apr–Mar)
    const now = new Date();
    const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const financialYear = `${fyStartYear}-${fyStartYear + 1}`;

    const monthTrend = await this.payrollService.getPayrollAnalyticsMonthTrend(
      organizationId,
      financialYear,
    );

    // Convert Decimal → plain number for JSON serialisation
    const monthly = monthTrend.map((m) => ({
      period:     m.period,          // "YYYY-MM"
      headcount:  m.headcount,
      gross:      Number(m.totalGross),
      net:        Number(m.totalNet),
      tds:        Number(m.totalTds),
      label:      new Date(m.period + '-01').toLocaleString('en-US', { month: 'short' }),
    }));

    const totalGross = monthly.reduce((s, m) => s + m.gross, 0);
    const totalNet   = monthly.reduce((s, m) => s + m.net,   0);
    const latestRun  = monthly[monthly.length - 1] ?? null;

    return { financialYear, monthly, totalGross, totalNet, latestRun };
  }
}
