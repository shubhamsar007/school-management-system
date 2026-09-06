import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  AcademicClass,
  Section,
  Subject,
  ClassSubject,
  AcademicsStats,
  Campus,
  AcademicYear,
  CalendarEvent,
  TeacherAssignment,
  ClassTeacherCoverage,
  PromotionRun,
} from '@/lib/types/academics';

// Re-export types so existing imports from this file keep working
export type { AcademicClass, Section, AcademicYear, Campus };

// ─── Organisation / Lookup ────────────────────────────────────────────────────

export function useOrganization() {
  return useQuery<{ id: string; name: string }>({
    queryKey: ['organization', 'me'],
    queryFn: () => apiClient.get('/organizations/me'),
    staleTime: Infinity,
    retry: 1,
  });
}

export function useAcademicYears(orgId: string | undefined) {
  return useQuery<AcademicYear[]>({
    queryKey: ['academic-years', orgId],
    queryFn: () => apiClient.get(`/organizations/${orgId}/academic-years`),
    enabled: !!orgId,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCampuses(orgId: string | undefined) {
  return useQuery<Campus[]>({
    queryKey: ['campuses', orgId],
    queryFn: () => apiClient.get(`/organizations/${orgId}/campuses`),
    enabled: !!orgId,
    staleTime: Infinity,
    retry: 1,
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function useAcademicsStats(academicYearId?: string) {
  return useQuery<AcademicsStats>({
    queryKey: ['academics', 'stats', academicYearId],
    queryFn: () => {
      const params = academicYearId ? `?academicYearId=${academicYearId}` : '';
      return apiClient.get(`/academics/stats${params}`);
    },
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

// ─── Classes ──────────────────────────────────────────────────────────────────

export function useClasses() {
  return useQuery<AcademicClass[]>({
    queryKey: ['academics', 'classes'],
    queryFn: () => apiClient.get<AcademicClass[]>('/academics/classes'),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useClass(id: string | null) {
  return useQuery<AcademicClass>({
    queryKey: ['academics', 'classes', id],
    queryFn: () => apiClient.get<AcademicClass>(`/academics/classes/${id}`),
    enabled: !!id,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; code: string; level?: number; displayOrder?: number }) =>
      apiClient.post('/academics/classes', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'classes'] });
      void qc.invalidateQueries({ queryKey: ['academics', 'stats'] });
    },
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: { name?: string; code?: string; level?: number | null; displayOrder?: number | null; status?: string };
    }) => apiClient.patch(`/academics/classes/${id}`, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'classes'] });
      void qc.invalidateQueries({ queryKey: ['academics', 'stats'] });
    },
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/academics/classes/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'classes'] });
      void qc.invalidateQueries({ queryKey: ['academics', 'stats'] });
    },
  });
}

// ─── Sections ─────────────────────────────────────────────────────────────────

export function useSections(classId: string | null) {
  return useQuery<Section[]>({
    queryKey: ['academics', 'sections', classId],
    queryFn: () => apiClient.get<Section[]>(`/academics/classes/${classId}/sections`),
    enabled: !!classId,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      dto,
    }: {
      classId: string;
      dto: { campusId: string; name: string; code: string; capacity?: number };
    }) => apiClient.post(`/academics/classes/${classId}/sections`, dto),
    onSuccess: (_data, { classId }) => {
      void qc.invalidateQueries({ queryKey: ['academics', 'sections', classId] });
      void qc.invalidateQueries({ queryKey: ['academics', 'classes'] });
      void qc.invalidateQueries({ queryKey: ['academics', 'stats'] });
    },
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      sectionId,
      dto,
    }: {
      classId: string;
      sectionId: string;
      dto: { name?: string; code?: string; capacity?: number | null; status?: string };
    }) => apiClient.patch(`/academics/classes/${classId}/sections/${sectionId}`, dto),
    onSuccess: (_data, { classId }) => {
      void qc.invalidateQueries({ queryKey: ['academics', 'sections', classId] });
      void qc.invalidateQueries({ queryKey: ['academics', 'classes'] });
    },
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, sectionId }: { classId: string; sectionId: string }) =>
      apiClient.delete(`/academics/classes/${classId}/sections/${sectionId}`),
    onSuccess: (_data, { classId }) => {
      void qc.invalidateQueries({ queryKey: ['academics', 'sections', classId] });
      void qc.invalidateQueries({ queryKey: ['academics', 'classes'] });
      void qc.invalidateQueries({ queryKey: ['academics', 'stats'] });
    },
  });
}

// ─── Subjects ─────────────────────────────────────────────────────────────────

export function useSubjects() {
  return useQuery<Subject[]>({
    queryKey: ['academics', 'subjects'],
    queryFn: () => apiClient.get<Subject[]>('/academics/subjects'),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      name: string;
      code: string;
      subjectType: string;
      description?: string;
    }) => apiClient.post('/academics/subjects', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'subjects'] });
      void qc.invalidateQueries({ queryKey: ['academics', 'stats'] });
    },
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: { name?: string; code?: string; subjectType?: string; description?: string | null; status?: string };
    }) => apiClient.patch(`/academics/subjects/${id}`, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'subjects'] });
      void qc.invalidateQueries({ queryKey: ['academics', 'stats'] });
    },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/academics/subjects/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'subjects'] });
      void qc.invalidateQueries({ queryKey: ['academics', 'stats'] });
    },
  });
}

// ─── Class Subjects ───────────────────────────────────────────────────────────

export function useClassSubjects(classId?: string, academicYearId?: string) {
  const params = new URLSearchParams();
  if (classId) params.set('classId', classId);
  if (academicYearId) params.set('academicYearId', academicYearId);
  const qs = params.toString();

  return useQuery<ClassSubject[]>({
    queryKey: ['academics', 'class-subjects', classId, academicYearId],
    queryFn: () => apiClient.get<ClassSubject[]>(`/academics/class-subjects${qs ? `?${qs}` : ''}`),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useAssignSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      academicYearId: string;
      classId: string;
      subjectId: string;
      isOptional?: boolean;
      maxMarks?: number;
      passingMarks?: number;
      weightage?: number;
    }) => apiClient.post('/academics/class-subjects', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'class-subjects'] });
      void qc.invalidateQueries({ queryKey: ['academics', 'stats'] });
    },
  });
}

export function useUpdateClassSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: {
        isOptional?: boolean;
        maxMarks?: number | null;
        passingMarks?: number | null;
        weightage?: number | null;
        status?: string;
      };
    }) => apiClient.patch(`/academics/class-subjects/${id}`, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'class-subjects'] });
    },
  });
}

export function useRemoveClassSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/academics/class-subjects/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'class-subjects'] });
      void qc.invalidateQueries({ queryKey: ['academics', 'stats'] });
    },
  });
}

// ─── Teacher Assignments (academic read view) ─────────────────────────────────

export function useTeacherAssignments(academicYearId?: string, classId?: string) {
  const params = new URLSearchParams();
  if (academicYearId) params.set('academicYearId', academicYearId);
  if (classId) params.set('classId', classId);
  const qs = params.toString();

  return useQuery<TeacherAssignment[]>({
    queryKey: ['academics', 'assignments', { academicYearId, classId }],
    queryFn: () => apiClient.get<TeacherAssignment[]>(`/academics/assignments${qs ? `?${qs}` : ''}`),
    enabled: !!academicYearId,
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useClassTeacherCoverage(academicYearId?: string) {
  return useQuery<ClassTeacherCoverage[]>({
    queryKey: ['academics', 'class-teachers', academicYearId],
    queryFn: () =>
      apiClient.get<ClassTeacherCoverage[]>(
        `/academics/class-teachers?academicYearId=${academicYearId}`,
      ),
    enabled: !!academicYearId,
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

// ─── Academic Calendar ────────────────────────────────────────────────────────

export function useCalendarEvents(academicYearId?: string, month?: number, year?: number) {
  const params = new URLSearchParams();
  if (academicYearId) params.set('academicYearId', academicYearId);
  if (month) params.set('month', String(month));
  if (year) params.set('year', String(year));
  const qs = params.toString();

  return useQuery<CalendarEvent[]>({
    queryKey: ['academics', 'calendar', { academicYearId, month, year }],
    queryFn: () => apiClient.get<CalendarEvent[]>(`/academics/calendar${qs ? `?${qs}` : ''}`),
    enabled: !!academicYearId,
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      academicYearId: string;
      title: string;
      eventType?: string;
      startDate: string;
      endDate: string;
      isSchoolClosed?: boolean;
      description?: string;
      campusId?: string;
    }) => apiClient.post<CalendarEvent>('/academics/calendar', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'calendar'] });
    },
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: {
        title?: string;
        eventType?: string;
        startDate?: string;
        endDate?: string;
        isSchoolClosed?: boolean;
        description?: string | null;
        campusId?: string | null;
      };
    }) => apiClient.patch<CalendarEvent>(`/academics/calendar/${id}`, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'calendar'] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/academics/calendar/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'calendar'] });
    },
  });
}

// ─── Promotion Runs ───────────────────────────────────────────────────────────

export function usePromotionRuns(fromYearId?: string) {
  return useQuery<PromotionRun[]>({
    queryKey: ['academics', 'promotions', fromYearId],
    queryFn: () => {
      const qs = fromYearId ? `?fromYearId=${fromYearId}` : '';
      return apiClient.get<PromotionRun[]>(`/academics/promotions${qs}`);
    },
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function usePromotionRun(id: string | null) {
  return useQuery<PromotionRun>({
    queryKey: ['academics', 'promotions', id],
    queryFn: () => apiClient.get<PromotionRun>(`/academics/promotions/${id}`),
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCreatePromotionRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      fromYearId: string;
      toYearId: string;
      fromClassId: string;
      toClassId: string;
      notes?: string;
    }) => apiClient.post<PromotionRun>('/academics/promotions', dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'promotions'] });
    },
  });
}

export function useUpdatePromotionResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      results,
    }: {
      id: string;
      results: { studentId: string; outcome: string; notes?: string }[];
    }) => apiClient.patch<PromotionRun>(`/academics/promotions/${id}/results`, { results }),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ['academics', 'promotions', id] });
      void qc.invalidateQueries({ queryKey: ['academics', 'promotions'] });
    },
  });
}

export function useFinalizePromotionRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{ id: string; status: string; promoted: number; heldBack: number; transferred: number }>(
        `/academics/promotions/${id}/finalize`,
        {},
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'promotions'] });
    },
  });
}

export function useDeletePromotionRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/academics/promotions/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'promotions'] });
    },
  });
}
