import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { transferService } from '../transferService';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn(),
  },
}));

describe('transferService date filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends complete IST day boundaries for date-only statement filters', async () => {
    await transferService.getTransactions({
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/transactions?startDate=2026-10-01T00%3A00%3A00%2B05%3A30&endDate=2026-10-31T23%3A59%3A59.999999%2B05%3A30'
    );
  });

  it('preserves existing ISO datetime filters', async () => {
    await transferService.getAccountTransactions('account-1', {
      startDate: '2026-10-01T00:00:00Z',
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/accounts/account-1/transactions?startDate=2026-10-01T00%3A00%3A00Z'
    );
  });
});
