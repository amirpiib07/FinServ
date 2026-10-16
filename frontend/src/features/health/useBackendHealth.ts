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
      const res = await apiClient.get<ActuatorHealthResponse | string>('/actuator/health', {
        skipAuth: true,
        timeoutMs: 5000,
      });
      if (typeof res === 'string') {
        try {
          return JSON.parse(res) as ActuatorHealthResponse;
        } catch {
          return { status: 'UNKNOWN' };
        }
      }
      return res;
    },
    refetchInterval: (query) => {
      // When offline or during initial startup, probe every 3s to auto-detect boot completion
      return query.state.data?.status === 'UP' ? 30000 : 3000;
    },
    retry: 2,
    retryDelay: 1000,
  });
}
