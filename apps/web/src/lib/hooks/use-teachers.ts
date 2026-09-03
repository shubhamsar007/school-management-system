import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmployeeStats {
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
}

export interface Employee {
  id: string;
  employeeNumber: string;
  joiningDate: string;
  leavingDate?: string;
  leavingReason?: string;
  employmentStatus: string;
  employmentType?: string;
  probationStart?: string;
  probationEnd?: string;
  confirmationDate?: string;
  contractStart?: string;
  contractEnd?: string;
  workLocation?: string;
  noticePeriodDays?: number;
  name: string;
  person: {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email?: string;
    phone?: string;
    alternatePhone?: string;
    gender?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    nationality?: string;
  };
  department?: { id: string; name: string; code?: string };
  designation?: { id: string; name: string };
  campus?: { id: string; name: string };
  employeeType?: { id: string; name: string; category: string };
  reportingManager?: { id: string; name: string } | null;
  teacherAssignments?: {
    id: string;
    isClassTeacher: boolean;
    startDate: string;
    endDate?: string;
    status: string;
    academicYear: { id: string; name: string };
    class: { id: string; name: string };
    section: { id: string; name: string };
    subject: { id: string; name: string };
  }[];
}

export interface TeacherListParams {
  search?: string;
  departmentId?: string;
  designationId?: string;
  employeeTypeId?: string;
  status?: string;
  campusId?: string;
  employmentType?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface TeacherListResponse {
  data: Employee[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EmployeeDepartment {
  id: string;
  name: string;
  code?: string;
  description?: string;
  employeeCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '' && v !== 'all',
  );
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useTeacherStats() {
  return useQuery<EmployeeStats>({
    queryKey: ['teachers', 'stats'],
    queryFn: () => apiClient.get<EmployeeStats>('/teachers/stats'),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useTeachers(params: TeacherListParams = {}) {
  const qs = toQueryString(params as Record<string, string | number | undefined>);
  return useQuery<TeacherListResponse>({
    queryKey: ['teachers', 'list', params],
    queryFn: () => apiClient.get<TeacherListResponse>(`/teachers${qs}`),
    staleTime: 30_000,
    retry: 1,
    placeholderData: (prev) => prev,
  });
}

export function useTeacher(id: string | null) {
  return useQuery<Employee>({
    queryKey: ['teachers', id],
    queryFn: () => apiClient.get<Employee>(`/teachers/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useEmployeeDepartments() {
  return useQuery<EmployeeDepartment[]>({
    queryKey: ['teachers', 'departments'],
    queryFn: () => apiClient.get<EmployeeDepartment[]>('/teachers/departments'),
    staleTime: 120_000,
    retry: 1,
  });
}

// ─── Qualification types & hook ───────────────────────────────────────────────

export interface EmployeeQualification {
  id: string;
  employeeId: string;
  degree: string;
  institution: string;
  university?: string;
  specialization?: string;
  startYear: number;
  endYear?: number;
  percentage?: number;
  grade?: string;
  verificationStatus: string;
}

export function useQualifications(employeeId: string | null) {
  return useQuery<EmployeeQualification[]>({
    queryKey: ['teachers', employeeId, 'qualifications'],
    queryFn: () => apiClient.get<EmployeeQualification[]>(`/teachers/${employeeId}/qualifications`),
    enabled: !!employeeId,
    staleTime: 60_000,
  });
}

// ─── Experience types & hook ──────────────────────────────────────────────────

export interface EmployeeExperience {
  id: string;
  employeeId: string;
  organization: string;
  designation: string;
  department?: string;
  startDate: string;
  endDate?: string;
  responsibilities?: string;
  reasonForLeaving?: string;
}

export function useExperience(employeeId: string | null) {
  return useQuery<EmployeeExperience[]>({
    queryKey: ['teachers', employeeId, 'experience'],
    queryFn: () => apiClient.get<EmployeeExperience[]>(`/teachers/${employeeId}/experience`),
    enabled: !!employeeId,
    staleTime: 60_000,
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/teachers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

export interface CreateEmployeePayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  bloodGroup?: string;
  nationality?: string;
  employeeNumber: string;
  joiningDate: string;
  employeeTypeId?: string;
  departmentId?: string;
  designationId?: string;
  campusId?: string;
  reportingManagerId?: string;
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmployeePayload) =>
      apiClient.post<Employee>('/teachers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

// ─── Timetable types & hook ───────────────────────────────────────────────────

export interface TimetablePeriod {
  id: string;
  name: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  periodType: string;
}

export interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  period: TimetablePeriod;
  section: { id: string; name: string; code: string };
  subject: { id: string; name: string };
  room?: { id: string; name: string; code: string } | null;
}

export interface TimetableDay {
  day: string;
  entries: TimetableEntry[];
}

export function useTeacherTimetable(teacherId: string | null) {
  return useQuery<TimetableDay[]>({
    queryKey: ['timetable', 'teacher', teacherId],
    queryFn: () => apiClient.get<TimetableDay[]>(`/timetable/views/teacher/${teacherId}`),
    enabled: !!teacherId,
    staleTime: 120_000,
    retry: 1,
  });
}

// ─── Employee attendance types & hook ─────────────────────────────────────────

export interface EmployeeAttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workHours?: number | null;
  remarks?: string | null;
}

export function useEmployeeAttendance(
  employeeId: string | null,
  from: string,
  to: string,
) {
  return useQuery<EmployeeAttendanceRecord[]>({
    queryKey: ['attendance', 'employee', employeeId, from, to],
    queryFn: () =>
      apiClient.get<EmployeeAttendanceRecord[]>(
        `/attendance/employees?employeeId=${employeeId}&from=${from}&to=${to}`,
      ),
    enabled: !!employeeId,
    staleTime: 60_000,
    retry: 1,
  });
}

// ─── Leave request types & hook ───────────────────────────────────────────────

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  isPaid: boolean;
  annualLimit?: number | null;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string | null;
  status: string;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  leaveType: LeaveType;
}

export function useLeaveRequests(employeeId: string | null) {
  return useQuery<LeaveRequest[]>({
    queryKey: ['leave', 'requests', employeeId],
    queryFn: () =>
      apiClient.get<LeaveRequest[]>(`/attendance/leave-requests?employeeId=${employeeId}`),
    enabled: !!employeeId,
    staleTime: 60_000,
    retry: 1,
  });
}

// ─── Payroll history types & hook ─────────────────────────────────────────────

export interface PayrollRecord {
  id: string;
  employeeId: string;
  payrollRunId: string;
  workingDays?: number | null;
  presentDays?: number | null;
  basic: number;
  gross: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  payrollRun: {
    id: string;
    periodStart: string;
    periodEnd: string;
    status: string;
  };
}

export function useEmployeePayHistory(employeeId: string | null) {
  return useQuery<PayrollRecord[]>({
    queryKey: ['payroll', 'history', employeeId],
    queryFn: () =>
      apiClient.get<PayrollRecord[]>(`/payroll/employees/${employeeId}/history`),
    enabled: !!employeeId,
    staleTime: 120_000,
    retry: 1,
  });
}
