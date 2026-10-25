/**
 * FINServ Transfers & Transaction API Service
 */

import { apiClient } from '@/lib/api-client';
import { generateIdempotencyKey } from '@/lib/idempotency';
import type {
  TransactionDto,
  TransactionReceiptDto,
  TransactionPageResponse,
  DepositRequest,
  WithdrawRequest,
  TransferRequest,
  TransactionFilterParams,
} from '../types/transferTypes';

function toDateTimeBoundary(value: string, endOfDay: boolean): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return `${value}T${endOfDay ? '23:59:59.999999' : '00:00:00'}+05:30`;
}

export const transferService = {
  /**
   * Cash / self-service deposit into active customer account.
   */
  async deposit(req: DepositRequest, idempotencyKey?: string): Promise<TransactionDto> {
    const key = idempotencyKey || generateIdempotencyKey();
    return apiClient.post<TransactionDto>('/transactions/deposit', req, {
      headers: {
        'Idempotency-Key': key,
      },
    });
  },

  /**
   * Cash / ATM withdrawal from active customer account.
   */
  async withdraw(req: WithdrawRequest, idempotencyKey?: string): Promise<TransactionDto> {
    const key = idempotencyKey || generateIdempotencyKey();
    return apiClient.post<TransactionDto>('/transactions/withdraw', req, {
      headers: {
        'Idempotency-Key': key,
      },
    });
  },

  /**
   * Internal or external funds transfer.
   */
  async transfer(req: TransferRequest, idempotencyKey?: string): Promise<TransactionDto> {
    const key = idempotencyKey || generateIdempotencyKey();
    return apiClient.post<TransactionDto>('/transactions/transfer', req, {
      headers: {
        'Idempotency-Key': key,
      },
    });
  },

  /**
   * Filterable customer transaction history & passbook statements.
   */
  async getTransactions(params: TransactionFilterParams = {}): Promise<TransactionPageResponse> {
    const query = new URLSearchParams();
    if (params.accountId) query.set('accountId', params.accountId);
    if (params.type && params.type !== 'ALL') query.set('type', params.type);
    if (params.startDate) query.set('startDate', toDateTimeBoundary(params.startDate, false));
    if (params.endDate) query.set('endDate', toDateTimeBoundary(params.endDate, true));
    if (params.query) query.set('query', params.query);
    if (params.page !== undefined) query.set('page', params.page.toString());
    if (params.size !== undefined) query.set('size', params.size.toString());

    const queryString = query.toString();
    const endpoint = queryString ? `/transactions?${queryString}` : '/transactions';
    return apiClient.get<TransactionPageResponse>(endpoint);
  },

  /**
   * Transactions scoped specifically to an account.
   */
  async getAccountTransactions(
    accountId: string,
    params: TransactionFilterParams = {}
  ): Promise<TransactionPageResponse> {
    const query = new URLSearchParams();
    if (params.type && params.type !== 'ALL') query.set('type', params.type);
    if (params.startDate) query.set('startDate', toDateTimeBoundary(params.startDate, false));
    if (params.endDate) query.set('endDate', toDateTimeBoundary(params.endDate, true));
    if (params.query) query.set('query', params.query);
    if (params.page !== undefined) query.set('page', params.page.toString());
    if (params.size !== undefined) query.set('size', params.size.toString());

    const queryString = query.toString();
    const endpoint = queryString
      ? `/accounts/${accountId}/transactions?${queryString}`
      : `/accounts/${accountId}/transactions`;
    return apiClient.get<TransactionPageResponse>(endpoint);
  },

  /**
   * Official transaction receipt details for print and review.
   */
  async getTransactionReceipt(transactionId: string): Promise<TransactionReceiptDto> {
    return apiClient.get<TransactionReceiptDto>(`/transactions/${transactionId}`);
  },
};
