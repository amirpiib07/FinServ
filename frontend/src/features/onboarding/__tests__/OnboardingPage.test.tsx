import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingPage } from '../OnboardingPage';
import { ThemeProvider } from '@/context/ThemeProvider';
import { apiClient } from '@/lib/api-client';
import * as useAuthModule from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');
vi.mock('@/lib/api-client');

describe('OnboardingPage Component', () => {
  const mockUseAuth = vi.spyOn(useAuthModule, 'useAuth');

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 'usr-customer-1',
        username: 'amit_user',
        email: 'amit@example.com',
        phoneNumber: '+919876543210',
        roles: ['ROLE_CUSTOMER'],
        status: 'PENDING_VERIFICATION',
        emailVerified: true,
        phoneVerified: false,
        lastLoginAt: null,
      },
      accessToken: 'token-jwt',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it('renders Step 1 (Contact Verification) when application is draft at step 1', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      id: 'app-1',
      applicationReference: 'APP-2026-0001',
      status: 'DRAFT',
      currentStep: 1,
      draftData: {},
      submittedAt: null,
      rejectionReason: null,
    });

    render(
      <MemoryRouter>
        <ThemeProvider>
          <OnboardingPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Initial loading fallback
    expect(screen.getByText('Retrieving onboarding application...')).toBeInTheDocument();

    // After resolution
    await waitFor(() => {
      expect(screen.getByText('Verify Contact Credentials')).toBeInTheDocument();
    });

    expect(screen.getByText('Send Verification OTP')).toBeInTheDocument();
  });

  it('renders Verification Status Tracker screen when application is SUBMITTED', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      id: 'app-2',
      applicationReference: 'APP-2026-0002',
      status: 'SUBMITTED',
      currentStep: 5,
      draftData: { step4: { panNumber: 'ABCDE1234F', idType: 'NATIONAL_ID', idNumber: '1234' } },
      submittedAt: '2026-03-30T10:00:00Z',
      rejectionReason: null,
    });

    render(
      <MemoryRouter>
        <ThemeProvider>
          <OnboardingPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Application Under Bank Review')).toBeInTheDocument();
    });

    expect(screen.getByText('APP-2026-0002')).toBeInTheDocument();
    expect(screen.getByText('Dual-Authorization Document Verification')).toBeInTheDocument();
  });
});
