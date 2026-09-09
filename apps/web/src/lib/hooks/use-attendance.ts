import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AttendanceOverview {
  date: string;
  students: {
    total: number;
    marked: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    excused: number;
    rate: number;
  };
  staff: {
    total: number;
    marked: number;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    wfh: number;
    halfDay: number;
    rate: number;
  };
  alerts: { pendingLeaveRequests: number };
}

export interface RosterEntry {
  enrollmentId: string;
  studentId: string;
  rollNumber: string | null;
  student: {
    id: string;
    person: { firstName: string; lastName: string; gender: string | null };
  };
  attendance: {
    id: string;
    status: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    remarks: string | null;
  } | null;
}

export interface LeaveType {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  applicableTo: string;
  annualLimit: number | null;
  isPaid: boolean;
  carryForward: boolean;
  status: string;
}

export interface LeaveRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  employee: {
    id: string;
    employeeNumber: string;
    person: { firstName: string; lastName: string };
  };
  leaveType: { id: string; name: string; code: string };
}

export interface LeaveBalance {
  leaveTypeId: string;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
  leaveType: {
    id: string;
    name: string;
    code: string;
    isPaid: boolean;
    annualLimit: number | null;
  };
}

export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  enrollmentId: string | null;
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  remarks: string | null;
  markedBy: string | null;
  createdAt: string;
  student: { id: string; person: { firstName: string; lastName: string } };
}

export interface EmployeeAttendanceRecord {
  id: string;
  employeeId: string;
  campusId: string;
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workHours: number | null;
  remarks: string | null;
  markedBy: string | null;
  employee: {
    id: string;
    employeeNumber: string;
    person: { firstName: string; lastName: string };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toQS(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');
}

// ─── Query Hooks ──────────────────────────────────────────────────────────────

export function useAttendanceOverview(campusId?: string, date?: string) {
  return useQuery<AttendanceOverview>({
    queryKey: ['attendance', 'overview', campusId, date],
    queryFn: () =>
      apiClient.get<AttendanceOverview>(
        `/attendance/overview${toQS({ ...(campusId ? { campusId } : {}), ...(date ? { date } : {}) })}`,
      ),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useAttendanceRoster(sectionId?: string, academicYearId?: string, date?: string) {
  return useQuery<RosterEntry[]>({
    queryKey: ['attendance', 'roster', sectionId, academicYearId, date],
    queryFn: () =>
      apiClient.get<RosterEntry[]>(
        `/attendance/roster${toQS({
          sectionId: sectionId!,
          academicYearId: academicYearId!,
          ...(date ? { date } : {}),
        })}`,
      ),
    enabled: !!sectionId && !!academicYearId,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useLeaveTypes() {
  return useQuery<LeaveType[]>({
    queryKey: ['attendance', 'leave-types'],
    queryFn: () => apiClient.get<LeaveType[]>('/attendance/leave-types'),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useLeaveRequests(filters?: { employeeId?: string; status?: string }) {
  const qs = toQS({
    ...(filters?.employeeId ? { employeeId: filters.employeeId } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
  });
  return useQuery<LeaveRequest[]>({
    queryKey: ['attendance', 'leave-requests', filters],
    queryFn: () => apiClient.get<LeaveRequest[]>(`/attendance/leave-requests${qs}`),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useLeaveBalances(employeeId?: string, academicYearId?: string) {
  return useQuery<LeaveBalance[]>({
    queryKey: ['attendance', 'leave-balances', employeeId, academicYearId],
    queryFn: () =>
      apiClient.get<LeaveBalance[]>(
        `/attendance/leave-balances${toQS({
          employeeId: employeeId!,
          ...(academicYearId ? { academicYearId } : {}),
        })}`,
      ),
    enabled: !!employeeId,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useStudentAttendance(filters: {
  studentId?: string;
  date?: string;
  from?: string;
  to?: string;
}) {
  return useQuery<StudentAttendanceRecord[]>({
    queryKey: ['attendance', 'students', filters],
    queryFn: () =>
      apiClient.get<StudentAttendanceRecord[]>(
        `/attendance/students${toQS({
          ...(filters.studentId ? { studentId: filters.studentId } : {}),
          ...(filters.date ? { date: filters.date } : {}),
          ...(filters.from ? { from: filters.from } : {}),
          ...(filters.to ? { to: filters.to } : {}),
        })}`,
      ),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useEmployeeAttendanceList(filters: {
  campusId?: string;
  date?: string;
  from?: string;
  to?: string;
}) {
  return useQuery<EmployeeAttendanceRecord[]>({
    queryKey: ['attendance', 'employees', filters],
    queryFn: () =>
      apiClient.get<EmployeeAttendanceRecord[]>(
        `/attendance/employees${toQS({
          ...(filters.campusId ? { campusId: filters.campusId } : {}),
          ...(filters.date ? { date: filters.date } : {}),
          ...(filters.from ? { from: filters.from } : {}),
          ...(filters.to ? { to: filters.to } : {}),
        })}`,
      ),
    staleTime: 30_000,
    retry: 1,
  });
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

export function useMarkStudentAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      date: string;
      entries: Array<{
        studentId: string;
        enrollmentId: string;
        status: string;
        remarks?: string;
        checkInTime?: string;
        checkOutTime?: string;
      }>;
    }) => apiClient.post('/attendance/students', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'students'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'roster'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'overview'] });
    },
  });
}

export function useMarkEmployeeAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      employeeId: string;
      campusId: string;
      date: string;
      status: string;
      checkInTime?: string;
      checkOutTime?: string;
      workHours?: number;
      remarks?: string;
    }) => apiClient.post('/attendance/employees', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'employees'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'overview'] });
    },
  });
}

export function useUpdateStudentAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<{ status: string; checkInTime: string; checkOutTime: string; remarks: string }>;
    }) => apiClient.patch(`/attendance/students/${id}`, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'students'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'roster'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'overview'] });
    },
  });
}

export function useUpdateEmployeeAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<{
        status: string;
        checkInTime: string;
        checkOutTime: string;
        workHours: number;
        remarks: string;
      }>;
    }) => apiClient.patch(`/attendance/employees/${id}`, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'employees'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'overview'] });
    },
  });
}

export function useApproveLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiClient.post(`/attendance/leave-requests/${id}/approve`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-requests'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'overview'] });
      void qc.invalidateQueries({ queryKey: ['leave', 'overview'] });
    },
  });
}

export function useRejectLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason?: string }) =>
      apiClient.post(`/attendance/leave-requests/${id}/reject`, {
        ...(rejectionReason !== undefined ? { rejectionReason } : {}),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-requests'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'overview'] });
      void qc.invalidateQueries({ queryKey: ['leave', 'overview'] });
    },
  });
}

export function useCancelLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) =>
      apiClient.post(`/attendance/leave-requests/${id}/cancel?employeeId=${employeeId}`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-requests'] });
    },
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      dto,
    }: {
      employeeId: string;
      dto: {
        leaveTypeId: string;
        startDate: string;
        endDate: string;
        totalDays: number;
        reason?: string;
      };
    }) => apiClient.post(`/attendance/leave-requests/${employeeId}`, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-requests'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-balances'] });
    },
  });
}

export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      name: string;
      code: string;
      applicableTo: string;
      annualLimit?: number;
      isPaid?: boolean;
      carryForward?: boolean;
    }) => apiClient.post('/attendance/leave-types', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-types'] });
    },
  });
}

export function useUpdateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<{
        name: string;
        code: string;
        applicableTo: string;
        annualLimit: number | null;
        isPaid: boolean;
        carryForward: boolean;
        status: string;
      }>;
    }) => apiClient.patch(`/attendance/leave-types/${id}`, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-types'] });
    },
  });
}

export function useDeleteLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/attendance/leave-types/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-types'] });
    },
  });
}

// ─── Phase 2 Types ────────────────────────────────────────────────────────────

export interface AttendanceSession {
  id: string;
  organizationId: string;
  campusId: string;
  sectionId: string;
  academicYearId: string;
  date: string;
  status: string;
  submittedAt: string | null;
  submittedBy: string | null;
  lockedAt: string | null;
  lockedBy: string | null;
  createdBy: string;
  createdAt: string;
  section?: { id: string; name: string; academicClass: { id: string; name: string } };
}

export interface AttendanceCorrection {
  id: string;
  organizationId: string;
  sessionId: string | null;
  attendanceId: string;
  attendanceType: string;
  originalStatus: string;
  requestedStatus: string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface StudentHistorySummary {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  excused: number;
  rate: number;
}

export interface StudentHistoryRecord {
  id: string;
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  remarks: string | null;
}

export interface StudentHistory {
  records: StudentHistoryRecord[];
  summary: StudentHistorySummary;
  month: number;
  year: number;
}

export interface SectionStudentSummary {
  studentId: string;
  enrollmentId: string;
  rollNumber: string | null;
  student: { id: string; person: { firstName: string; lastName: string } };
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  excused: number;
  totalDays: number;
  rate: number;
}

export interface ClassSectionSummary {
  sectionId: string;
  sectionName: string;
  className: string;
  level: number | null;
  studentCount: number;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

export interface AttendanceTrend {
  month: number;
  year: number;
  label: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

// ─── Session Hooks ────────────────────────────────────────────────────────────

export function useAttendanceSessions(filters?: {
  sectionId?: string;
  date?: string;
  status?: string;
  from?: string;
  to?: string;
}) {
  const qs = toQS({
    ...(filters?.sectionId ? { sectionId: filters.sectionId } : {}),
    ...(filters?.date ? { date: filters.date } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.from ? { from: filters.from } : {}),
    ...(filters?.to ? { to: filters.to } : {}),
  });
  return useQuery<AttendanceSession[]>({
    queryKey: ['attendance', 'sessions', filters],
    queryFn: () => apiClient.get<AttendanceSession[]>(`/attendance/sessions${qs}`),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAttendanceSession(id: string | null) {
  return useQuery<AttendanceSession>({
    queryKey: ['attendance', 'sessions', id],
    queryFn: () => apiClient.get<AttendanceSession>(`/attendance/sessions/${id}`),
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      campusId: string;
      sectionId: string;
      academicYearId: string;
      date: string;
    }) => apiClient.post<AttendanceSession>('/attendance/sessions', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'sessions'] });
    },
  });
}

export function useSubmitSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<AttendanceSession>(`/attendance/sessions/${id}/submit`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'sessions'] });
    },
  });
}

export function useLockSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<AttendanceSession>(`/attendance/sessions/${id}/lock`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'sessions'] });
    },
  });
}

// ─── Correction Hooks ─────────────────────────────────────────────────────────

export function useAttendanceCorrections(filters?: {
  status?: string;
  attendanceType?: string;
  sessionId?: string;
}) {
  const qs = toQS({
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.attendanceType ? { attendanceType: filters.attendanceType } : {}),
    ...(filters?.sessionId ? { sessionId: filters.sessionId } : {}),
  });
  return useQuery<AttendanceCorrection[]>({
    queryKey: ['attendance', 'corrections', filters],
    queryFn: () => apiClient.get<AttendanceCorrection[]>(`/attendance/corrections${qs}`),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCreateCorrection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      attendanceId: string;
      attendanceType: string;
      originalStatus: string;
      requestedStatus: string;
      reason: string;
      sessionId?: string;
    }) => apiClient.post<AttendanceCorrection>('/attendance/corrections', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'corrections'] });
    },
  });
}

export function useApproveCorrection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<AttendanceCorrection>(`/attendance/corrections/${id}/approve`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'corrections'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'students'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'employees'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'overview'] });
    },
  });
}

export function useRejectCorrection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason?: string }) =>
      apiClient.post<AttendanceCorrection>(`/attendance/corrections/${id}/reject`, {
        ...(rejectionReason !== undefined ? { rejectionReason } : {}),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'corrections'] });
    },
  });
}

// ─── Analytics Hooks ──────────────────────────────────────────────────────────

export function useStudentHistory(studentId: string | null, year: number, month: number) {
  return useQuery<StudentHistory>({
    queryKey: ['attendance', 'analytics', 'student', studentId, year, month],
    queryFn: () =>
      apiClient.get<StudentHistory>(
        `/attendance/analytics/student/${studentId}${toQS({ year: String(year), month: String(month) })}`,
      ),
    enabled: !!studentId && year > 0 && month > 0,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useSectionAttendanceSummary(
  sectionId: string | null,
  academicYearId: string | null,
  from?: string,
  to?: string,
) {
  return useQuery<SectionStudentSummary[]>({
    queryKey: ['attendance', 'analytics', 'section', sectionId, academicYearId, from, to],
    queryFn: () =>
      apiClient.get<SectionStudentSummary[]>(
        `/attendance/analytics/sections/${sectionId}${toQS({
          academicYearId: academicYearId!,
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        })}`,
      ),
    enabled: !!sectionId && !!academicYearId,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useClassAttendanceSummaries(academicYearId: string | null, campusId?: string) {
  return useQuery<ClassSectionSummary[]>({
    queryKey: ['attendance', 'analytics', 'classes', academicYearId, campusId],
    queryFn: () =>
      apiClient.get<ClassSectionSummary[]>(
        `/attendance/analytics/classes${toQS({
          academicYearId: academicYearId!,
          ...(campusId ? { campusId } : {}),
        })}`,
      ),
    enabled: !!academicYearId,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useAttendanceTrends(campusId?: string, months?: number) {
  return useQuery<AttendanceTrend[]>({
    queryKey: ['attendance', 'analytics', 'trends', campusId, months],
    queryFn: () =>
      apiClient.get<AttendanceTrend[]>(
        `/attendance/analytics/trends${toQS({
          ...(campusId ? { campusId } : {}),
          ...(months !== undefined ? { months: String(months) } : {}),
        })}`,
      ),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

// ─── Phase 3 Types ────────────────────────────────────────────────────────────

export interface StudentHealthAlert {
  studentId: string;
  studentName: string;
  rate?: number;
  count?: number;
  lastDate?: string;
}

export interface StaffHealthAlert {
  employeeId: string;
  employeeName: string;
  date?: string;
  workHours?: number;
}

export interface HealthAlerts {
  belowThreshold: StudentHealthAlert[];
  consecutiveAbsent: StudentHealthAlert[];
  frequentLate: StudentHealthAlert[];
}

export interface StaffHealthAlerts {
  missingCheckout: StaffHealthAlert[];
  consecutiveAbsent: StaffHealthAlert[];
  belowHours: StaffHealthAlert[];
}

// ─── Phase 3 Hooks ────────────────────────────────────────────────────────────

export function useStudentHealthAlerts(campusId?: string, academicYearId?: string) {
  return useQuery<HealthAlerts>({
    queryKey: ['attendance', 'health', 'students', campusId, academicYearId],
    queryFn: () =>
      apiClient.get<HealthAlerts>(
        `/attendance/health/students${toQS({
          ...(campusId ? { campusId } : {}),
          ...(academicYearId ? { academicYearId } : {}),
        })}`,
      ),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useStaffHealthAlerts(campusId?: string, date?: string) {
  return useQuery<StaffHealthAlerts>({
    queryKey: ['attendance', 'health', 'staff', campusId, date],
    queryFn: () =>
      apiClient.get<StaffHealthAlerts>(
        `/attendance/health/staff${toQS({
          ...(campusId ? { campusId } : {}),
          ...(date ? { date } : {}),
        })}`,
      ),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useAllocateLeaveBalances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { academicYearId: string; leaveTypeId?: string; resetExisting?: boolean }) =>
      apiClient.post<{ count: number }>('/attendance/leave-balances/allocate', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-balances'] });
    },
  });
}

// ─── Leave Overview (HR Dashboard) ────────────────────────────────────────────

export interface LeaveOverviewAbsence {
  employeeId: string;
  name: string;
  leaveType: string;
  isPaid: boolean;
  startDate: string;
  endDate: string;
  totalDays: number;
}

export interface LeaveOverviewPending {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  leaveType: string;
  isPaid: boolean;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  createdAt: string;
}

export interface LeaveOverview {
  date: string;
  kpis: {
    onLeaveToday: number;
    pendingRequests: number;
    approvedThisMonth: number;
    rejectedThisMonth: number;
  };
  todaysAbsences: LeaveOverviewAbsence[];
  pendingApprovals: LeaveOverviewPending[];
}

export function useLeaveOverview(date?: string) {
  return useQuery<LeaveOverview>({
    queryKey: ['leave', 'overview', date],
    queryFn: () =>
      apiClient.get<LeaveOverview>(
        `/attendance/leave/overview${toQS({ ...(date ? { date } : {}) })}`,
      ),
    staleTime: 30_000,
    retry: 1,
  });
}

// ─── Phase 2: Bulk Actions & Team Availability ────────────────────────────────

export interface TeamAvailabilityDay {
  date: string;
  onLeave: Array<{ employeeId: string; name: string; leaveType: string; isPaid: boolean }>;
}

export interface TeamAvailability {
  from: string;
  to: string;
  employees: Array<{ id: string; name: string }>;
  days: TeamAvailabilityDay[];
}

export function useTeamAvailability(from?: string, to?: string) {
  return useQuery<TeamAvailability>({
    queryKey: ['leave', 'team-availability', from, to],
    queryFn: () =>
      apiClient.get<TeamAvailability>(
        `/attendance/leave/team-availability${toQS({ from: from!, to: to! })}`,
      ),
    enabled: !!from && !!to,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useBulkApproveLeaveRequests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiClient.post<{ approved: number; failed: Array<{ id: string; reason: string }> }>(
        '/attendance/leave-requests/bulk-approve',
        { ids },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-requests'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'overview'] });
      void qc.invalidateQueries({ queryKey: ['leave', 'overview'] });
    },
  });
}

export function useBulkRejectLeaveRequests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, rejectionReason }: { ids: string[]; rejectionReason?: string }) =>
      apiClient.post<{ rejected: number; failed: Array<{ id: string; reason: string }> }>(
        '/attendance/leave-requests/bulk-reject',
        { ids, ...(rejectionReason ? { rejectionReason } : {}) },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-requests'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'overview'] });
      void qc.invalidateQueries({ queryKey: ['leave', 'overview'] });
    },
  });
}

export function useCancelApprovedLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/attendance/leave-requests/${id}/cancel-approved`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-requests'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-balances'] });
      void qc.invalidateQueries({ queryKey: ['leave', 'overview'] });
    },
  });
}

// ─── Leave Balance Ledger ─────────────────────────────────────

export interface LeaveBalanceLedgerEntry {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  academicYearId: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  source: 'ALLOCATION' | 'USED' | 'CANCELLED' | 'ADJUSTMENT' | 'CARRY_FORWARD' | 'ENCASHMENT';
  referenceId: string | null;
  createdBy: string;
  createdAt: string;
  leaveType: { name: string; code: string };
}

export function useLeaveBalanceLedger(
  employeeId?: string,
  leaveTypeId?: string,
  academicYearId?: string,
) {
  return useQuery({
    queryKey: ['leave', 'balance-ledger', employeeId, leaveTypeId, academicYearId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (employeeId) params.set('employeeId', employeeId);
      if (leaveTypeId) params.set('leaveTypeId', leaveTypeId);
      if (academicYearId) params.set('academicYearId', academicYearId);
      return apiClient.get<LeaveBalanceLedgerEntry[]>(
        `/attendance/leave-balances/ledger?${params.toString()}`,
      );
    },
    enabled: !!employeeId,
  });
}

// ─── Leave Adjustments ────────────────────────────────────────

export interface LeaveAdjustment {
  id: string;
  organizationId: string;
  employeeId: string;
  leaveTypeId: string;
  academicYearId: string;
  delta: number;
  reason: string;
  adjustedBy: string;
  createdAt: string;
  leaveType: { name: string; code: string };
}

export interface CreateLeaveAdjustmentPayload {
  employeeId: string;
  leaveTypeId: string;
  academicYearId: string;
  delta: number;
  reason: string;
}

export function useLeaveAdjustments(
  employeeId?: string,
  leaveTypeId?: string,
  academicYearId?: string,
) {
  return useQuery({
    queryKey: ['leave', 'adjustments', employeeId, leaveTypeId, academicYearId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (employeeId) params.set('employeeId', employeeId);
      if (leaveTypeId) params.set('leaveTypeId', leaveTypeId);
      if (academicYearId) params.set('academicYearId', academicYearId);
      return apiClient.get<LeaveAdjustment[]>(`/attendance/leave-adjustments?${params.toString()}`);
    },
  });
}

export function useCreateLeaveAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeaveAdjustmentPayload) =>
      apiClient.post<LeaveAdjustment>('/attendance/leave-adjustments', payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leave', 'adjustments'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-balances'] });
      void qc.invalidateQueries({ queryKey: ['leave', 'balance-ledger'] });
    },
  });
}

// ─── Leave Encashment ─────────────────────────────────────────

export interface LeaveEncashment {
  id: string;
  organizationId: string;
  employeeId: string;
  leaveTypeId: string;
  academicYearId: string;
  days: number;
  amountPerDay: string;
  totalAmount: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  leaveType: { name: string; code: string };
}

export interface SubmitEncashmentPayload {
  leaveTypeId: string;
  academicYearId: string;
  days: number;
  amountPerDay: number;
}

export function useLeaveEncashments(employeeId?: string, status?: string) {
  return useQuery({
    queryKey: ['leave', 'encashments', employeeId, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (employeeId) params.set('employeeId', employeeId);
      if (status) params.set('status', status);
      return apiClient.get<LeaveEncashment[]>(`/attendance/leave-encashments?${params.toString()}`);
    },
  });
}

export function useSubmitLeaveEncashment(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitEncashmentPayload) =>
      apiClient.post<LeaveEncashment>(`/attendance/leave-encashments/${employeeId}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leave', 'encashments'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'leave-balances'] });
    },
  });
}

export function useApproveLeaveEncashment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<LeaveEncashment>(`/attendance/leave-encashments/${id}/approve`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leave', 'encashments'] });
    },
  });
}

export function useRejectLeaveEncashment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post<LeaveEncashment>(`/attendance/leave-encashments/${id}/reject`, { reason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leave', 'encashments'] });
    },
  });
}
