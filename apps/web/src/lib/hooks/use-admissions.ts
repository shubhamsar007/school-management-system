import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdmissionStats {
  enquiries: {
    total: number;
    byStatus: Record<string, number>;
  };
  applications: {
    total: number;
    byStatus: Record<string, number>;
    pendingReview: number;
  };
}

export interface EnquiryClassInterested {
  id: string;
  name: string;
}

export interface EnquiryLinkedApplication {
  id: string;
  applicationNumber: string;
  status: string;
  submittedAt: string | null;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  organizationId: string;
  campusId: string | null;
  academicYearId: string | null;
  studentName: string;
  parentName: string | null;
  phone: string;
  email: string | null;
  classInterestedId: string | null;
  classInterested: EnquiryClassInterested | null;
  source: string;
  status: string;
  assignedTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { applications: number };
  // Only present on single-enquiry fetch (GET /enquiries/:id)
  applications?: EnquiryLinkedApplication[];
}

export interface ApplicationEnquiry {
  id: string;
  studentName: string;
  parentName: string | null;
  phone: string;
}

export interface ApplicationClass {
  id: string;
  name: string;
}

export interface ApplicationAcademicYear {
  id: string;
  name: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: string;
  fileId: string;
  verificationStatus: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  remarks: string | null;
  file: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  };
}

export interface Application {
  id: string;
  organizationId: string;
  enquiryId: string | null;
  enquiry: ApplicationEnquiry | null;
  applicationNumber: string;
  academicYearId: string;
  academicYear: ApplicationAcademicYear | null;
  classId: string;
  class: ApplicationClass | null;
  studentPersonId: string | null;
  status: string;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { documents: number };
  documents?: ApplicationDocument[];
}

// ─── List Response Types ──────────────────────────────────────────────────────

export interface EnquiryListResponse {
  data: Enquiry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApplicationListResponse {
  data: Application[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface EnquiryListParams {
  status?: string;
  assignedTo?: string;
  campusId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ApplicationListParams {
  status?: string;
  academicYearId?: string;
  classId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface CreateEnquiryPayload {
  studentName: string;
  parentName?: string;
  phone: string;
  email?: string;
  campusId?: string;
  academicYearId?: string;
  classInterestedId?: string;
  source: string;
  notes?: string;
  assignedTo?: string;
}

export interface UpdateEnquiryPayload {
  studentName?: string;
  parentName?: string;
  phone?: string;
  email?: string;
  classInterestedId?: string;
  source?: string;
  status?: string;
  notes?: string;
  assignedTo?: string;
}

export interface CreateApplicationPayload {
  applicationNumber: string;
  academicYearId: string;
  classId: string;
  enquiryId?: string;
  studentPersonId?: string;
}

export interface RejectApplicationPayload {
  rejectionReason?: string;
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

export function useAdmissionStats() {
  return useQuery<AdmissionStats>({
    queryKey: ['admissions', 'stats'],
    queryFn: () => apiClient.get<AdmissionStats>('/admissions/stats'),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useEnquiries(params: EnquiryListParams = {}) {
  const qs = toQueryString(params as Record<string, string | number | undefined>);
  return useQuery<EnquiryListResponse>({
    queryKey: ['admissions', 'enquiries', params],
    queryFn: () => apiClient.get<EnquiryListResponse>(`/admissions/enquiries${qs}`),
    staleTime: 30_000,
    retry: 1,
    placeholderData: (prev) => prev,
  });
}

export function useEnquiry(id: string | null) {
  return useQuery<Enquiry>({
    queryKey: ['admissions', 'enquiries', id],
    queryFn: () => apiClient.get<Enquiry>(`/admissions/enquiries/${id}`),
    enabled: !!id,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useApplications(params: ApplicationListParams = {}) {
  const qs = toQueryString(params as Record<string, string | number | undefined>);
  return useQuery<ApplicationListResponse>({
    queryKey: ['admissions', 'applications', params],
    queryFn: () => apiClient.get<ApplicationListResponse>(`/admissions/applications${qs}`),
    staleTime: 30_000,
    retry: 1,
    placeholderData: (prev) => prev,
  });
}

export function useApplication(id: string | null) {
  return useQuery<Application>({
    queryKey: ['admissions', 'applications', id],
    queryFn: () => apiClient.get<Application>(`/admissions/applications/${id}`),
    enabled: !!id,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useApplicationDocuments(applicationId: string | null) {
  return useQuery<ApplicationDocument[]>({
    queryKey: ['admissions', 'applications', applicationId, 'documents'],
    queryFn: () =>
      apiClient.get<ApplicationDocument[]>(`/admissions/applications/${applicationId}/documents`),
    enabled: !!applicationId,
    staleTime: 30_000,
    retry: 1,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateEnquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEnquiryPayload) =>
      apiClient.post<Enquiry>('/admissions/enquiries', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admissions', 'enquiries'] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'stats'] });
    },
  });
}

export function useUpdateEnquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEnquiryPayload }) =>
      apiClient.patch<Enquiry>(`/admissions/enquiries/${id}`, data),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ['admissions', 'enquiries'] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'enquiries', id] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'stats'] });
    },
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApplicationPayload) =>
      apiClient.post<Application>('/admissions/applications', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications'] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'stats'] });
    },
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Application>(`/admissions/applications/${id}/submit`, {}),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications'] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications', id] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'stats'] });
    },
  });
}

export function useReviewApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Application>(`/admissions/applications/${id}/review`, {}),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications'] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications', id] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'stats'] });
    },
  });
}

export function useApproveApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Application>(`/admissions/applications/${id}/approve`, {}),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications'] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications', id] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'enquiries'] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'stats'] });
    },
  });
}

export function useRejectApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectApplicationPayload }) =>
      apiClient.post<Application>(`/admissions/applications/${id}/reject`, data),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications'] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications', id] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'stats'] });
    },
  });
}

export function useRemoveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, docId }: { applicationId: string; docId: string }) =>
      apiClient.delete(`/admissions/applications/${applicationId}/documents/${docId}`),
    onSuccess: (_, { applicationId }) => {
      void qc.invalidateQueries({
        queryKey: ['admissions', 'applications', applicationId, 'documents'],
      });
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications', applicationId] });
    },
  });
}

export interface EnrollApplicationPayload {
  sectionId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  joiningDate?: string;
  enrollmentDate?: string;
}

export interface EnrollApplicationResult {
  application: Application;
  person: { id: string; firstName: string; lastName: string };
  student: { id: string; admissionNumber: string };
  enrollment: { id: string };
}

export interface DocumentActionPayload {
  remarks?: string;
}

export function useEnrollApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EnrollApplicationPayload }) =>
      apiClient.post<EnrollApplicationResult>(`/admissions/applications/${id}/enroll`, data),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications'] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications', id] });
      void qc.invalidateQueries({ queryKey: ['admissions', 'stats'] });
    },
  });
}

export function useVerifyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      docId,
      data,
    }: {
      applicationId: string;
      docId: string;
      data: DocumentActionPayload;
    }) =>
      apiClient.post<ApplicationDocument>(
        `/admissions/applications/${applicationId}/documents/${docId}/verify`,
        data,
      ),
    onSuccess: (_, { applicationId }) => {
      void qc.invalidateQueries({
        queryKey: ['admissions', 'applications', applicationId, 'documents'],
      });
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications', applicationId] });
    },
  });
}

export function useRejectDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      docId,
      data,
    }: {
      applicationId: string;
      docId: string;
      data: DocumentActionPayload;
    }) =>
      apiClient.post<ApplicationDocument>(
        `/admissions/applications/${applicationId}/documents/${docId}/reject`,
        data,
      ),
    onSuccess: (_, { applicationId }) => {
      void qc.invalidateQueries({
        queryKey: ['admissions', 'applications', applicationId, 'documents'],
      });
      void qc.invalidateQueries({ queryKey: ['admissions', 'applications', applicationId] });
    },
  });
}
