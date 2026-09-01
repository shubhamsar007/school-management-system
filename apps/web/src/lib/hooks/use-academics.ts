import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface AcademicYear {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
}

export interface Campus {
  id: string;
  name: string;
  code: string;
  status: string;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AcademicClass {
  id: string;
  name: string;
  code: string;
  level?: number;
  displayOrder?: number;
  status: string;
}

export interface Section {
  id: string;
  name: string;
  code: string;
  capacity?: number;
  status: string;
  academicClassId: string;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useClasses() {
  return useQuery<AcademicClass[]>({
    queryKey: ['academics', 'classes'],
    queryFn: () => apiClient.get<AcademicClass[]>('/academics/classes'),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useSections(classId: string | null) {
  return useQuery<Section[]>({
    queryKey: ['academics', 'sections', classId],
    queryFn: () => apiClient.get<Section[]>(`/academics/classes/${classId}/sections`),
    enabled: !!classId,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

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
