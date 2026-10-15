import { createContext } from 'react';
import type { UserSummary, AuthResponse, LoginPayload, RegisterPayload } from '@/types/auth';

export interface AuthContextType {
  user: UserSummary | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserSummary | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
