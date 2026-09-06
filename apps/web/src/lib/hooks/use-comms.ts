import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  organizationId: string;
  campusId: string | null;
  title: string;
  content: string;
  audienceType: string;
  targetClassId: string | null;
  publishAt: string | null;
  expiresAt: string | null;
  createdBy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  organizationId: string;
  recipientUserId: string;
  eventType: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface PtmSchedule {
  id: string;
  organizationId: string;
  campusId: string;
  academicYearId: string;
  name: string;
  date: string;
  slotDurationMinutes: number;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: { teacherSlots: number; bookings: number };
  teacherSlots?: PtmTeacherSlot[];
  bookings?: PtmBooking[];
}

export interface PtmTeacherSlot {
  id: string;
  ptmScheduleId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface PtmBooking {
  id: string;
  ptmScheduleId: string;
  teacherId: string;
  studentId: string;
  guardianId: string;
  slotStart: string;
  slotEnd: string;
  status: string;
  meetingNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Announcements ────────────────────────────────────────────────────────────

export function useAnnouncements(filters?: {
  status?: string;
  audienceType?: string;
  campusId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.audienceType) params.set('audienceType', filters.audienceType);
  if (filters?.campusId) params.set('campusId', filters.campusId);
  const qs = params.toString();
  return useQuery<Announcement[]>({
    queryKey: ['comms', 'announcements', filters],
    queryFn: () =>
      apiClient.get<Announcement[]>(`/comms/announcements${qs ? `?${qs}` : ''}`),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      title: string;
      content: string;
      audienceType: string;
      campusId?: string;
      targetClassId?: string;
      publishAt?: string;
      expiresAt?: string;
    }) => apiClient.post<Announcement>('/comms/announcements', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comms', 'announcements'] });
    },
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...dto
    }: {
      id: string;
      title?: string;
      content?: string;
      audienceType?: string;
      status?: string;
    }) => apiClient.patch<Announcement>(`/comms/announcements/${id}`, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comms', 'announcements'] });
    },
  });
}

export function usePublishAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Announcement>(`/comms/announcements/${id}/publish`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comms', 'announcements'] });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/comms/announcements/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comms', 'announcements'] });
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useNotifications(filters?: {
  recipientUserId?: string;
  status?: string;
  channel?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.recipientUserId) params.set('recipientUserId', filters.recipientUserId);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.channel) params.set('channel', filters.channel);
  const qs = params.toString();
  return useQuery<AppNotification[]>({
    queryKey: ['comms', 'notifications', filters],
    queryFn: () =>
      apiClient.get<AppNotification[]>(`/comms/notifications${qs ? `?${qs}` : ''}`),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<AppNotification>(`/comms/notifications/${id}/read`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comms', 'notifications'] });
    },
  });
}

// ─── PTM Schedules ────────────────────────────────────────────────────────────

export function usePtmSchedules(filters?: {
  campusId?: string;
  academicYearId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.campusId) params.set('campusId', filters.campusId);
  if (filters?.academicYearId) params.set('academicYearId', filters.academicYearId);
  const qs = params.toString();
  return useQuery<PtmSchedule[]>({
    queryKey: ['comms', 'ptm-schedules', filters],
    queryFn: () =>
      apiClient.get<PtmSchedule[]>(`/comms/ptm-schedules${qs ? `?${qs}` : ''}`),
    staleTime: 60_000,
    retry: 1,
  });
}

export function usePtmSchedule(id: string | null) {
  return useQuery<PtmSchedule>({
    queryKey: ['comms', 'ptm-schedule', id],
    queryFn: () => apiClient.get<PtmSchedule>(`/comms/ptm-schedules/${id}`),
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCreatePtmSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      campusId: string;
      academicYearId: string;
      name: string;
      date: string;
      slotDurationMinutes?: number;
    }) => apiClient.post<PtmSchedule>('/comms/ptm-schedules', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comms', 'ptm-schedules'] });
    },
  });
}

export function usePublishPtmSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<PtmSchedule>(`/comms/ptm-schedules/${id}/publish`, {}),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: ['comms', 'ptm-schedules'] });
      void qc.invalidateQueries({ queryKey: ['comms', 'ptm-schedule', id] });
    },
  });
}

// ─── PTM Teacher Slots ────────────────────────────────────────────────────────

export function usePtmTeacherSlots(scheduleId: string | null) {
  return useQuery<PtmTeacherSlot[]>({
    queryKey: ['comms', 'ptm-slots', scheduleId],
    queryFn: () =>
      apiClient.get<PtmTeacherSlot[]>(
        `/comms/ptm-schedules/${scheduleId}/teacher-slots`,
      ),
    enabled: !!scheduleId,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAddTeacherSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      ...dto
    }: {
      scheduleId: string;
      teacherId: string;
      startTime: string;
      endTime: string;
    }) =>
      apiClient.post<PtmTeacherSlot>(
        `/comms/ptm-schedules/${scheduleId}/teacher-slots`,
        dto,
      ),
    onSuccess: (_data, { scheduleId }) => {
      void qc.invalidateQueries({ queryKey: ['comms', 'ptm-slots', scheduleId] });
      void qc.invalidateQueries({ queryKey: ['comms', 'ptm-schedule', scheduleId] });
    },
  });
}

export function useDeleteTeacherSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      slotId,
    }: {
      scheduleId: string;
      slotId: string;
    }) =>
      apiClient.delete(
        `/comms/ptm-schedules/${scheduleId}/teacher-slots/${slotId}`,
      ),
    onSuccess: (_data, { scheduleId }) => {
      void qc.invalidateQueries({ queryKey: ['comms', 'ptm-slots', scheduleId] });
    },
  });
}

// ─── PTM Bookings ─────────────────────────────────────────────────────────────

export function usePtmBookings(
  scheduleId: string | null,
  filters?: { teacherId?: string; guardianId?: string },
) {
  const params = new URLSearchParams();
  if (filters?.teacherId) params.set('teacherId', filters.teacherId);
  if (filters?.guardianId) params.set('guardianId', filters.guardianId);
  const qs = params.toString();
  return useQuery<PtmBooking[]>({
    queryKey: ['comms', 'ptm-bookings', scheduleId, filters],
    queryFn: () =>
      apiClient.get<PtmBooking[]>(
        `/comms/ptm-schedules/${scheduleId}/bookings${qs ? `?${qs}` : ''}`,
      ),
    enabled: !!scheduleId,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCancelPtmBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      bookingId,
    }: {
      scheduleId: string;
      bookingId: string;
    }) =>
      apiClient.post<PtmBooking>(
        `/comms/ptm-schedules/${scheduleId}/bookings/${bookingId}/cancel`,
        {},
      ),
    onSuccess: (_data, { scheduleId }) => {
      void qc.invalidateQueries({ queryKey: ['comms', 'ptm-bookings', scheduleId] });
    },
  });
}
