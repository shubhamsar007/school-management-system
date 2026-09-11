'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { KpiCard, Card, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { SchoolPulse, type PulseMetric } from '@/components/dashboard/school-pulse';
import { NeedsActionPanel, type ActionItem } from '@/components/dashboard/needs-action-panel';
import { TodayOps, type OpsRow } from '@/components/dashboard/today-ops';
import { TodayAgenda, type AgendaItem } from '@/components/dashboard/today-agenda';
import { AttendanceChart } from '@/components/dashboard/attendance-chart';
import { FeeTrendChart } from '@/components/dashboard/fee-trend-chart';
import { EnrollmentChart } from '@/components/dashboard/enrollment-chart';
import { AdmissionsFunnel, type FunnelStage } from '@/components/dashboard/admissions-funnel';
import { FeeAging, type AgingBucket } from '@/components/dashboard/fee-aging';
import { SubstitutionWidget } from '@/components/dashboard/substitution-widget';
import { ExamProgressWidget } from '@/components/dashboard/exam-progress-widget';
import { AcademicPerformanceChart } from '@/components/dashboard/academic-performance-chart';
import { AtRiskWidget } from '@/components/dashboard/at-risk-widget';
import { StaffHRWidget } from '@/components/dashboard/staff-hr-widget';
import { LeaveTrendChart } from '@/components/dashboard/leave-trend-chart';
import { CoverageTrendChart } from '@/components/dashboard/coverage-trend-chart';
import { YoYComparisonWidget } from '@/components/dashboard/yoy-comparison-widget';
import { TargetsWidget, type TargetMetric } from '@/components/dashboard/targets-widget';
import { PayrollTrendChart } from '@/components/dashboard/payroll-trend-chart';
import {
  useDashboardOverview,
  useDashboardAttendanceTrend,
  useDashboardFinanceSummary,
  useDashboardEnrollment,
  useDashboardExamProgress,
  useDashboardAcademicPerformance,
  useDashboardAtRisk,
  useDashboardSubstitutionSummary,
  useDashboardStaffHR,
  useDashboardLeaveTrends,
  useDashboardYoY,
  useDashboardTargets,
  useDashboardPayrollSummary,
} from '@/lib/hooks/use-dashboard';
import { useCurrentUser } from '@/lib/hooks/use-identity';
import { useAdmissionAnalytics } from '@/lib/hooks/use-admissions';
import { useUnreadCount } from '@/lib/hooks/use-comms';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─── Static data ─────────────────────────────────────────────────────────────

const AGENDA: AgendaItem[] = [
  { time: '09:00', color: '#3a7a57', title: 'Staff morning meeting',          where: 'Conference Room A' },
  { time: '10:30', color: '#b8623c', title: 'Grade 10 Parent-Teacher Meet',   where: 'Room 204' },
  { time: '12:00', color: '#6b54a8', title: 'Admissions review — 4 pending',  where: 'Principal Office' },
  { time: '14:00', color: '#3a7a57', title: 'Exam verification session',       where: 'Room 101' },
  { time: '16:30', color: '#3a6b8a', title: 'End-of-day attendance report',   where: 'Admin portal' },
];

const FEE_AGING_BUCKETS: AgingBucket[] = [
  { label: 'Current (< 30 days)',  amount: '₹18L',  amountNum: 1800, color: '#c87d2a',  href: '/finance?aging=current' },
  { label: '31 – 60 days',         amount: '₹8L',   amountNum: 800,  color: '#b8623c',  href: '/finance?aging=31-60' },
  { label: '61 – 90 days',         amount: '₹5L',   amountNum: 500,  color: '#9c4e28',  href: '/finance?aging=61-90' },
  { label: '90+ days',             amount: '₹3.2L', amountNum: 320,  color: '#7a3018',  href: '/finance?aging=90plus' },
];

const ACTIVITY = [
  { color: '#3a7a57', text: "Aarav Mehta's fee payment of ₹12,500 confirmed",   time: '2 min ago' },
  { color: '#2e6644', text: 'Attendance marked for Grade 8·B (38 present)',      time: '18 min ago' },
  { color: '#9c4e28', text: 'Leave request from Priya Sharma approved',          time: '1 hr ago' },
  { color: '#3a6b8a', text: 'New admission enquiry: Riya Verma (Grade 5)',       time: '2 hr ago' },
  { color: '#b3261e', text: 'Payroll run for Aug completed — ₹18.4L disbursed',  time: '3 hr ago' },
  { color: '#2e6644', text: 'Timetable updated for Grade 10·A',                  time: '5 hr ago' },
  { color: '#9c4e28', text: 'Exam schedule published: Mid Term Sep 2026',        time: 'Yesterday' },
  { color: '#3a6b8a', text: '3 substitution requests auto-assigned',             time: 'Yesterday' },
];

// ─── Chart tab type ───────────────────────────────────────────────────────────

type ChartTab = 'attendance' | 'fee' | 'enrollment';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString('en-IN'); }
function fmtRate(r: number) { return `${(r > 1 ? r : r * 100).toFixed(1)}%`; }
function toLakhStr(n: number) {
  const l = n / 100_000;
  return l >= 10 ? `₹${Math.round(l)}L` : `₹${l.toFixed(1)}L`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiSkeletonRow() {
  return (
    <div className="grid grid-cols-6" style={{ gap: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          background: '#ebe8e0', border: '1px solid #dad6cc',
          borderRadius: 18, padding: '16px 18px',
        }}>
          <Skeleton height={10} width={80} className="mb-3" />
          <Skeleton height={28} width={60} className="mb-2" />
          <Skeleton height={10} width={100} />
        </div>
      ))}
    </div>
  );
}

function ChartTabBtn({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11, fontWeight: active ? 700 : 500,
        color: active ? '#2a5473' : '#8d938d',
        background: active ? '#c8dce8' : 'transparent',
        border: active ? '1px solid #9fc3d8' : '1px solid transparent',
        borderRadius: 8, padding: '3px 10px',
        cursor: 'pointer', transition: 'all 120ms',
      }}
    >
      {label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [chartTab, setChartTab]   = React.useState<ChartTab>('attendance');
  const queryClient               = useQueryClient();

  const { data: overview,    isLoading: ovLoading,  error: ovError,   refetch }    = useDashboardOverview();
  const { data: trendData,   isLoading: trendLoading  }                             = useDashboardAttendanceTrend(6);
  const { data: financeData, isLoading: financeLoading }                            = useDashboardFinanceSummary(6);
  const { data: enrollData,  isLoading: enrollLoading  }                            = useDashboardEnrollment();
  const { data: examProgress, isLoading: examLoading }                              = useDashboardExamProgress();
  const { data: academicPerf, isLoading: perfLoading  }                             = useDashboardAcademicPerformance();
  const { data: atRiskData,      isLoading: riskLoading    }                          = useDashboardAtRisk();
  const { data: subSummary,      isLoading: subLoading     }                          = useDashboardSubstitutionSummary();
  const { data: staffHR,         isLoading: hrLoading      }                          = useDashboardStaffHR();
  const { data: leaveTrends,     isLoading: leaveLoading   }                          = useDashboardLeaveTrends(6);
  const { data: yoyData,         isLoading: yoyLoading     }                          = useDashboardYoY();
  const { data: targetsData,     isLoading: targetsLoading }                          = useDashboardTargets();
  const { data: payrollData,     isLoading: payrollLoading }                          = useDashboardPayrollSummary();
  const { data: currentUser }                                                         = useCurrentUser();
  const { data: admAnalytics }                                                        = useAdmissionAnalytics();
  const { data: unreadData }                                                        = useUnreadCount({ refetchInterval: 60_000 });

  const today        = new Date();
  const dateLabel    = today.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const currentMonth = today.toLocaleString('en-US', { month: 'short' });

  // ── Derived KPI values ─────────────────────────────────────────────────────

  const students   = overview?.students;
  const staff      = overview?.staff;
  const attendance = overview?.attendance;
  const admissions = overview?.admissions;
  const actions    = overview?.actions;

  const studentRate = attendance ? (attendance.students.rate > 1 ? attendance.students.rate : attendance.students.rate * 100) : 0;
  const staffRate   = attendance ? (attendance.staff.rate   > 1 ? attendance.staff.rate   : attendance.staff.rate   * 100) : 0;

  // Finance totals from real API (fall back to static)
  const financeTotals  = financeData?.totals;
  const collectionRate = financeTotals?.collectionRate ?? 78.4;
  const collectedStr   = financeTotals ? toLakhStr(financeTotals.collected)   : '₹24.6L';
  const outstandingStr = financeTotals ? toLakhStr(financeTotals.outstanding) : '₹36L';
  const overdueStr     = financeTotals ? toLakhStr(financeTotals.overdue)     : '₹18L';

  // ── Role-aware visibility ──────────────────────────────────────────────────
  const roleCodes    = currentUser?.roles.map((r) => r.code.toUpperCase()) ?? [];
  const isTeacher    = roleCodes.length > 0 && roleCodes.every((c) => c.includes('TEACHER') || c.includes('FACULTY'));
  const canSeePayroll = !isTeacher;
  const canSeeHR      = !isTeacher;

  // ── Targets actuals (assembled from loaded data) ───────────────────────────
  const avgExamPassRate = academicPerf?.byClass.length
    ? Math.round(academicPerf.byClass.reduce((s, c) => s + c.passRate, 0) / academicPerf.byClass.length * 10) / 10
    : null;

  const targetMap = new Map(targetsData?.targets.map((t) => [t.key, t.target]) ?? []);
  const targetMetrics: TargetMetric[] = [
    {
      key:    'studentAttendance',
      label:  'Student Attendance',
      target: targetMap.get('studentAttendance') ?? 90,
      actual: attendance ? Math.round(studentRate * 10) / 10 : null,
      unit:   '%',
      href:   '/attendance',
    },
    {
      key:    'feeCollectionRate',
      label:  'Fee Collection Rate',
      target: targetMap.get('feeCollectionRate') ?? 85,
      actual: financeTotals ? Math.round(collectionRate * 10) / 10 : null,
      unit:   '%',
      href:   '/finance',
    },
    {
      key:    'admissionsConversion',
      label:  'Admissions Conversion',
      target: targetMap.get('admissionsConversion') ?? 20,
      actual: admAnalytics ? Math.round(admAnalytics.metrics.conversionRate * 10) / 10 : null,
      unit:   '%',
      href:   '/admissions',
    },
    {
      key:    'examPassRate',
      label:  'Exam Pass Rate',
      target: targetMap.get('examPassRate') ?? 80,
      actual: avgExamPassRate,
      unit:   '%',
      href:   '/examinations',
    },
    {
      key:    'substitutionCoverage',
      label:  'Substitution Coverage',
      target: targetMap.get('substitutionCoverage') ?? 95,
      actual: subSummary ? subSummary.kpis.coverageRate : null,
      unit:   '%',
      href:   '/substitutions',
    },
  ];

  // ── Save target edit ───────────────────────────────────────────────────────
  const handleTargetEdit = React.useCallback(async (key: string, newTarget: number) => {
    await apiClient.patch('/dashboard/targets', { [key]: newTarget });
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 'targets'] });
  }, [queryClient]);

  // ── School Pulse ───────────────────────────────────────────────────────────

  const pulseMetrics: PulseMetric[] = [
    {
      label:  'Student Attendance',
      value:  attendance ? `${studentRate.toFixed(1)}%` : '—',
      status: studentRate >= 90 ? 'good' : studentRate >= 85 ? 'watch' : 'attention',
      target: '90%',
      href:   '/attendance',
    },
    {
      label:  'Staff Attendance',
      value:  attendance ? `${staffRate.toFixed(1)}%` : '—',
      status: staffRate >= 92 ? 'good' : staffRate >= 85 ? 'watch' : 'attention',
      target: '92%',
      href:   '/attendance',
    },
    {
      label:  'Fee Collection',
      value:  `${collectionRate.toFixed(1)}%`,
      status: collectionRate >= 85 ? 'good' : collectionRate >= 70 ? 'watch' : 'attention',
      target: '85%',
      href:   '/finance',
    },
    {
      label:  'Admissions Conversion',
      value:  admAnalytics ? `${admAnalytics.metrics.conversionRate.toFixed(1)}%` : '19.4%',
      status: 'good',
      href:   '/admissions',
    },
    {
      label:  'Exam Completion',
      value:  examProgress?.exams.length
        ? `${Math.round(examProgress.exams.reduce((s, e) => s + e.completionPct, 0) / examProgress.exams.length)}%`
        : '—',
      status: (() => {
        if (!examProgress?.exams.length) return 'good' as const;
        const avg = examProgress.exams.reduce((s, e) => s + e.completionPct, 0) / examProgress.exams.length;
        return avg >= 90 ? 'good' as const : avg >= 60 ? 'watch' as const : 'attention' as const;
      })(),
      target: '100%',
      href:   '/examinations',
    },
    {
      label:  'Substitution Coverage',
      value:  subSummary ? `${subSummary.kpis.coverageRate}%` : '—',
      status: (() => {
        const r = subSummary?.kpis.coverageRate ?? null;
        if (r === null) return 'good' as const;
        return r >= 95 ? 'good' as const : r >= 80 ? 'watch' as const : 'attention' as const;
      })(),
      target: '95%',
      href:   '/substitutions',
    },
  ];

  // ── Needs Action ───────────────────────────────────────────────────────────

  const actionItems: ActionItem[] = ([
    {
      count:    subSummary?.kpis.uncovered ?? 0,
      label:    'Substitution periods uncovered',
      sub:      subSummary
        ? `${subSummary.kpis.teachersAbsent} teacher${subSummary.kpis.teachersAbsent !== 1 ? 's' : ''} absent · ${subSummary.kpis.awaitingConfirmation} awaiting confirmation`
        : 'Requires immediate assignment',
      priority: 'critical' as const,
      href:     '/substitutions?status=UNRESOLVED',
    },
    {
      count:    examProgress?.exams.reduce((s, e) => s + e.pendingVerifications, 0) ?? 0,
      label:    'Exam marks awaiting verification',
      sub:      examProgress?.exams.length ? `${examProgress.exams.length} active exam${examProgress.exams.length !== 1 ? 's' : ''}` : 'Exam batch',
      priority: 'critical' as const,
      href:     '/examinations',
    },
    {
      count:    actions?.admissionsPending ?? 12,
      label:    'Admission applications pending',
      sub:      'Under review stage',
      priority: 'high' as const,
      href:     '/admissions?status=UNDER_REVIEW',
    },
    {
      count:    leaveTrends?.totalPending ?? actions?.leaveRequestsPending ?? 0,
      label:    'Leave requests pending approval',
      sub:      leaveTrends?.pendingBreakdown.length
        ? leaveTrends.pendingBreakdown.slice(0, 2).map((b) => b.type).join(' · ')
        : 'Teaching & non-teaching staff',
      priority: 'high' as const,
      href:     '/attendance?tab=leave',
    },
    {
      count:    unreadData?.count ?? 7,
      label:    'Unread notifications',
      sub:      'Finance · HR · Academic alerts',
      priority: 'low' as const,
      href:     '/notifications',
    },
  ] as ActionItem[]).filter((item) => item.count > 0);

  // ── Today's operations ─────────────────────────────────────────────────────

  const opsRows: OpsRow[] = [
    { label: 'Students Present',       value: attendance ? fmt(attendance.students.present) : '—', highlight: 'green' },
    { label: 'Students Absent',        value: attendance ? fmt(attendance.students.absent)  : '—', highlight: attendance && attendance.students.absent > 80 ? 'amber' : 'default' },
    { label: 'Late Arrivals',          value: attendance ? fmt(attendance.students.late)    : '—' },
    { label: 'Staff Absent',           value: attendance ? fmt(attendance.staff.absent)     : '—', highlight: attendance && attendance.staff.absent > 8 ? 'amber' : 'default' },
    { label: 'Staff on Leave',         value: attendance ? fmt(attendance.staff.onLeave)    : '—' },
    { label: 'Pending Leave Requests', value: leaveTrends ? fmt(leaveTrends.totalPending) : (actions ? fmt(actions.leaveRequestsPending) : '—'), highlight: 'amber', href: '/attendance?tab=leave' },
    { label: 'Exams Today',            value: '2',    highlight: 'blue',  href: '/examinations' },
    { label: 'Substitutions Needed',   value: subSummary ? String(subSummary.kpis.uncovered) : '—', highlight: subSummary && subSummary.kpis.uncovered > 0 ? 'amber' : 'default', href: '/substitutions' },
    { label: 'Fee Collected Today',    value: '₹4.8L', highlight: 'green', href: '/finance' },
  ];

  // ── Admissions funnel ──────────────────────────────────────────────────────

  const FUNNEL_COLORS = ['#3a6b8a', '#2a6080', '#2e7a52', '#1e5034', '#6b54a8'] as const;
  const funnelStages: FunnelStage[] = admAnalytics
    ? admAnalytics.funnel.map((f, i) => ({
        label: f.stage,
        count: f.count,
        color: FUNNEL_COLORS[i % FUNNEL_COLORS.length] as string,
        href:  '/admissions',
      }))
    : [
        { label: 'Enquiries',      count: admissions?.enquiries.total ?? 1842,                           color: '#3a6b8a', href: '/admissions' },
        { label: 'Applications',   count: admissions?.applications.total ?? 963,                         color: '#2a6080', href: '/admissions' },
        { label: 'Under Review',   count: admissions?.applications.pendingReview ?? 248,                 color: '#2e7a52', href: '/admissions?status=UNDER_REVIEW' },
        { label: 'Approved',       count: admissions?.applications.byStatus?.['APPROVED'] ?? 412,        color: '#1e5034', href: '/admissions?status=APPROVED' },
        { label: 'Enrolled',       count: admissions?.applications.byStatus?.['ENROLLED'] ?? 358,        color: '#6b54a8', href: '/admissions?status=ENROLLED' },
      ];

  // ── Chart tab legend config ────────────────────────────────────────────────

  const chartTabConfig: Record<ChartTab, { title: string; legend: React.ReactNode; loading: boolean }> = {
    attendance: {
      title: 'Attendance Trend',
      loading: trendLoading,
      legend: (
        <div className="flex gap-4" style={{ fontSize: 11, color: '#3d6678' }}>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 9, height: 9, borderRadius: 3, background: '#2e7a52' }} />
            Students
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 9, height: 9, borderRadius: 3, background: '#b8623c' }} />
            Staff
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 18, height: 1.5, background: '#c87d2a', marginBottom: 1 }} />
            Target (90%)
          </div>
        </div>
      ),
    },
    fee: {
      title: 'Fee Collection Trend',
      loading: financeLoading,
      legend: (
        <div className="flex gap-4" style={{ fontSize: 11, color: '#3d6678' }}>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 9, height: 9, borderRadius: 3, background: '#2e7a52' }} />
            Collected
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 18, height: 1.5, background: '#c87d2a', marginBottom: 1 }} />
            Target
          </div>
        </div>
      ),
    },
    enrollment: {
      title: 'Enrollment by Class',
      loading: enrollLoading,
      legend: (
        <div className="flex gap-4" style={{ fontSize: 11, color: '#3d6678' }}>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 9, height: 9, borderRadius: 3, background: '#2e7a52' }} />
            Enrolled
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 9, height: 9, borderRadius: 3, background: '#c87d2a' }} />
            ≥ 85% full
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 9, height: 9, borderRadius: 3, background: '#b3261e' }} />
            ≥ 95% full
          </div>
        </div>
      ),
    },
  };

  const activeTab = chartTabConfig[chartTab];

  return (
    <div className="flex flex-col" style={{ gap: 14 }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <PageHeader
        title="Dashboard"
        subtitle={`${dateLabel} · Good morning, Principal`}
        actions={
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 11, color: '#a9aca4' }}>
              Academic Year 2026–27 · All Campuses
            </span>
            <button
              onClick={() => refetch()}
              style={{
                fontSize: 11, fontWeight: 600, color: '#5d7f6b',
                background: '#d8e9dc', border: '1px solid #bfd4c4',
                borderRadius: 8, padding: '4px 12px', cursor: 'pointer',
                transition: 'background 140ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#c8dece'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#d8e9dc'; }}
            >
              Refresh
            </button>
          </div>
        }
      />

      {/* ── Row 1: 6 KPI Cards ───────────────────────────────────────────── */}
      {ovLoading ? <KpiSkeletonRow /> : (
        <div className="grid grid-cols-6" style={{ gap: 12 }}>
          <KpiCard
            title="Total Students"
            value={students ? fmt(students.total) : '—'}
            {...(students ? { trend: `+${students.newAdmissions} new`, trendPositive: true } : {})}
            {...(students ? { detail: `${fmt(students.active)} active · ${fmt(students.boys)}B / ${fmt(students.girls)}G` } : {})}
            subtitle="this academic year"
            variant="sage"
            href="/students"
          />
          <KpiCard
            title="Active Staff"
            value={staffHR ? fmt(staffHR.headline.active) : (staff ? fmt(staff.active) : '—')}
            {...((staffHR?.headline.newJoiners ?? staff?.newJoiners ?? 0) > 0
              ? { trend: `+${staffHR?.headline.newJoiners ?? staff?.newJoiners} new`, trendPositive: true }
              : {})}
            {...(staffHR
              ? { detail: `${fmt(staffHR.headline.teachers)} teaching · ${fmt(staffHR.headline.nonTeaching)} non-teaching` }
              : staff
              ? { detail: `${fmt(staff.teachers)} teaching · ${fmt(staff.nonTeaching)} non-teaching` }
              : {})}
            {...(staffHR
              ? { subtitle: `${fmt(staffHR.headline.onLeave)} on leave · ${fmt(staffHR.headline.absentToday)} absent today` }
              : staff
              ? { subtitle: `${fmt(staff.onLeave)} on leave today` }
              : {})}
            variant="blue"
            href="/teachers"
          />
          <KpiCard
            title="Attendance Today"
            value={attendance ? `${studentRate.toFixed(1)}%` : '—'}
            trend={studentRate >= 90 ? '↑ above target' : '↓ below target'}
            trendPositive={studentRate >= 90}
            {...(attendance ? { detail: `${fmt(attendance.students.present)} present · ${fmt(attendance.students.absent)} absent` } : {})}
            subtitle="student attendance"
            variant="heather"
            href="/attendance"
          />
          <KpiCard
            title="Fee Collection"
            value={collectedStr}
            trend={`${collectionRate.toFixed(1)}%`}
            trendPositive={collectionRate >= 85}
            detail={`${outstandingStr} outstanding · ${overdueStr} overdue`}
            subtitle="of annual target"
            variant="clay"
            href="/finance"
          />
          <KpiCard
            title="Admissions"
            value={admissions ? fmt(admissions.applications.total) : '—'}
            {...(admissions ? { trend: `${admissions.applications.pendingReview} pending`, trendPositive: false } : {})}
            detail={admAnalytics
              ? `${admAnalytics.metrics.conversionRate.toFixed(1)}% conversion · ${admAnalytics.metrics.enrolled} enrolled`
              : `${admissions?.enquiries.total ?? 1842} enquiries`}
            subtitle="applications this year"
            variant="neutral"
            href="/admissions"
          />
          <KpiCard
            title="Academic Performance"
            value={academicPerf?.byClass.length
              ? `${(academicPerf.byClass.reduce((s, c) => s + c.avgScore, 0) / academicPerf.byClass.length).toFixed(1)}%`
              : '—'}
            {...(academicPerf?.latestExam ? { detail: academicPerf.latestExam.name } : {})}
            subtitle="avg score · latest exam"
            variant="sage"
            href="/examinations"
          />
        </div>
      )}

      {/* ── Row 1.5: Year-over-Year Comparison strip (Phase 5) ──────────── */}
      <Card bg="#f8f5ee" style={{ border: '1px solid #e0dcd0' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <div>
            <CardTitle style={{ color: '#3d3a30', fontSize: 13 }}>Year-over-Year</CardTitle>
            {yoyData?.currentYear && yoyData.previousYear && (
              <span style={{ fontSize: 10, color: '#8d938d', marginTop: 1, display: 'block' }}>
                {yoyData.previousYear.name} → {yoyData.currentYear.name}
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: '#a0998e' }}>Academic year comparison</span>
        </div>
        {yoyLoading ? (
          <div className="grid grid-cols-4" style={{ gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={40} className="rounded-lg" />)}
          </div>
        ) : (
          <YoYComparisonWidget
            metrics={yoyData?.metrics ?? []}
            currentYearName={yoyData?.currentYear?.name ?? null}
            previousYearName={yoyData?.previousYear?.name ?? null}
          />
        )}
      </Card>

      {/* ── Row 2: School Pulse + Needs Action ───────────────────────────── */}
      <div className="grid" style={{ gridTemplateColumns: '1.25fr 1fr', gap: 14 }}>

        <Card bg="#f4f0e8" style={{ border: '1px solid #ddd9ce' }}>
          <CardHeader>
            <CardTitle style={{ color: '#3d3a30' }}>School Pulse</CardTitle>
            <span style={{ fontSize: 11, color: '#a9aca4' }}>Live health indicators</span>
          </CardHeader>
          {ovLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={36} className="rounded-xl" />)}
            </div>
          ) : (
            <SchoolPulse metrics={pulseMetrics} />
          )}
        </Card>

        <Card bg="#fdf4eb" style={{ border: '1px solid #e8d4b8' }}>
          <CardHeader>
            <CardTitle style={{ color: '#7d3e1f' }}>Needs Your Action</CardTitle>
            {!ovLoading && (
              <span style={{
                fontSize: 10.5, fontWeight: 700,
                color: '#8c1e18', background: '#fde6e4',
                padding: '2px 8px', borderRadius: 20,
              }}>
                {actionItems.filter((a) => a.priority === 'critical').length} critical
              </span>
            )}
          </CardHeader>
          {ovLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={44} className="rounded-xl" />)}
            </div>
          ) : ovError ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 12, color: '#8d938d' }}>Unable to load actions</p>
              <button
                onClick={() => refetch()}
                style={{ fontSize: 11.5, fontWeight: 600, color: '#5d7f6b', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
              >
                Retry
              </button>
            </div>
          ) : (
            <NeedsActionPanel items={actionItems} />
          )}
        </Card>
      </div>

      {/* ── Row 3: Chart (tabbed) + Today Ops + Today Agenda ─────────────── */}
      <div className="grid" style={{ gridTemplateColumns: '1.55fr 1fr 1fr', gap: 14 }}>

        {/* Tabbed trend chart */}
        <Card bg="#dfeaf1" style={{ border: '1px solid #b8d0e0' }}>
          {/* Card header with tab switcher */}
          <div className="flex items-start justify-between" style={{ marginBottom: 14 }}>
            <div>
              <CardTitle style={{ color: '#2a5473', marginBottom: 6 }}>
                {activeTab.title}
              </CardTitle>
              {activeTab.legend}
            </div>
            <div className="flex gap-1" style={{ flexShrink: 0, marginLeft: 8 }}>
              <ChartTabBtn label="Attendance" active={chartTab === 'attendance'} onClick={() => setChartTab('attendance')} />
              <ChartTabBtn label="Fee"        active={chartTab === 'fee'}        onClick={() => setChartTab('fee')} />
              <ChartTabBtn label="Enrollment" active={chartTab === 'enrollment'} onClick={() => setChartTab('enrollment')} />
            </div>
          </div>

          {/* Chart body */}
          {activeTab.loading ? (
            <Skeleton height={150} className="rounded-lg" />
          ) : (
            <>
              {chartTab === 'attendance' && (
                <>
                  <AttendanceChart
                    data={trendData?.months ?? []}
                    targetLine={90}
                    currentMonth={currentMonth}
                  />
                  <div style={{ borderTop: '1px solid #b8d0e0', marginTop: 10, paddingTop: 10 }}>
                    <div className="flex gap-8">
                      {[
                        { label: 'AVG STUDENT', value: trendData ? `${(trendData.months.reduce((s, m) => s + m.students, 0) / (trendData.months.length || 1)).toFixed(1)}%` : `${studentRate.toFixed(1)}%` },
                        { label: 'AVG STAFF',   value: trendData ? `${(trendData.months.reduce((s, m) => s + m.staff,    0) / (trendData.months.length || 1)).toFixed(1)}%` : `${staffRate.toFixed(1)}%` },
                        { label: 'THIS MONTH',  value: currentMonth },
                      ].map((s) => (
                        <div key={s.label}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.09em', color: '#4e6a7d', textTransform: 'uppercase' }}>
                            {s.label}
                          </div>
                          <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 17, fontWeight: 600, marginTop: 2, color: '#1e3d4f' }}>
                            {s.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {chartTab === 'fee' && (
                <>
                  <FeeTrendChart data={financeData?.monthly ?? []} />
                  <div style={{ borderTop: '1px solid #b8d0e0', marginTop: 10, paddingTop: 10 }}>
                    <div className="flex gap-8">
                      {[
                        { label: 'COLLECTED',    value: collectedStr },
                        { label: 'OUTSTANDING',  value: outstandingStr },
                        { label: 'RATE',         value: `${collectionRate.toFixed(1)}%` },
                      ].map((s) => (
                        <div key={s.label}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.09em', color: '#4e6a7d', textTransform: 'uppercase' }}>
                            {s.label}
                          </div>
                          <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 17, fontWeight: 600, marginTop: 2, color: '#1e3d4f' }}>
                            {s.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {chartTab === 'enrollment' && (
                <>
                  <EnrollmentChart classes={enrollData?.classes ?? []} maxVisible={8} />
                  {enrollData && (
                    <div style={{ borderTop: '1px solid #b8d0e0', marginTop: 10, paddingTop: 10 }}>
                      <div className="flex gap-8">
                        {[
                          { label: 'TOTAL ENROLLED', value: fmt(enrollData.total.enrolled) },
                          { label: 'CLASSES',         value: String(enrollData.classes.length) },
                          ...(enrollData.total.capacity ? [{ label: 'OCCUPANCY', value: `${((enrollData.total.enrolled / enrollData.total.capacity) * 100).toFixed(1)}%` }] : []),
                        ].map((s) => (
                          <div key={s.label}>
                            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.09em', color: '#4e6a7d', textTransform: 'uppercase' }}>
                              {s.label}
                            </div>
                            <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 17, fontWeight: 600, marginTop: 2, color: '#1e3d4f' }}>
                              {s.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Card>

        {/* Today's Operations */}
        <Card bg="#dde8de" style={{ border: '1px solid #baced0' }}>
          <CardHeader>
            <CardTitle style={{ color: '#1e4030' }}>Today's Operations</CardTitle>
            <span style={{ fontSize: 10.5, color: '#4a7060' }}>
              {today.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </CardHeader>
          {ovLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex justify-between" style={{ padding: '8px 0' }}>
                  <Skeleton height={12} width={110} />
                  <Skeleton height={12} width={40} />
                </div>
              ))}
            </div>
          ) : (
            <TodayOps rows={opsRows} />
          )}
        </Card>

        {/* Today's Agenda */}
        <Card bg="#e6e1ef" style={{ border: '1px solid #ccc5df' }}>
          <CardHeader>
            <CardTitle style={{ color: '#4a3a6a' }}>Today's Agenda</CardTitle>
            <span style={{ fontSize: 10.5, color: '#8d93a2' }}>
              {today.toLocaleDateString('en-IN', { weekday: 'long' })}
            </span>
          </CardHeader>
          <TodayAgenda items={AGENDA} borderColor="#ccc5df" />
        </Card>
      </div>

      {/* ── Row 4: Analytics widgets (4 cols) ────────────────────────────── */}
      <div className="grid" style={{ gridTemplateColumns: '1.1fr 1fr 1fr 1fr', gap: 14 }}>

        {/* Admissions funnel */}
        <Card bg="#dce8f2" style={{ border: '1px solid #aacce0' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <CardTitle style={{ color: '#1a4463' }}>Admissions Pipeline</CardTitle>
            <a href="/admissions" style={{ fontSize: 11.5, fontWeight: 600, color: '#2a6080', textDecoration: 'none' }}>View all</a>
          </div>
          <AdmissionsFunnel
            stages={funnelStages}
            {...(admAnalytics ? { conversionRate: admAnalytics.metrics.conversionRate } : {})}
          />
        </Card>

        {/* Exam Progress (Phase 3 — live) */}
        <Card bg="#d8e9d9" style={{ border: '1px solid #b2ceb6' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <div>
              <CardTitle style={{ color: '#1e5034' }}>Exam Progress</CardTitle>
              {!examLoading && examProgress && (
                <span style={{ fontSize: 10, color: '#5a8a68', marginTop: 2, display: 'block' }}>
                  {examProgress.exams.length} active exam{examProgress.exams.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <a href="/examinations" style={{ fontSize: 11.5, fontWeight: 600, color: '#3a7a57', textDecoration: 'none' }}>View all</a>
          </div>
          {examLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={52} className="rounded-lg" />)}
            </div>
          ) : (
            <ExamProgressWidget
              exams={examProgress?.exams ?? []}
              recentCompleted={examProgress?.recentCompleted ?? 0}
            />
          )}
        </Card>

        {/* Fee aging */}
        <Card bg="#f2ddd0" style={{ border: '1px solid #e0bfaa' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <CardTitle style={{ color: '#7a3018' }}>Fee Overdue Aging</CardTitle>
            <a href="/finance?tab=overdue" style={{ fontSize: 11.5, fontWeight: 600, color: '#9c4e28', textDecoration: 'none' }}>View all</a>
          </div>
          <FeeAging
            buckets={FEE_AGING_BUCKETS}
            totalLabel={financeTotals ? toLakhStr(financeTotals.overdue) : '₹34.2L'}
          />
        </Card>

        {/* Substitution status (Phase 4 — live) */}
        <Card bg="#ebe6f5" style={{ border: '1px solid #cdc2e4' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <div>
              <CardTitle style={{ color: '#3d2a65' }}>Substitutions</CardTitle>
              {!subLoading && subSummary && (
                <span style={{ fontSize: 10, color: '#7a6ea8', marginTop: 2, display: 'block' }}>
                  Today · live
                </span>
              )}
            </div>
            <a href="/substitutions" style={{ fontSize: 11.5, fontWeight: 600, color: '#6b54a8', textDecoration: 'none' }}>Manage</a>
          </div>
          {subLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={28} className="rounded-lg" />)}
            </div>
          ) : (
            <>
              <SubstitutionWidget
                data={{
                  absentTeachers:  subSummary?.kpis.teachersAbsent   ?? 0,
                  affectedPeriods: subSummary?.kpis.affectedPeriods   ?? 0,
                  covered:         subSummary?.kpis.covered           ?? 0,
                  uncovered:       subSummary?.kpis.uncovered         ?? 0,
                  coverageRate:    subSummary?.kpis.coverageRate      ?? 0,
                }}
              />
              {subSummary && (
                <div style={{ marginTop: 12 }}>
                  <CoverageTrendChart weekTrend={subSummary.weekTrend} />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* ── Row 5: Academic Intelligence (Phase 3) ───────────────────────── */}
      <div className="grid" style={{ gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>

        {/* Academic Performance */}
        <Card bg="#eaf0f8" style={{ border: '1px solid #c0d2e8' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <CardTitle style={{ color: '#2a3f5e' }}>Academic Performance</CardTitle>
            <a href="/examinations" style={{ fontSize: 11.5, fontWeight: 600, color: '#3a6b8a', textDecoration: 'none' }}>
              View all
            </a>
          </div>
          {perfLoading ? (
            <div className="flex flex-col gap-2" style={{ marginTop: 10 }}>
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={30} className="rounded-lg" />)}
            </div>
          ) : (
            <AcademicPerformanceChart
              bySubject={academicPerf?.bySubject ?? []}
              byClass={academicPerf?.byClass ?? []}
              latestExamName={academicPerf?.latestExam?.name ?? null}
            />
          )}
        </Card>

        {/* At-Risk Students */}
        <Card bg="#fdf3f0" style={{ border: '1px solid #e8c8c0' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <div>
              <CardTitle style={{ color: '#7a2a1e' }}>At-Risk Students</CardTitle>
              {!riskLoading && atRiskData && atRiskData.summary.total > 0 && (
                <span style={{ fontSize: 10, color: '#b3261e', marginTop: 2, display: 'block', fontWeight: 600 }}>
                  {atRiskData.summary.total} student{atRiskData.summary.total !== 1 ? 's' : ''} need attention
                </span>
              )}
            </div>
            <a href="/students" style={{ fontSize: 11.5, fontWeight: 600, color: '#9c3020', textDecoration: 'none' }}>
              View all
            </a>
          </div>
          {riskLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={38} className="rounded-lg" />)}
            </div>
          ) : (
            <AtRiskWidget
              summary={atRiskData?.summary ?? { lowAttendance: 0, decliningMarks: 0, overduefees: 0, total: 0 }}
              students={atRiskData?.students ?? []}
            />
          )}
        </Card>
      </div>

      {/* ── Row 6: Staff HR + Leave Trends (Phase 4) — hidden for teachers ── */}
      {canSeeHR && <div className="grid" style={{ gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>

        {/* Staff HR Intelligence */}
        <Card bg="#edf3f8" style={{ border: '1px solid #c4d8e8' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <div>
              <CardTitle style={{ color: '#1e3d5a' }}>Staff HR Overview</CardTitle>
              {!hrLoading && staffHR && (staffHR.alerts.probationEnding > 0 || staffHR.alerts.contractsExpiring > 0) && (
                <span style={{ fontSize: 10, color: '#b3261e', marginTop: 2, display: 'block', fontWeight: 600 }}>
                  {staffHR.alerts.probationEnding + staffHR.alerts.contractsExpiring} alert{(staffHR.alerts.probationEnding + staffHR.alerts.contractsExpiring) !== 1 ? 's' : ''} need review
                </span>
              )}
            </div>
            <a href="/teachers" style={{ fontSize: 11.5, fontWeight: 600, color: '#3a6b8a', textDecoration: 'none' }}>
              View all
            </a>
          </div>
          {hrLoading ? (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-4" style={{ gap: 6 }}>
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={52} className="rounded-xl" />)}
              </div>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ marginTop: 8 }}><Skeleton height={24} className="rounded-lg" /></div>)}
            </div>
          ) : staffHR ? (
            <StaffHRWidget data={staffHR} />
          ) : (
            <p style={{ fontSize: 11.5, color: '#8d938d', textAlign: 'center', padding: '20px 0' }}>No HR data</p>
          )}
        </Card>

        {/* Leave Trends */}
        <Card bg="#faf5eb" style={{ border: '1px solid #e4d8b8' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <div>
              <CardTitle style={{ color: '#5a3e10' }}>Leave Trends</CardTitle>
              {!leaveLoading && leaveTrends && leaveTrends.totalPending > 0 && (
                <span style={{ fontSize: 10, color: '#c87d2a', marginTop: 2, display: 'block', fontWeight: 600 }}>
                  {leaveTrends.totalPending} request{leaveTrends.totalPending !== 1 ? 's' : ''} pending
                </span>
              )}
            </div>
            <a href="/attendance?tab=leave" style={{ fontSize: 11.5, fontWeight: 600, color: '#a07020', textDecoration: 'none' }}>
              View all
            </a>
          </div>
          {leaveLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton height={130} className="rounded-lg" />
              {Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ marginTop: 6 }}><Skeleton height={22} className="rounded-lg" /></div>)}
            </div>
          ) : leaveTrends ? (
            <LeaveTrendChart
              monthly={leaveTrends.monthly}
              pendingBreakdown={leaveTrends.pendingBreakdown}
              totalPending={leaveTrends.totalPending}
              totalApprovedThisMonth={leaveTrends.totalApprovedThisMonth}
            />
          ) : (
            <p style={{ fontSize: 11.5, color: '#8d938d', textAlign: 'center', padding: '20px 0' }}>No leave data</p>
          )}
        </Card>
      </div>}

      {/* ── Row 7: Targets + Payroll (Phase 5) ───────────────────────────── */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1.3fr', gap: 14 }}>

        {/* Goals & Targets */}
        <Card bg="#eef5ee" style={{ border: '1px solid #c0dac0' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <div>
              <CardTitle style={{ color: '#1e4a1e' }}>Goals & Targets</CardTitle>
              <span style={{ fontSize: 10, color: '#5a8a5a', marginTop: 2, display: 'block' }}>
                Click target badge to edit
              </span>
            </div>
          </div>
          {targetsLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={52} className="rounded-lg" />)}
            </div>
          ) : (
            <TargetsWidget
              metrics={targetMetrics}
              onEditTarget={handleTargetEdit}
            />
          )}
        </Card>

        {/* Payroll Summary */}
        {canSeePayroll && (
          <Card bg="#edf3f8" style={{ border: '1px solid #c0d4e8' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <div>
                <CardTitle style={{ color: '#1a3a5c' }}>Payroll Cost</CardTitle>
                {!payrollLoading && payrollData && (
                  <span style={{ fontSize: 10, color: '#4a6a8a', marginTop: 2, display: 'block' }}>
                    FY {payrollData.financialYear}
                  </span>
                )}
              </div>
              <a href="/payroll" style={{ fontSize: 11.5, fontWeight: 600, color: '#3a6b8a', textDecoration: 'none' }}>
                View all
              </a>
            </div>
            {payrollLoading ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-3" style={{ gap: 6 }}>
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={44} className="rounded-xl" />)}
                </div>
                <Skeleton height={140} className="rounded-lg" />
              </div>
            ) : payrollData ? (
              <PayrollTrendChart
                monthly={payrollData.monthly}
                totalGross={payrollData.totalGross}
                totalNet={payrollData.totalNet}
                financialYear={payrollData.financialYear}
              />
            ) : (
              <p style={{ fontSize: 11.5, color: '#8d938d', textAlign: 'center', padding: '20px 0' }}>
                No payroll data for current financial year
              </p>
            )}
          </Card>
        )}
      </div>

      {/* ── Row 8: Recent Activity ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex gap-2" style={{ fontSize: 11, color: '#8d938d' }}>
              {['All', 'Finance', 'HR', 'Academic'].map((f) => (
                <span
                  key={f}
                  style={{
                    padding: '2px 9px', borderRadius: 20,
                    background: f === 'All' ? '#d8e9dc' : 'transparent',
                    color: f === 'All' ? '#2e7a52' : '#8d938d',
                    fontWeight: f === 'All' ? 700 : 400,
                    cursor: 'pointer',
                    border: `1px solid ${f === 'All' ? '#bfd4c4' : 'transparent'}`,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#5d7f6b', fontWeight: 600, cursor: 'pointer' }}>View all</span>
          </div>
        </CardHeader>
        <div className="grid grid-cols-2" style={{ gap: '0 32px' }}>
          {ACTIVITY.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3"
              style={{
                padding: '10px 0',
                borderBottom: i < ACTIVITY.length - 2 ? '1px solid #efece2' : 'none',
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: item.color, flexShrink: 0, marginTop: 5,
              }} />
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: 12.5, color: '#2c322f', lineHeight: 1.4 }}>{item.text}</p>
                <p style={{ fontSize: 10.5, color: '#a9aca4', marginTop: 2 }}>{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
