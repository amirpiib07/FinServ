import { apiClient } from '@/lib/api-client';
import { generateIdempotencyKey } from '@/lib/idempotency';
import type { BookFixedDepositRequest, FdRateSlab, FixedDeposit } from '@/types/deposit';

export const depositService = {
  /**
   * Fetch official bank Fixed Deposit interest rate slabs
   */
  async getRateSlabs(): Promise<FdRateSlab[]> {
    return apiClient.get<FdRateSlab[]>('/deposits/rates');
  },

  /**
   * Fetch customer's active and historical fixed deposits
   */
  async getCustomerDeposits(): Promise<FixedDeposit[]> {
    return apiClient.get<FixedDeposit[]>('/deposits');
  },

  /**
   * Book a new fixed deposit funded from an active account
   */
  async bookFixedDeposit(req: BookFixedDepositRequest, idempotencyKey?: string): Promise<FixedDeposit> {
    const key = idempotencyKey || generateIdempotencyKey();
    return apiClient.post<FixedDeposit>('/deposits', req, {
      headers: {
        'Idempotency-Key': key,
      },
    });
  },
};
