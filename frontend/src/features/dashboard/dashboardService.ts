import { apiClient } from '@/lib/api-client';
import type { CustomerDashboardOverview } from '@/types/dashboard';

export const dashboardService = {
  getCustomerDashboard(): Promise<CustomerDashboardOverview> {
    return apiClient.get<CustomerDashboardOverview>('/api/v1/dashboard/customer');
  },
};
