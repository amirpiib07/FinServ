import { apiClient } from '@/lib/api-client';
import type {
  AdminOverviewDto,
  AdminPageResponse,
  AdminKycApplicationDto,
  AdminAccountSummaryDto,
  AdminAccountApplicationDto,
  BranchDto,
  StaffDto,
  CreateBranchRequest,
  CreateStaffRequest,
  GlTrialBalanceDto,
  AuditLogDto,
} from '@/types/admin';

export const adminService = {
  getOverview(): Promise<AdminOverviewDto> {
    return apiClient.get<AdminOverviewDto>('/api/v1/admin/overview');
  },

  getKycApplications(params: {
    status?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<AdminPageResponse<AdminKycApplicationDto>> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page !== undefined) query.set('page', params.page.toString());
    if (params.size !== undefined) query.set('size', params.size.toString());
    const qs = query.toString();
    return apiClient.get<AdminPageResponse<AdminKycApplicationDto>>(
      `/api/v1/admin/kyc/applications${qs ? '?' + qs : ''}`
    );
  },

  decideKycApplication(
    id: string,
    body: { decision: 'APPROVE' | 'REJECT'; remarks: string }
  ): Promise<AdminKycApplicationDto> {
    return apiClient.post<AdminKycApplicationDto>(
      `/api/v1/admin/kyc/applications/${id}/decide`,
      body
    );
  },

  getAccounts(params: {
    status?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<AdminPageResponse<AdminAccountSummaryDto>> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page !== undefined) query.set('page', params.page.toString());
    if (params.size !== undefined) query.set('size', params.size.toString());
    const qs = query.toString();
    return apiClient.get<AdminPageResponse<AdminAccountSummaryDto>>(
      `/api/v1/admin/accounts${qs ? '?' + qs : ''}`
    );
  },

  updateAccountStatus(
    id: string,
    body: { status: 'ACTIVE' | 'FROZEN'; reason: string }
  ): Promise<AdminAccountSummaryDto> {
    return apiClient.patch<AdminAccountSummaryDto>(
      `/api/v1/admin/accounts/${id}/status`,
      body
    );
  },

  getAccountApplications(params: {
    status?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<AdminPageResponse<AdminAccountApplicationDto>> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page !== undefined) query.set('page', params.page.toString());
    if (params.size !== undefined) query.set('size', params.size.toString());
    const qs = query.toString();
    return apiClient.get<AdminPageResponse<AdminAccountApplicationDto>>(
      `/api/v1/admin/account-applications${qs ? '?' + qs : ''}`
    );
  },

  decideAccountApplication(
    id: string,
    body: { decision: 'APPROVE' | 'REJECT'; remarks: string }
  ): Promise<AdminAccountApplicationDto> {
    return apiClient.post<AdminAccountApplicationDto>(
      `/api/v1/admin/account-applications/${id}/decide`,
      body
    );
  },

  getBranches(): Promise<BranchDto[]> {
    return apiClient.get<BranchDto[]>('/api/v1/admin/branches');
  },

  createBranch(body: CreateBranchRequest): Promise<BranchDto> {
    return apiClient.post<BranchDto>('/api/v1/admin/branches', body);
  },

  getStaff(): Promise<StaffDto[]> {
    return apiClient.get<StaffDto[]>('/api/v1/admin/staff');
  },

  createStaff(body: CreateStaffRequest): Promise<StaffDto> {
    return apiClient.post<StaffDto>('/api/v1/admin/staff', body);
  },

  getGlSummary(): Promise<GlTrialBalanceDto> {
    return apiClient.get<GlTrialBalanceDto>('/api/v1/admin/ledger/summary');
  },

  getAuditLogs(params: {
    action?: string;
    entityType?: string;
    userId?: string;
    page?: number;
    size?: number;
  }): Promise<AdminPageResponse<AuditLogDto>> {
    const query = new URLSearchParams();
    if (params.action && params.action !== 'ALL') query.set('action', params.action);
    if (params.entityType && params.entityType !== 'ALL') query.set('entityType', params.entityType);
    if (params.userId) query.set('userId', params.userId);
    if (params.page !== undefined) query.set('page', params.page.toString());
    if (params.size !== undefined) query.set('size', params.size.toString());
    const qs = query.toString();
    return apiClient.get<AdminPageResponse<AuditLogDto>>(
      `/api/v1/admin/audit-logs${qs ? '?' + qs : ''}`
    );
  },
};
