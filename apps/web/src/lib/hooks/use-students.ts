import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  boys: number;
  girls: number;
  newAdmissions: number;
}

export interface StudentEnrollment {
  id: string;
  classId: string;
  sectionId: string;
  rollNumber?: string;
  enrollmentDate: string;
  status: string;
  class: { id: string; name: string; code: string };
  section: { id: string; name: string; code: string };
  academicYear: { id: string; name: string };
}

export interface Student {
  id: string;
  admissionNumber: string;
  registrationNumber?: string;
  studentStatus: string;
  admissionDate: string;
  joiningDate?: string;
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
  enrollments: StudentEnrollment[];
}

export interface StudentListParams {
  search?: string;
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  status?: string;
  gender?: string;
  page?: number;
  limit?: number;
}

export interface StudentListResponse {
  data: Student[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export function useStudentStats() {
  return useQuery<StudentStats>({
    queryKey: ['students', 'stats'],
    queryFn: () => apiClient.get<StudentStats>('/students/stats'),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useStudents(params: StudentListParams = {}) {
  const qs = toQueryString(params as Record<string, string | number | undefined>);
  return useQuery<StudentListResponse>({
    queryKey: ['students', 'list', params],
    queryFn: () => apiClient.get<StudentListResponse>(`/students${qs}`),
    staleTime: 30_000,
    retry: 1,
    placeholderData: (prev) => prev,
  });
}

export function useStudent(id: string | null) {
  return useQuery<Student>({
    queryKey: ['students', id],
    queryFn: () => apiClient.get<Student>(`/students/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/students/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export interface CreateStudentPayload {
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
  preferredName?: string;
  motherTongue?: string;
  religion?: string;
  category?: string;
  caste?: string;
  studentType?: string;
  admissionSource?: string;
  permanentAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  currentAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  admissionNumber: string;
  registrationNumber?: string;
  admissionDate: string;
  joiningDate?: string;
  currentCampusId?: string;
}

export interface CreateEnrollmentPayload {
  academicYearId: string;
  campusId: string;
  classId: string;
  sectionId: string;
  rollNumber?: string;
  enrollmentDate: string;
}

export interface CreateGuardianPayload {
  firstName: string;
  lastName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gender?: string;
  occupation?: string;
  employer?: string;
  designation?: string;
  relationship: string;
  isPrimary?: boolean;
  isEmergencyContact?: boolean;
  canPickup?: boolean;
  canReceiveNotifications?: boolean;
  canAccessPortal?: boolean;
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentPayload) =>
      apiClient.post<Student>('/students', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useCreateEnrollment() {
  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: CreateEnrollmentPayload }) =>
      apiClient.post(`/students/${studentId}/enrollments`, data),
  });
}

export function useCreateGuardian() {
  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: CreateGuardianPayload }) =>
      apiClient.post(`/students/${studentId}/guardians`, data),
  });
}

// ─── Guardian types & hooks ───────────────────────────────────────────────────

export interface GuardianPerson {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  gender?: string;
}

export interface Guardian {
  id: string;
  occupation?: string;
  employer?: string;
  annualIncome?: number;
  education?: string;
  person: GuardianPerson;
}

export interface StudentGuardian {
  id: string;
  studentId: string;
  guardianId: string;
  relationship: string;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  canPickup: boolean;
  canReceiveNotifications: boolean;
  guardian: Guardian;
}

export function useGuardians(studentId: string | null) {
  return useQuery<StudentGuardian[]>({
    queryKey: ['students', studentId, 'guardians'],
    queryFn: () => apiClient.get<StudentGuardian[]>(`/students/${studentId}/guardians`),
    enabled: !!studentId,
    staleTime: 60_000,
  });
}

// ─── Enrollment types & hooks ─────────────────────────────────────────────────

export interface EnrollmentDetail {
  id: string;
  studentId: string;
  academicYearId: string;
  campusId: string;
  classId: string;
  sectionId: string;
  rollNumber?: string;
  enrollmentDate: string;
  status: string;
  promotionStatus?: string;
  academicYear: { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean };
  class: { id: string; name: string; code: string };
  section: { id: string; name: string; code: string };
}

export function useEnrollments(studentId: string | null) {
  return useQuery<EnrollmentDetail[]>({
    queryKey: ['students', studentId, 'enrollments'],
    queryFn: () => apiClient.get<EnrollmentDetail[]>(`/students/${studentId}/enrollments`),
    enabled: !!studentId,
    staleTime: 60_000,
  });
}
