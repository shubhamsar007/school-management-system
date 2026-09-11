import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationTemplate {
  id: string;
  organizationId: string | null;
  name: string;
  description: string | null;
  eventType: string;
  channel: string;
  language: string;
  subject: string | null;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

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
  category: string;
  priority: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationStats {
  sentToday: number;
  delivered: number;
  failed: number;
  pending: number;
  unread: number;
  deliveryRate: number;
  readRate: number;
}

export interface NotificationRule {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  eventType: string;
  templateId: string | null;
  audienceType: string;
  audienceTarget: string | null;
  channels: string[];
  priority: string;
  category: string;
  isActive: boolean;
  escalateAfterMinutes: number | null;
  escalateToType: string | null;
  escalateChannels: string[];
  createdAt: string;
  updatedAt: string;
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

// ─── Notification Templates ───────────────────────────────────────────────────

export function useTemplates(filters?: {
  eventType?: string;
  channel?: string;
  language?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.eventType) params.set('eventType', filters.eventType);
  if (filters?.channel) params.set('channel', filters.channel);
  if (filters?.language) params.set('language', filters.language);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  return useQuery<NotificationTemplate[]>({
    queryKey: ['comms', 'templates', filters],
    queryFn: () =>
      apiClient.get<NotificationTemplate[]>(`/comms/templates${qs ? `?${qs}` : ''}`),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      name: string;
      description?: string | undefined;
      eventType: string;
      channel: string;
      language?: string | undefined;
      subject?: string | undefined;
      body: string;
    }) => apiClient.post<NotificationTemplate>('/comms/templates', dto),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'templates'] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: {
      id: string;
      name?: string | undefined;
      description?: string | undefined;
      eventType?: string | undefined;
      channel?: string | undefined;
      language?: string | undefined;
      subject?: string | undefined;
      body?: string | undefined;
    }) => apiClient.patch<NotificationTemplate>(`/comms/templates/${id}`, dto),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'templates'] }),
  });
}

export function useActivateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<NotificationTemplate>(`/comms/templates/${id}/activate`, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'templates'] }),
  });
}

export function useDeactivateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<NotificationTemplate>(`/comms/templates/${id}/deactivate`, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/comms/templates/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'templates'] }),
  });
}

// ─── Notification Rules ───────────────────────────────────────────────────────

export function useRules(filters?: { eventType?: string; isActive?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.eventType) params.set('eventType', filters.eventType);
  if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
  const qs = params.toString();

  return useQuery<NotificationRule[]>({
    queryKey: ['comms', 'rules', filters],
    queryFn: () => apiClient.get<NotificationRule[]>(`/comms/rules${qs ? `?${qs}` : ''}`),
  });
}

interface RulePayload {
  name: string;
  description?: string | null;
  eventType: string;
  templateId?: string | null;
  audienceType: string;
  audienceTarget?: string | null;
  channels: string[];
  priority?: string;
  category?: string;
  isActive?: boolean;
  escalateAfterMinutes?: number;
  escalateToType?: string;
  escalateChannels?: string[];
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RulePayload) =>
      apiClient.post<NotificationRule>('/comms/rules', data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'rules'] }),
  });
}

export function useUpdateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RulePayload> }) =>
      apiClient.patch<NotificationRule>(`/comms/rules/${id}`, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'rules'] }),
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<NotificationRule>(`/comms/rules/${id}/toggle`, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'rules'] }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/comms/rules/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'rules'] }),
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  total: number;
  sentToday: number;
  delivered: number;
  failed: number;
  read: number;
  pending: number;
  deliveryRate: number;
  readRate: number;
  failureRate: number;
  days: number;
}

export interface AnalyticsChannelRow {
  channel: string;
  total: number;
  delivered: number;
  failed: number;
  read: number;
  deliveryRate: number;
  readRate: number;
}

export interface AnalyticsEventTypeRow {
  eventType: string;
  total: number;
  delivered: number;
  failed: number;
  read: number;
  deliveryRate: number;
}

export interface AnalyticsCategoryRow {
  category: string;
  count: number;
  pct: number;
}

export interface AnalyticsTimelineDay {
  date: string;
  sent: number;
  failed: number;
  read: number;
}

export interface AnalyticsFailures {
  permanentFails: number;
  topErrors: { message: string | null; count: number }[];
  byChannel: { channel: string; count: number }[];
}

export function useAnalyticsOverview(days = 30) {
  return useQuery<AnalyticsOverview>({
    queryKey: ['comms', 'analytics', 'overview', days],
    queryFn: () => apiClient.get<AnalyticsOverview>(`/comms/analytics/overview?days=${days}`),
    staleTime: 120_000,
  });
}

export function useAnalyticsByChannel(days = 30) {
  return useQuery<AnalyticsChannelRow[]>({
    queryKey: ['comms', 'analytics', 'by-channel', days],
    queryFn: () => apiClient.get<AnalyticsChannelRow[]>(`/comms/analytics/by-channel?days=${days}`),
    staleTime: 120_000,
  });
}

export function useAnalyticsByEventType(days = 30) {
  return useQuery<AnalyticsEventTypeRow[]>({
    queryKey: ['comms', 'analytics', 'by-event-type', days],
    queryFn: () => apiClient.get<AnalyticsEventTypeRow[]>(`/comms/analytics/by-event-type?days=${days}`),
    staleTime: 120_000,
  });
}

export function useAnalyticsByCategory(days = 30) {
  return useQuery<AnalyticsCategoryRow[]>({
    queryKey: ['comms', 'analytics', 'by-category', days],
    queryFn: () => apiClient.get<AnalyticsCategoryRow[]>(`/comms/analytics/by-category?days=${days}`),
    staleTime: 120_000,
  });
}

export function useAnalyticsTimeline(days = 30) {
  return useQuery<AnalyticsTimelineDay[]>({
    queryKey: ['comms', 'analytics', 'timeline', days],
    queryFn: () => apiClient.get<AnalyticsTimelineDay[]>(`/comms/analytics/timeline?days=${days}`),
    staleTime: 120_000,
  });
}

export function useAnalyticsFailures(days = 30) {
  return useQuery<AnalyticsFailures>({
    queryKey: ['comms', 'analytics', 'failures', days],
    queryFn: () => apiClient.get<AnalyticsFailures>(`/comms/analytics/failures?days=${days}`),
    staleTime: 120_000,
  });
}

// ─── Preferences ──────────────────────────────────────────────────────────────

export interface NotificationPreference {
  id: string;
  organizationId: string;
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
  language: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietDays: string[];
  mutedCategories: string[];
  createdAt: string;
  updatedAt: string;
}

export function useMyPreferences() {
  return useQuery<NotificationPreference>({
    queryKey: ['comms', 'preferences', 'me'],
    queryFn: () => apiClient.get<NotificationPreference>('/comms/preferences/me'),
    staleTime: 60_000,
  });
}

export function useUpdateMyPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<{
      inAppEnabled: boolean;
      emailEnabled: boolean;
      smsEnabled: boolean;
      whatsappEnabled: boolean;
      pushEnabled: boolean;
      language: string;
      quietHoursEnabled: boolean;
      quietHoursStart: string | null;
      quietHoursEnd: string | null;
      quietDays: string[];
      mutedCategories: string[];
    }>) => apiClient.patch<NotificationPreference>('/comms/preferences/me', dto),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'preferences', 'me'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ updated: number }>('/comms/notifications/mark-all-read', {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comms', 'notifications'] });
      void qc.invalidateQueries({ queryKey: ['comms', 'unread-count'] });
    },
  });
}

// ─── Delivery Logs ────────────────────────────────────────────────────────────

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  provider: string;
  providerMessageId: string | null;
  status: string;
  errorMessage: string | null;
  retryCount: number;
  nextRetryAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  notification: {
    id: string;
    title: string;
    eventType: string;
    channel: string;
    category: string;
    priority: string;
    recipientUserId: string;
  };
}

export interface DeliveryPage {
  total: number;
  page: number;
  limit: number;
  items: NotificationDelivery[];
}

export interface DeliveryStats {
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  retrying: number;
  failed_permanently: number;
  successRate: number;
}

export interface NotificationProviderConfig {
  id: string;
  organizationId: string;
  channel: string;
  providerName: string;
  isEnabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export function useDeliveries(filters?: {
  status?: string;
  channel?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.channel) params.set('channel', filters.channel);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();

  return useQuery<DeliveryPage>({
    queryKey: ['comms', 'deliveries', filters],
    queryFn: () => apiClient.get<DeliveryPage>(`/comms/deliveries${qs ? `?${qs}` : ''}`),
  });
}

export function useDeliveryStats() {
  return useQuery<DeliveryStats>({
    queryKey: ['comms', 'deliveries', 'stats'],
    queryFn: () => apiClient.get<DeliveryStats>('/comms/deliveries/stats'),
    refetchInterval: 30_000,
  });
}

export function useRetryDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<NotificationDelivery>(`/comms/deliveries/${id}/retry`, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'deliveries'] }),
  });
}

export function useBulkRetryFailed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ queued: number }>('/comms/deliveries/retry-failed', {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'deliveries'] }),
  });
}

export function useProviderConfigs() {
  return useQuery<NotificationProviderConfig[]>({
    queryKey: ['comms', 'provider-configs'],
    queryFn: () => apiClient.get<NotificationProviderConfig[]>('/comms/provider-configs'),
  });
}

export function useUpsertProviderConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { channel: string; providerName: string; isEnabled: boolean; priority?: number }) =>
      apiClient.post<NotificationProviderConfig>('/comms/provider-configs', dto),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'provider-configs'] }),
  });
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

export function useNotifications(
  filters?: {
    recipientUserId?: string;
    status?: string;
    channel?: string;
    category?: string;
  },
  options?: { refetchInterval?: number },
) {
  const params = new URLSearchParams();
  if (filters?.recipientUserId) params.set('recipientUserId', filters.recipientUserId);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.channel) params.set('channel', filters.channel);
  if (filters?.category) params.set('category', filters.category);
  const qs = params.toString();
  return useQuery<AppNotification[]>({
    queryKey: ['comms', 'notifications', filters],
    queryFn: () =>
      apiClient.get<AppNotification[]>(`/comms/notifications${qs ? `?${qs}` : ''}`),
    staleTime: 30_000,
    refetchInterval: options?.refetchInterval ?? 60_000,
    retry: 1,
  });
}

export function useUnreadCount(options?: { refetchInterval?: number }) {
  return useQuery<{ count: number }>({
    queryKey: ['comms', 'notifications', 'unread-count'],
    queryFn: () => apiClient.get<{ count: number }>('/comms/notifications/unread-count'),
    staleTime: 30_000,
    refetchInterval: options?.refetchInterval ?? 60_000,
    retry: 1,
  });
}

export function useNotificationStats() {
  return useQuery<NotificationStats>({
    queryKey: ['comms', 'notifications', 'stats'],
    queryFn: () => apiClient.get<NotificationStats>('/comms/notifications/stats'),
    staleTime: 60_000,
    refetchInterval: 120_000,
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

export function useSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      recipientUserId: string;
      eventType: string;
      category?: string;
      priority?: string;
      title: string;
      message: string;
      channel: string;
      entityType?: string | undefined;
      entityId?: string | undefined;
      actionUrl?: string | undefined;
    }) => apiClient.post<AppNotification>('/comms/notifications', dto),
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

// ─── Notification Schedules ───────────────────────────────────────────────────

export interface NotificationSchedule {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  recurrence: string;
  scheduledAt: string | null;
  cronExpression: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  runCount: number;
  title: string;
  message: string;
  audienceType: string;
  audienceTarget: string | null;
  templateId: string | null;
  channels: string[];
  priority: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useNotifSchedules(filters?: { recurrence?: string; isActive?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.recurrence) params.set('recurrence', filters.recurrence);
  if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
  const qs = params.toString();
  return useQuery<NotificationSchedule[]>({
    queryKey: ['comms', 'schedules', filters],
    queryFn: () => apiClient.get<NotificationSchedule[]>(`/comms/schedules${qs ? `?${qs}` : ''}`),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCreateNotifSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      name: string;
      description?: string;
      recurrence: string;
      scheduledAt?: string;
      cronExpression?: string;
      title: string;
      message: string;
      audienceType: string;
      audienceTarget?: string;
      templateId?: string;
      channels: string[];
      priority?: string;
      category?: string;
    }) => apiClient.post<NotificationSchedule>('/comms/schedules', dto),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'schedules'] }),
  });
}

export function useUpdateNotifSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: Partial<NotificationSchedule> & { id: string }) =>
      apiClient.patch<NotificationSchedule>(`/comms/schedules/${id}`, dto),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'schedules'] }),
  });
}

export function useToggleNotifSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<NotificationSchedule>(`/comms/schedules/${id}/toggle`, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'schedules'] }),
  });
}

export function useDeleteNotifSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/comms/schedules/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'schedules'] }),
  });
}

// ─── Inbound Messages ─────────────────────────────────────────────────────────

export interface InboundMessage {
  id: string;
  organizationId: string;
  channel: string;
  fromAddress: string;
  body: string;
  providerMsgId: string | null;
  status: string;
  processedAt: string | null;
  createdAt: string;
}

export interface InboundPage {
  total: number;
  page: number;
  limit: number;
  items: InboundMessage[];
}

export function useInboundMessages(
  filters?: { channel?: string; status?: string },
  page = 1,
  limit = 50,
) {
  const params = new URLSearchParams();
  if (filters?.channel) params.set('channel', filters.channel);
  if (filters?.status) params.set('status', filters.status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return useQuery<InboundPage>({
    queryKey: ['comms', 'inbound', filters, page, limit],
    queryFn: () => apiClient.get<InboundPage>(`/comms/inbound?${params.toString()}`),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useMarkInboundProcessed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<InboundMessage>(`/comms/inbound/${id}/process`, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comms', 'inbound'] }),
  });
}
