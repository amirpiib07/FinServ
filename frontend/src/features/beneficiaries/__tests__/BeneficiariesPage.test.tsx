import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { BeneficiariesPage } from '../BeneficiariesPage';
import { beneficiaryService } from '../beneficiaryService';
import { ToastProvider } from '@/context/ToastProvider';
import type { Beneficiary } from '@/types/beneficiary';

vi.mock('../beneficiaryService');

const mockBeneficiaries: Beneficiary[] = [
  {
    id: 'ben-uuid-1',
    customerId: 'cust-uuid-1',
    payeeType: 'INTRA_BANK',
    beneficiaryName: 'Priya Sharma',
    nickname: 'Priya FinServ',
    accountNumber: '10010100000026',
    maskedAccountNumber: '•••• •••• •••• 0026',
    bankName: 'FINServ Bank',
    ifscCode: 'FSIN0001001',
    dailyTransferLimit: '25000.00',
    verificationStatus: 'VERIFIED',
    isActive: true,
    coolingOffUntil: '2099-01-01T00:00:00Z',
    createdAt: '2026-10-14T10:00:00Z',
  },
  {
    id: 'ben-uuid-2',
    customerId: 'cust-uuid-1',
    payeeType: 'INTER_BANK',
    beneficiaryName: 'Rohan Verma',
    nickname: 'Rohan HDFC',
    accountNumber: '50100234567890',
    maskedAccountNumber: '•••• •••• •••• 7890',
    bankName: 'HDFC Bank',
    ifscCode: 'HDFC0001234',
    dailyTransferLimit: '50000.00',
    verificationStatus: 'PENDING_VERIFICATION',
    isActive: true,
    coolingOffUntil: '2099-01-01T00:00:00Z',
    createdAt: '2026-10-15T12:00:00Z',
  },
];

function renderWithProviders() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <BeneficiariesPage />
      </MemoryRouter>
    </ToastProvider>
  );
}

describe('BeneficiariesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(beneficiaryService.getBeneficiaries).mockResolvedValue(mockBeneficiaries);
  });

  it('renders beneficiary list, bank badges, and cooling-off state', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      expect(screen.getByText('Rohan Verma')).toBeInTheDocument();
      expect(screen.getAllByText(/Within FinServ/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Other Bank')).toBeInTheDocument();
      expect(screen.getByText('Cooling-off safety window active.')).toBeInTheDocument();
      expect(screen.getByText('Pending OTP verification before transfer activation.')).toBeInTheDocument();
    });
  });

  it('filters payees by search query and tabs', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    // Search for "HDFC"
    const searchInput = screen.getByPlaceholderText(/search by payee name/i);
    await user.type(searchInput, 'HDFC');

    expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
    expect(screen.getByText('Rohan Verma')).toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // Filter by "Within FinServ" tab
    const intraTab = screen.getByRole('button', { name: /within finserv/i });
    await user.click(intraTab);

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.queryByText('Rohan Verma')).not.toBeInTheDocument();
  });

  it('opens Add Beneficiary modal and verifies account confirmation mismatch validation', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /add beneficiary/i });
    await user.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Add New Beneficiary')).toBeInTheDocument();
    });

    // Fill mismatched account numbers
    const nicknameInput = screen.getByLabelText(/Payee Nickname \*/i);
    const nameInput = screen.getByLabelText(/Beneficiary Full Name \*/i);
    const accInput = screen.getByLabelText(/^Account Number \*/i);
    const confirmAccInput = screen.getByLabelText(/Confirm Account Number \*/i);
    const ifscInput = screen.getByLabelText(/IFSC Code \*/i);

    await user.type(nicknameInput, 'Kavita');
    await user.type(nameInput, 'Kavita Das');
    await user.type(accInput, '10010100000099');
    await user.type(confirmAccInput, '10010100000088'); // Mismatch!
    await user.type(ifscInput, 'SBIN0001234');

    const submitBtn = screen.getByRole('button', { name: /Next: OTP Verify/i });
    await user.click(submitBtn);

    // Verify error message for mismatch
    await waitFor(() => {
      expect(screen.getByText(/Account numbers do not match/i)).toBeInTheDocument();
    });
  });

  it('allows verifying a pending beneficiary with simulated OTP', async () => {
    const user = userEvent.setup();
    const target = mockBeneficiaries[1]!;
    vi.mocked(beneficiaryService.verifyBeneficiary).mockResolvedValueOnce({
      ...target,
      verificationStatus: 'VERIFIED',
      coolingOffUntil: null,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Rohan Verma')).toBeInTheDocument();
    });

    // Click "Verify with OTP" on Rohan's pending card
    const verifyBtn = screen.getByRole('button', { name: /verify with otp/i });
    await user.click(verifyBtn);

    // Verify modal is open
    expect(screen.getByText('Verify Beneficiary')).toBeInTheDocument();

    // Confirm verification
    const confirmBtn = screen.getByRole('button', { name: /confirm verification/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(beneficiaryService.verifyBeneficiary).toHaveBeenCalledWith('ben-uuid-2', {
        otpCode: '123456',
      });
    });
  });
});
