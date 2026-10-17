import { apiClient } from '@/lib/api-client';
import type {
  AccountProduct,
  Branch,
  BankAccount,
  AccountApplication,
  CreateAccountApplicationPayload,
  UpdateAccountControlsPayload,
} from '@/types/account';

export const accountService = {
  async getAccountProducts(): Promise<AccountProduct[]> {
    return apiClient.get<AccountProduct[]>('/api/v1/products/accounts');
  },

  async getBranches(): Promise<Branch[]> {
    return apiClient.get<Branch[]>('/api/v1/branches');
  },

  async getMyAccounts(): Promise<BankAccount[]> {
    return apiClient.get<BankAccount[]>('/api/v1/accounts');
  },

  async getAccountById(id: string): Promise<BankAccount> {
    return apiClient.get<BankAccount>(`/api/v1/accounts/${id}`);
  },

  async applyForAccount(payload: CreateAccountApplicationPayload): Promise<AccountApplication> {
    return apiClient.post<AccountApplication>('/api/v1/accounts/applications', payload, {
      idempotent: true,
    });
  },

  async updateAccountControls(id: string, payload: UpdateAccountControlsPayload): Promise<BankAccount> {
    return apiClient.patch<BankAccount>(`/api/v1/accounts/${id}/controls`, payload);
  },

  async getMyApplications(): Promise<AccountApplication[]> {
    return apiClient.get<AccountApplication[]>('/api/v1/accounts/applications');
  },
};
