import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface CopyResult {
  targetYearId: string;
  targetYearName: string;
  sourceYearName: string;
  curriculumCopied: number;
  assignmentsCopied: number;
}

// ─── Mutations (queries live in use-academics.ts via useAcademicYears) ────────

export function useCreateAcademicYear(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      name: string;
      code: string;
      startDate: string;
      endDate: string;
      status?: string;
    }) => apiClient.post(`/organizations/${orgId}/academic-years`, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academic-years', orgId] });
    },
  });
}

export function useCopyAcademicYear(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      targetYearId,
      dto,
    }: {
      targetYearId: string;
      dto: { sourceYearId: string; copyCurriculum?: boolean; copyTeacherAssignments?: boolean };
    }) =>
      apiClient.post<CopyResult>(
        `/organizations/${orgId}/academic-years/${targetYearId}/copy`,
        dto,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academic-years', orgId] });
      void qc.invalidateQueries({ queryKey: ['academics', 'class-subjects'] });
      void qc.invalidateQueries({ queryKey: ['academics', 'stats'] });
    },
  });
}

export function useUpdateAcademicYear(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      yearId,
      dto,
    }: {
      yearId: string;
      dto: {
        name?: string;
        code?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
        isCurrent?: boolean;
      };
    }) => apiClient.patch(`/organizations/${orgId}/academic-years/${yearId}`, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academic-years', orgId] });
    },
  });
}
