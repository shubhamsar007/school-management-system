import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  roles: Array<{
    code: string;
    name: string;
    campusId: string | null;
    campusName: string | null;
  }>;
}

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient.get<CurrentUser>('/auth/me'),
    staleTime: 10 * 60_000, // 10 min
    retry: 1,
  });
}
