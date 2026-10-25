import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DepositsPage } from '../DepositsPage';
import { depositService } from '../depositService';
import { accountService } from '@/features/accounts/accountService';
import type { FixedDeposit, FdRateSlab } from '@/types/deposit';
import type { BankAccount } from '@/types/account';

vi.mock('../depositService');
vi.mock('@/features/accounts/accountService');

const mockRateSlabs: FdRateSlab[] = [
  { tenureMonths: 6, interestRatePercentage: 6.5, displayLabel: '6 Months', description: 'Short term liquidity' },
  { tenureMonths: 12, interestRatePercentage: 7.25, displayLabel: '1 Year', description: 'Annual wealth lock' },
  { tenureMonths: 24, interestRatePercentage: 7.5, displayLabel: '2 Years', description: 'Medium term growth' },
  { tenureMonths: 36, interestRatePercentage: 7.75, displayLabel: '3 Years', description: 'Maximum guaranteed yield' },
];

const mockDeposits: FixedDeposit[] = [
  {
    id: 'fd-uuid-1',
    depositNumber: 'FD20261018AA1122',
    customerId: 'cust-uuid-1',
    sourceAccountId: 'acc-uuid-1',
    sourceAccountNumber: '10010100000018',
    principalAmount: 50000,
    interestRatePercentage: 7.25,
    tenureMonths: 12,
    interestEarned: 3625,
    maturityAmount: 53625,
    status: 'ACTIVE',
    startDate: '2026-10-18T10:00:00Z',
    maturityDate: '2027-10-18T10:00:00Z',
    createdAt: '2026-10-18T10:00:00Z',
  },
];

const mockAccounts: BankAccount[] = [
  {
    id: 'acc-uuid-1',
    accountNumber: '10010100000018',
    maskedAccountNumber: '•••• •••• •••• 0018',
    customerId: 'cust-uuid-1',
    branchId: 'branch-uuid-1',
    productId: 'prod-uuid-1',
    productCode: '01',
    productName: 'FinServ Regular Savings',
    branchCode: '1001',
    branchName: 'FinServ Central Mumbai',
    ifscCode: 'FSIN0001001',
    currency: 'INR',
    status: 'ACTIVE',
    currentBalance: '500000.00',
    availableBalance: '500000.00',
    holdBalance: '0.00',
    openedAt: '2026-10-15T10:00:00Z',
    version: 1,
  },
];

describe('DepositsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(depositService.getRateSlabs).mockResolvedValue(mockRateSlabs);
    vi.mocked(depositService.getCustomerDeposits).mockResolvedValue(mockDeposits);
    vi.mocked(accountService.getMyAccounts).mockResolvedValue(mockAccounts);
  });

  it('renders page header, calculator, and active portfolio', async () => {
    render(
      <MemoryRouter>
        <DepositsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Fixed Deposits & Wealth')).toBeInTheDocument();
      expect(screen.getByText('FD Maturity Calculator')).toBeInTheDocument();
      expect(screen.getByText('FD20261018AA1122')).toBeInTheDocument();
    });

    expect(screen.getByText('Highest Available Yield')).toBeInTheDocument();
    expect(screen.getByText('FinServ Wealth Advantage')).toBeInTheDocument();
  });

  it('updates maturity calculation when clicking tenure slab', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DepositsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('FD Maturity Calculator')).toBeInTheDocument();
    });

    // Default 1 Year @ 7.25% p.a. with ₹1,00,000 principal
    // Total = ₹1,07,250.00
    expect(screen.getByText(/₹1,07,250/)).toBeInTheDocument();

    // Click 6 Months slab (6.50% p.a.)
    const sixMonthsSlab = screen.getAllByText('6 Months')[0]!;
    await user.click(sixMonthsSlab);

    await waitFor(() => {
      expect(screen.getByText(/₹1,03,250/)).toBeInTheDocument();
    });
  });

  it('opens printable certificate modal when clicking View Certificate', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DepositsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('FD20261018AA1122')).toBeInTheDocument();
    });

    const viewCertBtn = screen.getByRole('button', { name: /View Certificate/i });
    await user.click(viewCertBtn);

    await waitFor(() => {
      expect(screen.getByText('Official Term Deposit Advice')).toBeInTheDocument();
      expect(screen.getByText('FINSERV BANK LIMITED')).toBeInTheDocument();
      expect(screen.getByText(/DICGC Insured Deposit/i)).toBeInTheDocument();
    });
  });

  it('executes one-click booking flow and displays confirmation', async () => {
    const user = userEvent.setup();
    const newBookedFd: FixedDeposit = {
      id: 'fd-uuid-new',
      depositNumber: 'FD20261018BB3344',
      customerId: 'cust-uuid-1',
      sourceAccountId: 'acc-uuid-1',
      sourceAccountNumber: '10010100000018',
      principalAmount: 100000,
      interestRatePercentage: 7.25,
      tenureMonths: 12,
      interestEarned: 7250,
      maturityAmount: 107250,
      status: 'ACTIVE',
      startDate: '2026-10-18T10:00:00Z',
      maturityDate: '2027-10-18T10:00:00Z',
      createdAt: '2026-10-18T10:00:00Z',
    };
    vi.mocked(depositService.bookFixedDeposit).mockResolvedValue(newBookedFd);

    render(
      <MemoryRouter>
        <DepositsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('FD Maturity Calculator')).toBeInTheDocument();
    });

    const bookBtn = screen.getByRole('button', { name: /Book Fixed Deposit/i });
    await user.click(bookBtn);

    await waitFor(() => {
      expect(screen.getByText('Confirm Fixed Deposit Booking')).toBeInTheDocument();
      expect(screen.getByText(/Funding Source Account/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Open Deposit/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(depositService.bookFixedDeposit).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceAccountId: 'acc-uuid-1',
          principalAmount: '100000.00',
          tenureMonths: 12,
        })
      );
      expect(screen.getByText('Fixed Deposit Booked Successfully!')).toBeInTheDocument();
    });
  });

  it('shows a failure state instead of substituting local rates when rates cannot be loaded', async () => {
    vi.mocked(depositService.getRateSlabs).mockRejectedValueOnce(new Error('Rate service unavailable'));

    render(
      <MemoryRouter>
        <DepositsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Rate service unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Book New FD/i })).toBeDisabled();
  });
});
