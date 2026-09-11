import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { StudentStats } from './use-students';
import type { EmployeeStats } from './use-teachers';
import type { AttendanceOverview } from './use-attendance';
import type { AdmissionStats } from './use-admissions';

// ─── Overview types ───────────────────────────────────────────────────────────

export interface DashboardActions {
  admissionsPending: number;
  leaveRequestsPending: number;
}

export interface DashboardOverview {
  students: StudentStats;
  staff: EmployeeStats;
  attendance: AttendanceOverview;
  admissions: AdmissionStats;
  actions: DashboardActions;
}

// ─── Attendance trend types ───────────────────────────────────────────────────

export interface AttendanceTrendMonth {
  month: string;    // "Apr"
  year: number;
  label: string;    // "Apr 2026"
  students: number; // rate 0–100
  staff: number;    // rate 0–100
}

export interface DashboardAttendanceTrend {
  months: AttendanceTrendMonth[];
}

// ─── Finance summary types ────────────────────────────────────────────────────

export interface FinanceSummaryMonth {
  label: string;    // "Apr"
  year: number;
  collected: number; // raw ₹ amount
}

export interface FinanceSummaryTotals {
  billed: number;
  collected: number;
  outstanding: number;
  overdue: number;
  collectionRate: number; // 0–100
}

export interface DashboardFinanceSummary {
  monthly: FinanceSummaryMonth[];
  totals: FinanceSummaryTotals;
}

// ─── Enrollment types ─────────────────────────────────────────────────────────

export interface EnrollmentClass {
  id: string;
  name: string;
  level: number;
  enrolled: number;
  capacity: number | null;
  occupancy: number | null; // % 0–100
  sections: number;
}

export interface DashboardEnrollment {
  classes: EnrollmentClass[];
  total: { enrolled: number; capacity: number | null };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useDashboardOverview() {
  return useQuery<DashboardOverview>({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => apiClient.get<DashboardOverview>('/dashboard/overview'),
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
  });
}

export function useDashboardAttendanceTrend(months = 6) {
  return useQuery<DashboardAttendanceTrend>({
    queryKey: ['dashboard', 'attendance-trend', months],
    queryFn: () =>
      apiClient.get<DashboardAttendanceTrend>(`/dashboard/attendance-trend?months=${months}`),
    staleTime: 300_000,
    retry: 1,
  });
}

export function useDashboardFinanceSummary(months = 6) {
  return useQuery<DashboardFinanceSummary>({
    queryKey: ['dashboard', 'finance-summary', months],
    queryFn: () =>
      apiClient.get<DashboardFinanceSummary>(`/dashboard/finance-summary?months=${months}`),
    staleTime: 120_000,
    retry: 1,
  });
}

export function useDashboardEnrollment() {
  return useQuery<DashboardEnrollment>({
    queryKey: ['dashboard', 'enrollment'],
    queryFn: () => apiClient.get<DashboardEnrollment>('/dashboard/enrollment'),
    staleTime: 600_000,
    retry: 1,
  });
}

// ─── Exam Progress types ──────────────────────────────────────────────────────

export interface ExamProgressItem {
  id: string;
  name: string;
  type: string | null;
  status: 'SCHEDULED' | 'ONGOING';
  startDate: string;
  endDate: string | null;
  totalSubjects: number;
  marksEntered: number;
  pendingVerifications: number;
  completionPct: number;
}

export interface DashboardExamProgress {
  exams: ExamProgressItem[];
  recentCompleted: number;
}

// ─── Academic Performance types ───────────────────────────────────────────────

export interface SubjectPerformance {
  subject: string;
  avgScore: number;
  studentCount: number;
}

export interface ClassPerformance {
  class: string;
  avgScore: number;
  passRate: number;
  studentCount: number;
}

export interface DashboardAcademicPerformance {
  bySubject: SubjectPerformance[];
  byClass: ClassPerformance[];
  latestExam: { id: string; name: string } | null;
  previousExam: { id: string; name: string } | null;
}

// ─── At-Risk types ────────────────────────────────────────────────────────────

export interface AtRiskStudent {
  id: string;
  name: string;
  class: string | null;
  flags: ('attendance' | 'marks' | 'fees')[];
  attendanceRate: number | null;
  overdueAmount: number | null;
}

export interface AtRiskSummary {
  lowAttendance: number;
  decliningMarks: number;
  overduefees: number;
  total: number;
}

export interface DashboardAtRisk {
  summary: AtRiskSummary;
  students: AtRiskStudent[];
}

// ─── Phase 3 hooks ────────────────────────────────────────────────────────────

export function useDashboardExamProgress() {
  return useQuery<DashboardExamProgress>({
    queryKey: ['dashboard', 'exam-progress'],
    queryFn: () => apiClient.get<DashboardExamProgress>('/dashboard/exam-progress'),
    staleTime: 180_000,
    retry: 1,
  });
}

export function useDashboardAcademicPerformance() {
  return useQuery<DashboardAcademicPerformance>({
    queryKey: ['dashboard', 'academic-performance'],
    queryFn: () =>
      apiClient.get<DashboardAcademicPerformance>('/dashboard/academic-performance'),
    staleTime: 600_000,
    retry: 1,
  });
}

export function useDashboardAtRisk() {
  return useQuery<DashboardAtRisk>({
    queryKey: ['dashboard', 'at-risk'],
    queryFn: () => apiClient.get<DashboardAtRisk>('/dashboard/at-risk'),
    staleTime: 300_000,
    retry: 1,
  });
}

// ─── Substitution Summary types ───────────────────────────────────────────────

export interface SubstitutionKpis {
  pendingCoverage: number;
  todayRequired: number;
  covered: number;
  uncovered: number;
  coverageRate: number;
  autoAssigned: number;
  manualAssigned: number;
  awaitingConfirmation: number;
  teachersAbsent: number;
  affectedPeriods: number;
}

export interface CoverageDayPoint {
  date: string;
  coverageRate: number | null;
  covered: number;
  total: number;
}

export interface DashboardSubstitutionSummary {
  kpis: SubstitutionKpis;
  weekTrend: CoverageDayPoint[];
}

// ─── Staff HR types ───────────────────────────────────────────────────────────

export interface DeptCount {
  name: string;
  count: number;
}

export interface TypeCount {
  type: string;
  count: number;
}

export interface JoiningMonth {
  label: string;
  count: number;
}

export interface DashboardStaffHR {
  headline: {
    total: number;
    active: number;
    onLeave: number;
    probation: number;
    teachers: number;
    nonTeaching: number;
    newJoiners: number;
    probationEnding: number;
    contractsExpiring: number;
    presentToday: number;
    absentToday: number;
  };
  byDepartment: DeptCount[];
  byType: TypeCount[];
  joiningTrend: JoiningMonth[];
  alerts: { probationEnding: number; contractsExpiring: number };
}

// ─── Leave Trends types ───────────────────────────────────────────────────────

export interface LeaveMonth {
  label: string;
  year: number;
  approved: number;
  pending: number;
  totalDays: number;
}

export interface LeaveTypeBreakdown {
  type: string;
  count: number;
  days: number;
}

export interface DashboardLeaveTrends {
  monthly: LeaveMonth[];
  pendingBreakdown: LeaveTypeBreakdown[];
  totalPending: number;
  totalApprovedThisMonth: number;
}

// ─── Phase 4 hooks ────────────────────────────────────────────────────────────

export function useDashboardSubstitutionSummary() {
  return useQuery<DashboardSubstitutionSummary>({
    queryKey: ['dashboard', 'substitution-summary'],
    queryFn: () =>
      apiClient.get<DashboardSubstitutionSummary>('/dashboard/substitution-summary'),
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
  });
}

export function useDashboardStaffHR() {
  return useQuery<DashboardStaffHR>({
    queryKey: ['dashboard', 'staff-hr'],
    queryFn: () => apiClient.get<DashboardStaffHR>('/dashboard/staff-hr'),
    staleTime: 300_000,
    retry: 1,
  });
}

export function useDashboardLeaveTrends(months = 6) {
  return useQuery<DashboardLeaveTrends>({
    queryKey: ['dashboard', 'leave-trends', months],
    queryFn: () =>
      apiClient.get<DashboardLeaveTrends>(`/dashboard/leave-trends?months=${months}`),
    staleTime: 180_000,
    retry: 1,
  });
}

// ─── YoY types ────────────────────────────────────────────────────────────────

export interface YoYMetric {
  key: string;
  label: string;
  unit: string;
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number | null;
}

export interface DashboardYoY {
  currentYear:  { id: string; name: string } | null;
  previousYear: { id: string; name: string } | null;
  metrics: YoYMetric[];
}

// ─── Targets types ────────────────────────────────────────────────────────────

export interface TargetEntry {
  key: string;
  target: number;
  isCustom: boolean;
}

export interface DashboardTargets {
  targets: TargetEntry[];
}

// ─── Payroll Summary types ────────────────────────────────────────────────────

export interface PayrollMonth {
  period: string;   // "YYYY-MM"
  label: string;    // "Apr"
  headcount: number;
  gross: number;
  net: number;
  tds: number;
}

export interface DashboardPayrollSummary {
  financialYear: string;
  monthly: PayrollMonth[];
  totalGross: number;
  totalNet: number;
  latestRun: PayrollMonth | null;
}

// ─── Phase 5 hooks ────────────────────────────────────────────────────────────

export function useDashboardYoY() {
  return useQuery<DashboardYoY>({
    queryKey: ['dashboard', 'yoy'],
    queryFn: () => apiClient.get<DashboardYoY>('/dashboard/yoy'),
    staleTime: 600_000,
    retry: 1,
  });
}

export function useDashboardTargets() {
  return useQuery<DashboardTargets>({
    queryKey: ['dashboard', 'targets'],
    queryFn: () => apiClient.get<DashboardTargets>('/dashboard/targets'),
    staleTime: 300_000,
    retry: 1,
  });
}

export function useDashboardPayrollSummary() {
  return useQuery<DashboardPayrollSummary>({
    queryKey: ['dashboard', 'payroll-summary'],
    queryFn: () => apiClient.get<DashboardPayrollSummary>('/dashboard/payroll-summary'),
    staleTime: 300_000,
    retry: 1,
  });
}
