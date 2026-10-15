import { apiClient } from '@/lib/api-client';
import type {
  Beneficiary,
  CreateBeneficiaryPayload,
  VerifyBeneficiaryPayload,
} from '@/types/beneficiary';

export const beneficiaryService = {
  async getBeneficiaries(): Promise<Beneficiary[]> {
    return apiClient.get<Beneficiary[]>('/api/v1/beneficiaries');
  },

  async addBeneficiary(payload: CreateBeneficiaryPayload): Promise<Beneficiary> {
    return apiClient.post<Beneficiary>('/api/v1/beneficiaries', payload, {
      idempotent: true,
    });
  },

  async verifyBeneficiary(id: string, payload: VerifyBeneficiaryPayload): Promise<Beneficiary> {
    return apiClient.post<Beneficiary>(`/api/v1/beneficiaries/${id}/verify`, payload);
  },

  async deleteBeneficiary(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/beneficiaries/${id}`);
  },
};
