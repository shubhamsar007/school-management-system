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
