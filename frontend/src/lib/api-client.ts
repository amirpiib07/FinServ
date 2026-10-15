/**
 * FINServ Typed HTTP Client
 * - Configured base URL from environment (VITE_API_BASE_URL)
 * - Request interceptors: token stub for Phase 4, X-Correlation-ID propagation, timeout
 * - Response interceptors: X-Correlation-ID header extraction
 * - Normalized AppError mapping for RFC 7807 problem details and network errors
 */

import type { AppError, BackendErrorResponse } from '@/types/api';
import { generateIdempotencyKey } from './idempotency';

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  idempotent?: boolean;
  correlationId?: string;
  skipAuth?: boolean;
}

const DEFAULT_TIMEOUT_MS = 15000;

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? (import.meta.env.VITE_API_BASE_URL || '/api/v1');
  }

  /**
   * Phase 4 Auth Token Stub (to be wired to session storage / memory in Phase 4)
   */
  private getAuthToken(): string | null {
    return null;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Normalizes any HTTP error, problem details, or network failure into AppError
   */
  public normalizeError(error: unknown, correlationId?: string): AppError {
    if (typeof error === 'object' && error !== null && 'code' in error && 'userMessage' in error) {
      return error as AppError;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        status: 408,
        code: 'TIMEOUT',
        message: 'Request timed out after waiting for server response.',
        userMessage: 'The request timed out. Please verify your connection and try again.',
        correlationId,
      };
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        status: 0,
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage:
          'Unable to connect to FINServ secure banking servers. Please verify your network connection.',
        correlationId,
      };
    }

    return {
      status: 500,
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      userMessage: 'An unexpected banking error occurred. Please contact support.',
      correlationId,
      raw: error,
    };
  }

  public parseBackendProblemDetails(
    status: number,
    body: unknown,
    responseCorrId?: string
  ): AppError {
    const errorBody = body as Partial<BackendErrorResponse> | undefined;
    const correlationId = errorBody?.correlationId || responseCorrId || generateIdempotencyKey();
    const errorCode = errorBody?.errorCode || `HTTP_${status}`;
    const rawMessage = errorBody?.message || `HTTP ${status} response`;

    // Map validation error list into a field -> message map
    const validationErrors: Record<string, string> = {};
    if (Array.isArray(errorBody?.validationErrors)) {
      for (const err of errorBody.validationErrors) {
        if (err.field && err.message) {
          validationErrors[err.field] = err.message;
        }
      }
    }

    let userMessage: string;
    switch (status) {
      case 400:
        userMessage =
          Object.keys(validationErrors).length > 0
            ? 'Please check the highlighted form fields and try again.'
            : rawMessage || 'Invalid request parameters.';
        break;
      case 401:
        userMessage = 'Your banking session is unauthenticated or has expired. Please sign in.';
        break;
      case 403:
        userMessage = 'You do not have authorized permissions to perform this banking operation.';
        break;
      case 404:
        userMessage = 'The requested banking resource could not be found.';
        break;
      case 409:
        userMessage =
          'Concurrent modification detected. The record was modified by another operation. Please refresh.';
        break;
      case 422:
        userMessage = rawMessage || 'Unable to process transaction due to business validation rules.';
        break;
      case 500:
      default:
        userMessage = `A banking system error occurred. Please quote Reference ID: ${correlationId}`;
        break;
    }

    return {
      status,
      code: errorCode,
      message: rawMessage,
      userMessage,
      correlationId,
      validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : undefined,
      raw: body,
    };
  }

  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const correlationId = options.correlationId || generateIdempotencyKey();
    const headers = new Headers(options.headers || {});

    // Interceptor: Attach standard JSON and correlation headers
    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('X-Correlation-ID')) {
      headers.set('X-Correlation-ID', correlationId);
    }

    // Interceptor: Attach Idempotency Key for money/mutation calls if requested
    if (options.idempotent && !headers.has('X-Idempotency-Key')) {
      headers.set('X-Idempotency-Key', generateIdempotencyKey());
    }

    // Interceptor: Auth token attachment stub for Phase 4
    if (!options.skipAuth) {
      const token = this.getAuthToken();
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Interceptor: Timeout handling via AbortController
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // If caller provided their own signal, chain it
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    const url = path.startsWith('http://') || path.startsWith('https://')
      ? path
      : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseCorrId = response.headers.get('X-Correlation-ID') || correlationId;

      if (!response.ok) {
        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = await response.text();
        }
        throw this.parseBackendProblemDetails(response.status, body, responseCorrId);
      }

      // Check if response is empty (e.g. 204 No Content)
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      return (await response.text()) as unknown as T;
    } catch (err) {
      clearTimeout(timeoutId);
      throw this.normalizeError(err, correlationId);
    }
  }

  public get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
