/**
 * FINServ Authentication Provider
 * Manages reactive user profile, JWT access token, auto-session hydration,
 * and session-expiry event propagation.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserSummary, AuthResponse, LoginPayload, RegisterPayload } from '@/types/auth';
import {
  apiClient,
  getStoredAccessToken,
  getStoredRefreshToken,
  setAuthTokens,
  clearAuthTokens,
} from '@/lib/api-client';
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getStoredAccessToken());
  const [isLoading, setIsLoading] = useState<boolean>(
    () => Boolean(getStoredAccessToken() || getStoredRefreshToken())
  );

  const fetchCurrentUser = useCallback(async (): Promise<UserSummary | null> => {
    try {
      const summary = await apiClient.get<UserSummary>('/auth/me');
      setUser(summary);
      setAccessToken(getStoredAccessToken());
      return summary;
    } catch {
      clearAuthTokens();
      setUser(null);
      setAccessToken(null);
      return null;
    }
  }, []);

  // Initial session hydration via async non-cascading mount
  useEffect(() => {
    let isMounted = true;
    const token = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();

    if (token || refreshToken) {
      apiClient
        .get<UserSummary>('/auth/me')
        .then((summary) => {
          if (!isMounted) return;
          setUser(summary);
          setAccessToken(getStoredAccessToken());
        })
        .catch(() => {
          if (!isMounted) return;
          clearAuthTokens();
          setUser(null);
          setAccessToken(null);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }

    const handleSessionExpired = () => {
      clearAuthTokens();
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('finserv:session-expired', handleSessionExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('finserv:session-expired', handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload, {
      skipAuth: true,
    });
    setAuthTokens(response.accessToken, response.refreshToken);
    setAccessToken(response.accessToken);
    setUser(response.user);
    return response;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload, {
      skipAuth: true,
    });
    setAuthTokens(response.accessToken, response.refreshToken);
    setAccessToken(response.accessToken);
    setUser(response.user);
    return response;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = getStoredRefreshToken();
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken }, { skipAuth: false });
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      clearAuthTokens();
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      register,
      logout,
      refreshUser: fetchCurrentUser,
    }),
    [user, accessToken, isLoading, login, register, logout, fetchCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
