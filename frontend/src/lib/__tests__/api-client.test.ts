/**
 * Unit Tests for ApiClient and Problem Details Normalization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../api-client';

describe('ApiClient (api-client.ts)', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('/api/v1');
    vi.restoreAllMocks();
  });

  describe('Problem Details Error Mapping', () => {
    it('normalizes 400 validation error into AppError with field error dictionary', () => {
      const backendError = {
        success: false,
        status: 400,
        errorCode: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        path: '/api/v1/accounts',
        correlationId: 'corr-12345',
        validationErrors: [
          { field: 'accountProductCode', message: 'Product code is required' },
          { field: 'initialDeposit', message: 'Minimum deposit is ₹1,000' },
        ],
      };

      const appError = client.parseBackendProblemDetails(400, backendError, 'header-corr');
      expect(appError.status).toBe(400);
      expect(appError.code).toBe('VALIDATION_ERROR');
      expect(appError.correlationId).toBe('corr-12345');
      expect(appError.validationErrors).toEqual({
        accountProductCode: 'Product code is required',
        initialDeposit: 'Minimum deposit is ₹1,000',
      });
      expect(appError.userMessage).toContain('Please check the highlighted form fields');
    });

    it('normalizes 401 unauthorized', () => {
      const appError = client.parseBackendProblemDetails(401, {
        errorCode: 'UNAUTHORIZED',
        message: 'JWT expired',
      });
      expect(appError.status).toBe(401);
      expect(appError.userMessage).toContain('unauthenticated or has expired');
    });

    it('normalizes 403 access denied', () => {
      const appError = client.parseBackendProblemDetails(403, {
        errorCode: 'ACCESS_DENIED',
        message: 'Role CUSTOMER cannot access teller ledger',
      });
      expect(appError.status).toBe(403);
      expect(appError.userMessage).toContain('do not have authorized permissions');
    });

    it('normalizes 409 concurrency conflict', () => {
      const appError = client.parseBackendProblemDetails(409, {
        errorCode: 'CONCURRENCY_CONFLICT',
        message: 'Optimistic lock failure',
      });
      expect(appError.status).toBe(409);
      expect(appError.userMessage).toContain('Concurrent modification detected');
    });

    it('normalizes 500 internal server error with correlation ID for user quote', () => {
      const appError = client.parseBackendProblemDetails(500, {
        errorCode: 'INTERNAL_SERVER_ERROR',
        correlationId: 'corr-999-secure',
      });
      expect(appError.status).toBe(500);
      expect(appError.userMessage).toContain('corr-999-secure');
    });

    it('normalizes network errors safely', () => {
      const networkError = new TypeError('Failed to fetch');
      const appError = client.normalizeError(networkError, 'corr-net');
      expect(appError.status).toBe(0);
      expect(appError.code).toBe('NETWORK_ERROR');
      expect(appError.userMessage).toContain('Unable to connect to FINServ secure banking servers');
    });
  });

  describe('Headers and Interceptors', () => {
    it('injects X-Correlation-ID and X-Idempotency-Key headers on idempotent calls', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: 'ok' }),
      });
      vi.stubGlobal('fetch', fetchSpy);

      await client.post('/transactions/transfer', { amount: '500' }, { idempotent: true });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const firstCall = fetchSpy.mock.calls[0];
      expect(firstCall).toBeDefined();
      const calledUrl = firstCall![0];
      const calledInit = firstCall![1];

      expect(calledUrl).toBe('/api/v1/transactions/transfer');
      const headers = calledInit?.headers as Headers;
      expect(headers.get('X-Correlation-ID')).toBeDefined();
      expect(headers.get('X-Idempotency-Key')).toBeDefined();
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });
});
