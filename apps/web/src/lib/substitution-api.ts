import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface CoveragePeriod {
  assignmentId: string;
  requestId: string;
  periodName: string;
  startTime: string | null;
  className: string;
  subject: string;
  absentTeacher: string;
  substitute: string | null;
  score: number | null;
  status: 'COVERED' | 'PENDING' | 'UNRESOLVED';
}

export interface TodayCoverage {
  date: string;
  kpis: SubstitutionKpis;
  periods: CoveragePeriod[];
}

export interface SubstitutionRequest {
  id: string;
  organizationId: string;
  leaveRequestId: string | null;
  academicYearId: string;
  date: string;
  status: 'PENDING' | 'PARTIALLY_ASSIGNED' | 'FULLY_ASSIGNED' | 'CANCELLED' | 'ESCALATED';
  escalatedAt?: string | null;
  createdAt: string;
  leaveRequest?: {
    id: string;
    employee?: {
      id: string;
      person: { firstName: string; lastName: string };
      departmentId: string | null;
    };
    leaveType?: { name: string };
    reason?: string;
  };
  assignments?: SubstitutionAssignment[];
}

export interface SubstitutionAssignment {
  id: string;
  substitutionRequestId: string;
  timetableEntryId: string;
  originalTeacherId: string;
  substituteTeacherId: string | null;
  algorithmScore: string | null;
  status: 'SUGGESTED' | 'CONFIRMED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED';
  assignedBy: string | null;
  notifiedAt: string | null;
  confirmedAt: string | null;
  declineReason: string | null;
  createdAt: string;
  timetableEntry?: {
    id: string;
    period?: { name: string; startTime: string; endTime: string };
    section?: { name: string };
    subject?: { name: string } | null;
  };
  substituteEmployee?: {
    id: string;
    person: { firstName: string; lastName: string };
  } | null;
  substitutionRequest?: SubstitutionRequest;
}

export interface SubstitutionPolicy {
  id: string;
  organizationId: string;
  maxSubsPerDay: number;
  maxSubsPerWeek: number;
  autoAssignThreshold: number;
  escalateAfterMinutes: number;
  fairnessWindowDays: number;
  weightSubject: number;
  weightWorkload: number;
  weightFairness: number;
  weightDept: number;
  mode: 'MANUAL' | 'AUTO_SUGGEST' | 'AUTO_ASSIGN' | 'HYBRID';
  notifyTeacher: boolean;
  notifyParents: boolean;
  subjectMatchRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  dayOfWeek: number; // 1=Mon … 7=Sun
  isAvailable: boolean;
  note?: string | null;
}

export interface TeacherAvailabilityResponse {
  employeeId: string;
  slots: AvailabilitySlot[];
}

export interface SubstitutePool {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  poolBonusPts: number;
  memberCount?: number;
  members?: SubstitutePoolMember[];
  createdAt: string;
  updatedAt: string;
}

export interface SubstitutePoolMember {
  poolId: string;
  employeeId: string;
  addedAt: string;
  employee?: {
    id: string;
    person: { firstName: string; lastName: string };
    department?: { name: string } | null;
    designation?: { name: string } | null;
  } | null;
}

export interface UnavailabilityOverride {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  requestId: string | null;
  assignmentId: string | null;
  action: string;
  actor: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface CandidateScore {
  id: string;
  substitutionRequestId: string;
  candidateEmployeeId: string;
  subjectProficiencyScore: string;
  workloadScore: string;
  fairnessScore: string;
  departmentAffinityScore: string;
  totalScore: string;
  disqualifiedReason: string | null;
  employee?: {
    id: string;
    person: { firstName: string; lastName: string };
    department?: { name: string } | null;
    designation?: { name: string } | null;
  } | null;
}

export interface RankedCandidates {
  requestId: string;
  date: string;
  qualified: CandidateScore[];
  disqualified: CandidateScore[];
}

export interface PaginatedRequests {
  data: SubstitutionRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedAssignments {
  data: SubstitutionAssignment[];
  total: number;
  page: number;
  limit: number;
}

// ─── API functions ────────────────────────────────────────────────────────────

export const substitutionApi = {
  getTodayCoverage: () =>
    apiClient.get<TodayCoverage>('/substitutions/today'),

  getRequests: (params: { status?: string; date?: string; leaveRequestId?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.date) qs.set('date', params.date);
    if (params.leaveRequestId) qs.set('leaveRequestId', params.leaveRequestId);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiClient.get<PaginatedRequests>(`/substitutions/requests${query ? `?${query}` : ''}`);
  },

  getRequest: (id: string) =>
    apiClient.get<SubstitutionRequest>(`/substitutions/requests/${id}`),

  getCandidates: (requestId: string) =>
    apiClient.get<RankedCandidates>(`/substitutions/requests/${requestId}/candidates`),

  cancelRequest: (requestId: string) =>
    apiClient.patch<SubstitutionRequest>(`/substitutions/requests/${requestId}/cancel`, {}),

  retryScoring: (requestId: string) =>
    apiClient.post<{ message: string; requestId: string }>(`/substitutions/requests/${requestId}/retry`, {}),

  getAssignments: (params: { status?: string; date?: string; teacherId?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.date) qs.set('date', params.date);
    if (params.teacherId) qs.set('teacherId', params.teacherId);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiClient.get<PaginatedAssignments>(`/substitutions/assignments${query ? `?${query}` : ''}`);
  },

  confirmAssignment: (assignmentId: string, substituteTeacherId: string) =>
    apiClient.patch<SubstitutionAssignment>(`/substitutions/assignments/${assignmentId}/confirm`, { substituteTeacherId }),

  declineAssignment: (assignmentId: string, reason?: string) =>
    apiClient.patch<SubstitutionAssignment>(`/substitutions/assignments/${assignmentId}/decline`, { reason }),

  trigger: (leaveRequestId: string) =>
    apiClient.post<{ message: string; requests: SubstitutionRequest[] }>('/substitutions/trigger', { leaveRequestId }),

  reassignAfterDecline: (assignmentId: string) =>
    apiClient.post<{ message: string; assignment: SubstitutionAssignment | null }>(`/substitutions/assignments/${assignmentId}/reassign`, {}),

  escalateRequest: (requestId: string) =>
    apiClient.post<SubstitutionRequest>(`/substitutions/requests/${requestId}/escalate`, {}),

  createManual: (body: { employeeId: string; date: string; reason?: string; periodIds?: string[]; leaveRequestId?: string }) =>
    apiClient.post<SubstitutionRequest>('/substitutions/manual', body),

  getPolicy: () =>
    apiClient.get<SubstitutionPolicy>('/substitutions/policy'),

  upsertPolicy: (body: Partial<SubstitutionPolicy>) =>
    apiClient.patch<SubstitutionPolicy>('/substitutions/policy', body),

  getTeacherAvailability: (employeeId: string) =>
    apiClient.get<TeacherAvailabilityResponse>(`/substitutions/availability/${employeeId}`),

  setTeacherAvailability: (employeeId: string, slots: AvailabilitySlot[]) =>
    apiClient.put<TeacherAvailabilityResponse>(`/substitutions/availability/${employeeId}`, { slots }),

  optimizeDate: (date?: string) => {
    const qs = date ? `?date=${date}` : '';
    return apiClient.post<{ message: string; assigned: number; skipped: number }>(`/substitutions/optimize${qs}`, {});
  },

  listPools: () =>
    apiClient.get<SubstitutePool[]>('/substitutions/pools'),

  createPool: (dto: Partial<SubstitutePool>) =>
    apiClient.post<SubstitutePool>('/substitutions/pools', dto),

  updatePool: (id: string, dto: Partial<SubstitutePool>) =>
    apiClient.patch<SubstitutePool>(`/substitutions/pools/${id}`, dto),

  deletePool: (id: string) =>
    apiClient.post<{ message: string }>(`/substitutions/pools/${id}/delete`, {}),

  getPoolMembers: (poolId: string) =>
    apiClient.get<SubstitutePoolMember[]>(`/substitutions/pools/${poolId}/members`),

  addPoolMember: (poolId: string, employeeId: string) =>
    apiClient.post<SubstitutePoolMember>(`/substitutions/pools/${poolId}/members`, { employeeId }),

  removePoolMember: (poolId: string, employeeId: string) =>
    apiClient.post<{ message: string }>(`/substitutions/pools/${poolId}/members/${employeeId}/remove`, {}),

  listUnavailabilityOverrides: (employeeId: string) =>
    apiClient.get<UnavailabilityOverride[]>(`/substitutions/unavailability/${employeeId}`),

  createUnavailabilityOverride: (dto: { employeeId: string; startDate: string; endDate: string; reason?: string }) =>
    apiClient.post<UnavailabilityOverride>('/substitutions/unavailability', dto),

  deleteUnavailabilityOverride: (id: string) =>
    apiClient.post<{ message: string }>(`/substitutions/unavailability/${id}/delete`, {}),

  getAuditLog: (requestId: string) =>
    apiClient.get<AuditLogEntry[]>(`/substitutions/requests/${requestId}/audit`),
};

// ─── React Query hooks ────────────────────────────────────────────────────────

export const SUBSTITUTION_KEYS = {
  all: ['substitutions'] as const,
  today: () => [...SUBSTITUTION_KEYS.all, 'today'] as const,
  requests: (params?: object) => [...SUBSTITUTION_KEYS.all, 'requests', params] as const,
  request: (id: string) => [...SUBSTITUTION_KEYS.all, 'request', id] as const,
  candidates: (requestId: string) => [...SUBSTITUTION_KEYS.all, 'candidates', requestId] as const,
  assignments: (params?: object) => [...SUBSTITUTION_KEYS.all, 'assignments', params] as const,
  policy: () => [...SUBSTITUTION_KEYS.all, 'policy'] as const,
  availability: (employeeId: string) => [...SUBSTITUTION_KEYS.all, 'availability', employeeId] as const,
  pools: () => [...SUBSTITUTION_KEYS.all, 'pools'] as const,
  poolMembers: (poolId: string) => [...SUBSTITUTION_KEYS.all, 'pool-members', poolId] as const,
  overrides: (employeeId: string) => [...SUBSTITUTION_KEYS.all, 'overrides', employeeId] as const,
  audit: (requestId: string) => [...SUBSTITUTION_KEYS.all, 'audit', requestId] as const,
};

export function useTodayCoverage() {
  return useQuery({
    queryKey: SUBSTITUTION_KEYS.today(),
    queryFn: substitutionApi.getTodayCoverage,
    refetchInterval: 60_000, // refresh every minute
  });
}

export function useSubstitutionRequests(params: Parameters<typeof substitutionApi.getRequests>[0] = {}) {
  return useQuery({
    queryKey: SUBSTITUTION_KEYS.requests(params),
    queryFn: () => substitutionApi.getRequests(params),
  });
}

export function useSubstitutionRequest(id: string) {
  return useQuery({
    queryKey: SUBSTITUTION_KEYS.request(id),
    queryFn: () => substitutionApi.getRequest(id),
    enabled: !!id,
  });
}

export function useSubstitutionCandidates(requestId: string, enabled = true) {
  return useQuery({
    queryKey: SUBSTITUTION_KEYS.candidates(requestId),
    queryFn: () => substitutionApi.getCandidates(requestId),
    enabled: !!requestId && enabled,
  });
}

export function useSubstitutionAssignments(params: Parameters<typeof substitutionApi.getAssignments>[0] = {}) {
  return useQuery({
    queryKey: SUBSTITUTION_KEYS.assignments(params),
    queryFn: () => substitutionApi.getAssignments(params),
  });
}

export function useConfirmAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, substituteTeacherId }: { assignmentId: string; substituteTeacherId: string }) =>
      substitutionApi.confirmAssignment(assignmentId, substituteTeacherId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.all });
    },
  });
}

export function useDeclineAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, reason }: { assignmentId: string; reason?: string }) =>
      substitutionApi.declineAssignment(assignmentId, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.all });
    },
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => substitutionApi.cancelRequest(requestId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.all });
    },
  });
}

export function useRetryScoring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => substitutionApi.retryScoring(requestId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.all });
    },
  });
}

export function useReassignAfterDecline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => substitutionApi.reassignAfterDecline(assignmentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.all });
    },
  });
}

export function useEscalateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => substitutionApi.escalateRequest(requestId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.all });
    },
  });
}

export function useCreateManualSubstitution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof substitutionApi.createManual>[0]) =>
      substitutionApi.createManual(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.all });
    },
  });
}

export function useGetPolicy() {
  return useQuery({
    queryKey: SUBSTITUTION_KEYS.policy(),
    queryFn: substitutionApi.getPolicy,
  });
}

export function useUpsertPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<SubstitutionPolicy>) => substitutionApi.upsertPolicy(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.policy() });
    },
  });
}

export function useTeacherAvailability(employeeId: string, enabled = true) {
  return useQuery({
    queryKey: SUBSTITUTION_KEYS.availability(employeeId),
    queryFn: () => substitutionApi.getTeacherAvailability(employeeId),
    enabled: !!employeeId && enabled,
  });
}

export function useSetTeacherAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, slots }: { employeeId: string; slots: AvailabilitySlot[] }) =>
      substitutionApi.setTeacherAvailability(employeeId, slots),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.availability(vars.employeeId) });
    },
  });
}

export function useOptimizeDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date?: string) => substitutionApi.optimizeDate(date),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.all });
    },
  });
}

// ─── Pools ────────────────────────────────────────────────────────────────────

export function usePools() {
  return useQuery({
    queryKey: SUBSTITUTION_KEYS.pools(),
    queryFn: substitutionApi.listPools,
  });
}

export function useCreatePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<SubstitutePool>) => substitutionApi.createPool(dto),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.pools() }); },
  });
}

export function useUpdatePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & Partial<SubstitutePool>) =>
      substitutionApi.updatePool(id, dto),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.pools() }); },
  });
}

export function useDeletePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => substitutionApi.deletePool(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.pools() }); },
  });
}

export function usePoolMembers(poolId: string, enabled = true) {
  return useQuery({
    queryKey: SUBSTITUTION_KEYS.poolMembers(poolId),
    queryFn: () => substitutionApi.getPoolMembers(poolId),
    enabled: !!poolId && enabled,
  });
}

export function useAddPoolMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poolId, employeeId }: { poolId: string; employeeId: string }) =>
      substitutionApi.addPoolMember(poolId, employeeId),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.poolMembers(vars.poolId) });
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.pools() });
    },
  });
}

export function useRemovePoolMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poolId, employeeId }: { poolId: string; employeeId: string }) =>
      substitutionApi.removePoolMember(poolId, employeeId),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.poolMembers(vars.poolId) });
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.pools() });
    },
  });
}

// ─── Unavailability overrides ─────────────────────────────────────────────────

export function useUnavailabilityOverrides(employeeId: string, enabled = true) {
  return useQuery({
    queryKey: SUBSTITUTION_KEYS.overrides(employeeId),
    queryFn: () => substitutionApi.listUnavailabilityOverrides(employeeId),
    enabled: !!employeeId && enabled,
  });
}

export function useCreateUnavailabilityOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { employeeId: string; startDate: string; endDate: string; reason?: string }) =>
      substitutionApi.createUnavailabilityOverride(dto),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.overrides(vars.employeeId) });
    },
  });
}

export function useDeleteUnavailabilityOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) =>
      substitutionApi.deleteUnavailabilityOverride(id),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: SUBSTITUTION_KEYS.overrides(vars.employeeId) });
    },
  });
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export function useAuditLog(requestId: string, enabled = true) {
  return useQuery({
    queryKey: SUBSTITUTION_KEYS.audit(requestId),
    queryFn: () => substitutionApi.getAuditLog(requestId),
    enabled: !!requestId && enabled,
  });
}
