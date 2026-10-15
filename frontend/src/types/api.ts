/**
 * API Type Definitions for FINServ
 * Strictly matches backend ErrorResponse (RFC 7807 problem details) and ApiResponse<T>
 */

export interface ApiResponse<T> {
  success: boolean;
  correlationId: string;
  data: T;
}

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export interface BackendErrorResponse {
  success: false;
  timestamp?: string;
  status: number;
  errorCode: string;
  message: string;
  path?: string;
  correlationId: string;
  validationErrors?: ValidationErrorItem[];
}

export interface AppError {
  status: number;
  code: string;
  message: string;
  userMessage: string;
  correlationId?: string;
  validationErrors?: Record<string, string>;
  raw?: unknown;
}

export interface ActuatorHealthResponse {
  status: 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'UNKNOWN';
  components?: Record<string, { status: string; details?: Record<string, unknown> }>;
  groups?: string[];
}
