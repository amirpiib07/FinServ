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
    refetchInterval: 30000, // Check every 30s
    retry: 1,
  });
}
