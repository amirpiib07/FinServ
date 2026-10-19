/**
 * Authentication and User Identity Types for FINServ
 */

export interface UserSummary {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  employeeName?: string | null;
  email: string;
  phoneNumber: string;
  status: string;
  roles: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: UserSummary;
}

export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface SendOtpPayload {
  destination?: string;
  type?: 'EMAIL' | 'SMS';
  contactType?: 'EMAIL' | 'SMS' | string;
  targetDestination?: string;
  purpose: 'REGISTRATION' | 'LOGIN' | 'TRANSACTION' | 'PASSWORD_RESET' | string;
}

export interface SendOtpResponse {
  challengeId?: string;
  referenceId?: string;
  destinationMasked?: string;
  maskedDestination?: string;
  contactType?: string;
  targetDestination?: string;
  expiresInSeconds: number;
  retryAfterSeconds?: number;
  simulatedOtp?: string;
}

export interface VerifyOtpPayload {
  challengeId?: string;
  referenceId?: string;
  otpCode: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  message: string;
  userId?: string;
}
