import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { KycReviewPage } from '../KycReviewPage';
import { adminService } from '../adminService';
import type { AdminKycApplicationDto } from '@/types/admin';

vi.mock('../adminService');

const application: AdminKycApplicationDto = {
  id: 'kyc-app-123',
  userId: 'user-456',
  applicationReference: 'KYC-2026-001',
  applicantUsername: 'customer.test',
  applicantEmail: 'customer@example.test',
  applicantPhone: '+910000000000',
  firstName: 'Test',
  lastName: 'Customer',
  maskedPan: 'AB•••••YZ',
  idType: 'AADHAAR',
  maskedIdNumber: '•••• 1234',
  status: 'SUBMITTED',
  currentStep: 4,
  submittedAt: '2026-10-18T10:00:00Z',
  dateOfBirth: '1990-01-01',
  gender: 'UNSPECIFIED',
  residentialAddress: '123 Test Road, Mumbai, Maharashtra 400001',
  declarationsAccepted: ['FATCA', 'PEP'],
  rejectionReason: null,
};

describe('KycReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminService.getKycApplications).mockResolvedValue({
      items: [application],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(adminService.decideKycApplication).mockResolvedValue(application);
  });

  it('renders the backend KYC DTO and submits decisions using its application ID', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <KycReviewPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText(/customer\.test • customer@example\.test/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Inspect' }));
    expect(await screen.findByText('123 Test Road, Mumbai, Maharashtra 400001')).toBeInTheDocument();
    expect(screen.getByText('ID Number: •••• 1234')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Approve KYC Application' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Approval' }));

    await waitFor(() => {
      expect(adminService.decideKycApplication).toHaveBeenCalledWith('kyc-app-123', {
        decision: 'APPROVE',
        remarks: expect.any(String),
      });
    });
    expect(await screen.findByText(/KYC-2026-001 has been successfully APPROVED/i)).toBeInTheDocument();
  });
});
