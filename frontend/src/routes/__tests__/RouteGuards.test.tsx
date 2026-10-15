import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { RoleRoute } from '../RoleRoute';
import * as useAuthModule from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');

describe('Route Guards', () => {
  const mockUseAuth = vi.spyOn(useAuthModule, 'useAuth');

  it('renders loading fallback when auth state is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      accessToken: null,
      isLoading: true,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute><div>Secret Content</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Verifying secure banking session...')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated user to /login', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/protected" element={<ProtectedRoute><div>Secret Content</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('redirects unverified customer (status=PENDING_VERIFICATION) to /onboarding when requireVerifiedCustomer is set', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'usr-1',
        username: 'testuser',
        email: 'test@example.com',
        phoneNumber: '+919876543210',
        roles: ['ROLE_CUSTOMER'],
        status: 'PENDING_VERIFICATION',
        emailVerified: true,
        phoneVerified: false,
        lastLoginAt: null,
      },
      accessToken: 'token-abc',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <Routes>
          <Route path="/onboarding" element={<div>Onboarding Stepper Page</div>} />
          <Route
            path="/app/dashboard"
            element={
              <ProtectedRoute requireVerifiedCustomer={true}>
                <div>Dashboard Core Banking</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Onboarding Stepper Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Core Banking')).not.toBeInTheDocument();
  });

  it('RoleRoute denies access and redirects when user lacks required role', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'usr-2',
        username: 'teller1',
        email: 'teller1@finserv.bank',
        phoneNumber: '+919876543211',
        roles: ['ROLE_EMPLOYEE'],
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
        lastLoginAt: null,
      },
      accessToken: 'token-def',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/app" element={<div>Default App Page</div>} />
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={['ROLE_ADMIN']} redirectPath="/app">
                <div>Admin Only Console</div>
              </RoleRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Default App Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Only Console')).not.toBeInTheDocument();
  });
});
