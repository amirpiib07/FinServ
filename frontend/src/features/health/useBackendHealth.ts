/**
 * Hook to query backend Spring Boot Actuator /actuator/health endpoint
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ActuatorHealthResponse } from '@/types/api';

export function useBackendHealth() {
  return useQuery<ActuatorHealthResponse>({
    queryKey: ['backend-health'],
    queryFn: async () => {
      // Actuator is available via the Vite proxy at /actuator/health
      return apiClient.get<ActuatorHealthResponse>('/actuator/health', {
        skipAuth: true,
        timeoutMs: 5000,
      });
    },
    refetchInterval: (query) => {
      // When offline or during initial startup, probe every 3s to auto-detect boot completion
      return query.state.data?.status === 'UP' ? 30000 : 3000;
    },
    retry: 2,
    retryDelay: 1000,
  });
}
