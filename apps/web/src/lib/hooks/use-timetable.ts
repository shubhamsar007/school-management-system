import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimetableRoom {
  id: string;
  campusId: string;
  buildingId?: string | null;
  name: string;
  code: string;
  roomType: string;
  capacity?: number | null;
  status: string;
  building?: { id: string; name: string; code: string } | null;
}

export interface TimetableBuilding {
  id: string;
  campusId: string;
  name: string;
  code: string;
  description?: string | null;
  status: string;
  rooms: TimetableRoom[];
}

export interface TimetablePeriod {
  id: string;
  campusId: string;
  name: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  periodType: string;
}

export interface TimetableSummary {
  id: string;
  campusId: string;
  academicYearId: string;
  name: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: string;
  academicYear: { id: string; name: string };
}

export interface SchedulePeriodInfo {
  id: string;
  name: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  periodType: string;
}

export interface ScheduleEntry {
  id: string;
  dayOfWeek: number;
  period: SchedulePeriodInfo;
  section: { id: string; name: string; code: string };
  subject: { id: string; name: string };
  room?: { id: string; name: string; code: string } | null;
  teacher?: { id: string; person: { firstName: string; lastName: string } } | null;
}

export interface ScheduleDay {
  day: string;
  entries: ScheduleEntry[];
}

// ─── Buildings ────────────────────────────────────────────────────────────────

export function useBuildings(campusId: string | null) {
  return useQuery<TimetableBuilding[]>({
    queryKey: ['timetable', 'buildings', campusId],
    queryFn: () => apiClient.get<TimetableBuilding[]>(`/timetable/buildings?campusId=${campusId}`),
    enabled: !!campusId,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCreateBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      campusId: string;
      name: string;
      code: string;
      description?: string;
      status?: string;
    }) => apiClient.post<TimetableBuilding>('/timetable/buildings', dto),
    onSuccess: (_data, dto) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'buildings', dto.campusId] });
    },
  });
}

export function useUpdateBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      campusId,
      dto,
    }: {
      id: string;
      campusId: string;
      dto: { name?: string; code?: string; description?: string; status?: string };
    }) => apiClient.patch<TimetableBuilding>(`/timetable/buildings/${id}`, dto),
    onSuccess: (_data, { campusId }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'buildings', campusId] });
    },
  });
}

export function useDeleteBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; campusId: string }) =>
      apiClient.delete(`/timetable/buildings/${id}`),
    onSuccess: (_data, { campusId }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'buildings', campusId] });
    },
  });
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export function useRooms(
  campusId: string | null,
  filters?: { buildingId?: string; roomType?: string; status?: string },
) {
  const params = new URLSearchParams();
  if (campusId) params.set('campusId', campusId);
  if (filters?.buildingId) params.set('buildingId', filters.buildingId);
  if (filters?.roomType) params.set('roomType', filters.roomType);
  if (filters?.status) params.set('status', filters.status);

  return useQuery<TimetableRoom[]>({
    queryKey: ['timetable', 'rooms', campusId, filters],
    queryFn: () => apiClient.get<TimetableRoom[]>(`/timetable/rooms?${params.toString()}`),
    enabled: !!campusId,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      campusId: string;
      buildingId?: string;
      name: string;
      code: string;
      roomType: string;
      capacity?: number;
      status?: string;
    }) => apiClient.post<TimetableRoom>('/timetable/rooms', dto),
    onSuccess: (_data, dto) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'rooms', dto.campusId] });
    },
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      campusId,
      dto,
    }: {
      id: string;
      campusId: string;
      dto: {
        name?: string;
        code?: string;
        roomType?: string;
        buildingId?: string | null;
        capacity?: number | null;
        status?: string;
      };
    }) => apiClient.patch<TimetableRoom>(`/timetable/rooms/${id}`, dto),
    onSuccess: (_data, { campusId }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'rooms', campusId] });
    },
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; campusId: string }) =>
      apiClient.delete(`/timetable/rooms/${id}`),
    onSuccess: (_data, { campusId }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'rooms', campusId] });
    },
  });
}

// ─── Periods ──────────────────────────────────────────────────────────────────

export function usePeriods(campusId: string | null) {
  return useQuery<TimetablePeriod[]>({
    queryKey: ['timetable', 'periods', campusId],
    queryFn: () => apiClient.get<TimetablePeriod[]>(`/timetable/periods?campusId=${campusId}`),
    enabled: !!campusId,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCreatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      campusId: string;
      name: string;
      periodNumber: number;
      startTime: string;
      endTime: string;
      periodType: string;
    }) => apiClient.post<TimetablePeriod>('/timetable/periods', dto),
    onSuccess: (_data, dto) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'periods', dto.campusId] });
    },
  });
}

export function useUpdatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      campusId,
      dto,
    }: {
      id: string;
      campusId: string;
      dto: {
        name?: string;
        periodNumber?: number;
        startTime?: string;
        endTime?: string;
        periodType?: string;
      };
    }) => apiClient.patch<TimetablePeriod>(`/timetable/periods/${id}`, dto),
    onSuccess: (_data, { campusId }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'periods', campusId] });
    },
  });
}

export function useDeletePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; campusId: string }) =>
      apiClient.delete(`/timetable/periods/${id}`),
    onSuccess: (_data, { campusId }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'periods', campusId] });
    },
  });
}

// ─── Timetables ───────────────────────────────────────────────────────────────

export function useTimetables(filters?: {
  campusId?: string;
  academicYearId?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.campusId) params.set('campusId', filters.campusId);
  if (filters?.academicYearId) params.set('academicYearId', filters.academicYearId);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();

  return useQuery<TimetableSummary[]>({
    queryKey: ['timetable', 'list', filters],
    queryFn: () => apiClient.get<TimetableSummary[]>(`/timetable${qs ? `?${qs}` : ''}`),
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useCreateTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      campusId: string;
      academicYearId: string;
      name: string;
      effectiveFrom: string;
      effectiveTo?: string;
    }) => apiClient.post<TimetableSummary>('/timetable', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'list'] });
    },
  });
}

export function useActivateTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<TimetableSummary>(`/timetable/${id}/activate`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'list'] });
    },
  });
}

export function useArchiveTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<TimetableSummary>(`/timetable/${id}/archive`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'list'] });
    },
  });
}

export function useDeleteTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/timetable/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'list'] });
    },
  });
}

export function useCopyTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiClient.post<TimetableSummary & { copiedEntries: number }>(`/timetable/${id}/copy`, { name }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'list'] });
    },
  });
}

export interface AutoGenerateResult {
  created: number;
  skipped: number;
  assignments: number;
}

export function useAutoGenerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, periodsPerWeek }: { id: string; periodsPerWeek: number }) =>
      apiClient.post<AutoGenerateResult>(`/timetable/${id}/auto-generate`, { periodsPerWeek }),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'full', id] });
      void qc.invalidateQueries({ queryKey: ['timetable', 'conflicts', id] });
    },
  });
}

// ─── Schedule Views ───────────────────────────────────────────────────────────

export function useSectionSchedule(
  sectionId: string | null,
  timetableId?: string,
) {
  const qs = timetableId ? `?timetableId=${timetableId}` : '';
  return useQuery<ScheduleDay[]>({
    queryKey: ['timetable', 'schedule', 'section', sectionId, timetableId],
    queryFn: () => apiClient.get<ScheduleDay[]>(`/timetable/views/section/${sectionId}${qs}`),
    enabled: !!sectionId,
    staleTime: 120_000,
    retry: 1,
  });
}

// ─── Full Timetable (Builder) ─────────────────────────────────────────────────

export interface TimetableEntryTeacher {
  id: string;
  person: { firstName: string; lastName: string };
}

export interface TimetableFullEntry {
  id: string;
  timetableId: string;
  dayOfWeek: number;
  classId: string;
  sectionId: string;
  subjectId?: string | null;
  teacherId?: string | null;
  roomId?: string | null;
  period: TimetablePeriod;
  section: { id: string; name: string; code: string };
  subject?: { id: string; name: string } | null;
  room?: { id: string; name: string; code: string } | null;
  teacher?: TimetableEntryTeacher | null;
}

export interface TimetableFull extends TimetableSummary {
  entries: TimetableFullEntry[];
}

export function useTimetableFull(id: string | null) {
  return useQuery<TimetableFull>({
    queryKey: ['timetable', 'full', id],
    queryFn: () => apiClient.get<TimetableFull>(`/timetable/${id}`),
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });
}

// ─── Entry Mutations ──────────────────────────────────────────────────────────

interface AddEntryPayload {
  timetableId: string;
  dayOfWeek: number;
  periodId: string;
  classId: string;
  sectionId: string;
  subjectId?: string;
  teacherId?: string;
  roomId?: string;
}

export function useAddEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ timetableId, ...dto }: AddEntryPayload) =>
      apiClient.post<TimetableFullEntry>(`/timetable/${timetableId}/entries`, dto),
    onSuccess: (_data, { timetableId }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'full', timetableId] });
    },
  });
}

interface UpdateEntryPayload {
  timetableId: string;
  entryId: string;
  subjectId?: string | null;
  teacherId?: string | null;
  roomId?: string | null;
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ timetableId, entryId, ...dto }: UpdateEntryPayload) =>
      apiClient.patch<TimetableFullEntry>(`/timetable/${timetableId}/entries/${entryId}`, dto),
    onSuccess: (_data, { timetableId }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'full', timetableId] });
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ timetableId, entryId }: { timetableId: string; entryId: string }) =>
      apiClient.delete(`/timetable/${timetableId}/entries/${entryId}`),
    onSuccess: (_data, { timetableId }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'full', timetableId] });
    },
  });
}

export function useMoveEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      timetableId,
      entryId,
      dayOfWeek,
      periodId,
    }: {
      timetableId: string;
      entryId: string;
      dayOfWeek: number;
      periodId: string;
    }) =>
      apiClient.patch<TimetableFullEntry>(
        `/timetable/${timetableId}/entries/${entryId}/move`,
        { dayOfWeek, periodId },
      ),
    onSuccess: (_data, { timetableId }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'full', timetableId] });
    },
  });
}

// ─── Conflicts ────────────────────────────────────────────────────────────────

export interface TimetableConflictEntry {
  id: string;
  section: { id: string; name: string; code: string };
  subject?: { id: string; name: string } | null;
  teacher?: { id: string; person: { firstName: string; lastName: string } } | null;
  room?: { id: string; name: string; code: string } | null;
}

export interface TimetableConflict {
  type: 'TEACHER' | 'ROOM';
  dayOfWeek: number;
  day: string;
  period: { id: string; name: string; startTime: string; endTime: string };
  teacher?: { id: string; person: { firstName: string; lastName: string } } | null;
  room?: { id: string; name: string } | null;
  entries: TimetableConflictEntry[];
}

export interface TimetableConflicts {
  total: number;
  teacherConflicts: TimetableConflict[];
  roomConflicts: TimetableConflict[];
}

export function useConflicts(timetableId: string | null) {
  return useQuery<TimetableConflicts>({
    queryKey: ['timetable', 'conflicts', timetableId],
    queryFn: () => apiClient.get<TimetableConflicts>(`/timetable/${timetableId}/conflicts`),
    enabled: !!timetableId,
    staleTime: 30_000,
    retry: 1,
  });
}

// ─── Room Schedule ────────────────────────────────────────────────────────────

export function useRoomSchedule(roomId: string | null, timetableId?: string) {
  const qs = timetableId ? `?timetableId=${timetableId}` : '';
  return useQuery<ScheduleDay[]>({
    queryKey: ['timetable', 'schedule', 'room', roomId, timetableId],
    queryFn: () => apiClient.get<ScheduleDay[]>(`/timetable/views/room/${roomId}${qs}`),
    enabled: !!roomId,
    staleTime: 120_000,
    retry: 1,
  });
}

// ─── Teacher Availability ─────────────────────────────────────────────────────

export interface TeacherAvailabilityDay {
  dayOfWeek: number;
  isAvailable: boolean;
  note: string | null;
  id: string | null;
}

export function useTeacherAvailability(teacherId: string | null) {
  return useQuery<TeacherAvailabilityDay[]>({
    queryKey: ['timetable', 'availability', teacherId],
    queryFn: () =>
      apiClient.get<TeacherAvailabilityDay[]>(
        `/timetable/teacher-availability?teacherId=${teacherId}`,
      ),
    enabled: !!teacherId,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useSetTeacherAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teacherId,
      availability,
    }: {
      teacherId: string;
      availability: Array<{ dayOfWeek: number; isAvailable: boolean; note?: string }>;
    }) =>
      apiClient.put<TeacherAvailabilityDay[]>(
        `/timetable/teacher-availability/${teacherId}`,
        { availability },
      ),
    onSuccess: (_data, { teacherId }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'availability', teacherId] });
    },
  });
}

// ─── Scheduling Rules ─────────────────────────────────────────────────────────

export interface SchedulingRule {
  id: string;
  campusId: string;
  ruleType: string;
  value: number | null;
  periodId: string | null;
  dayOfWeek: number | null;
  description: string | null;
  isActive: boolean;
  period?: { id: string; name: string; periodNumber: number } | null;
}

export function useSchedulingRules(campusId: string | null) {
  return useQuery<SchedulingRule[]>({
    queryKey: ['timetable', 'rules', campusId],
    queryFn: () =>
      apiClient.get<SchedulingRule[]>(`/timetable/rules?campusId=${campusId}`),
    enabled: !!campusId,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      campusId: string;
      ruleType: string;
      value?: number;
      periodId?: string;
      dayOfWeek?: number;
      description?: string;
    }) => apiClient.post<SchedulingRule>('/timetable/rules', dto),
    onSuccess: (_data, dto) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'rules', dto.campusId] });
    },
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; campusId: string }) =>
      apiClient.delete(`/timetable/rules/${id}`),
    onSuccess: (_data, { campusId }) => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'rules', campusId] });
    },
  });
}

// ─── Substitute Suggestions ───────────────────────────────────────────────────

export interface SubstituteCandidate {
  candidateId: string;
  name: string;
  subjectProficiency: number;
  workloadScore: number;
  fairnessScore: number;
  departmentAffinity: number;
  total: number;
  disqualifiedReason: string | null;
}

export interface SubstitutePeriodResult {
  entry: {
    id: string;
    periodId: string;
    periodName: string;
    periodNumber: number;
    startTime: string;
    subjectId: string | null;
    subjectName: string | null;
    sectionId: string;
    sectionName: string;
  };
  candidates: SubstituteCandidate[];
}

export interface SubstituteSuggestionsResult {
  dayOfWeek: number;
  timetableId: string;
  absentTeacherId: string;
  periods: SubstitutePeriodResult[];
}

export function useSubstituteSuggestions(params: {
  timetableId: string | null;
  teacherId: string | null;
  dayOfWeek: number | null;
  date?: string;
}) {
  const { timetableId, teacherId, dayOfWeek, date } = params;
  const enabled = !!timetableId && !!teacherId && !!dayOfWeek;

  const qs = new URLSearchParams();
  if (timetableId) qs.set('timetableId', timetableId);
  if (teacherId) qs.set('teacherId', teacherId);
  if (dayOfWeek) qs.set('dayOfWeek', String(dayOfWeek));
  if (date) qs.set('date', date);

  return useQuery<SubstituteSuggestionsResult>({
    queryKey: ['timetable', 'substitute', timetableId, teacherId, dayOfWeek, date],
    queryFn: () =>
      apiClient.get<SubstituteSuggestionsResult>(`/timetable/substitute/suggest?${qs.toString()}`),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}
