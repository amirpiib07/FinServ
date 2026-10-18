import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CustomerDashboardPage } from '../CustomerDashboardPage';
import { dashboardService } from '../dashboardService';
import type { CustomerDashboardOverview } from '@/types/dashboard';

vi.mock('../dashboardService');

const mockDashboardData: CustomerDashboardOverview = {
  totalNetWorth: 125000.0,
  activeAccountsCount: 2,
  verifiedBeneficiariesCount: 4,
  monthlyCredits: 45000.0,
  monthlyDebits: 12000.0,
  netCashflow30d: 33000.0,
  primaryAccount: {
    id: 'acc-uuid-1',
    accountNumber: '10010100000018',
    productName: 'FinServ Regular Savings',
    productType: 'SAVINGS',
    branchName: 'Mumbai Fort HQ',
    ifscCode: 'FINS0001001',
    currency: 'INR',
    status: 'ACTIVE',
    currentBalance: 125000.0,
    availableBalance: 125000.0,
  },
  allAccounts: [
    {
      id: 'acc-uuid-1',
      accountNumber: '10010100000018',
      productName: 'FinServ Regular Savings',
      productType: 'SAVINGS',
      currency: 'INR',
      status: 'ACTIVE',
      currentBalance: 125000.0,
      availableBalance: 125000.0,
    },
  ],
  topBeneficiaries: [
    {
      id: 'ben-1',
      beneficiaryName: 'Priya Sharma',
      accountNumber: '10010100000029',
      bankName: 'FinServ Central Bank',
      transferType: 'INTERNAL',
      status: 'VERIFIED',
    },
  ],
  recentTransactions: [
    {
      id: 'tx-1',
      transactionReference: 'FSV202610170001',
      transactionType: 'DEPOSIT',
      amount: 50000.0,
      currency: 'INR',
      status: 'SUCCESS',
      initiatedAt: '2026-10-17T12:00:00Z',
      narrative: 'Consulting Honorarium',
      balanceAfter: 125000.0,
      counterpartyAccount: null,
      counterpartyName: 'Self Cash Deposit',
    },
  ],
  pendingAlerts: [],
};

describe('CustomerDashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders executive wealth overview and primary account card', async () => {
    vi.mocked(dashboardService.getCustomerDashboard).mockResolvedValue(mockDashboardData);

    render(
      <MemoryRouter>
        <CustomerDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('TOTAL RELATIONSHIP NET WORTH')).toBeInTheDocument();
    });

    expect(screen.getAllByText('₹1,25,000.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/FinServ Regular Savings/i)).toBeInTheDocument();
    expect(screen.getByText(/Consulting Honorarium/i)).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText(/Mumbai Fort HQ/i)).toBeInTheDocument();
  });

  it('toggles balance visibility on eye icon click', async () => {
    vi.mocked(dashboardService.getCustomerDashboard).mockResolvedValue(mockDashboardData);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CustomerDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/TOTAL RELATIONSHIP NET WORTH/i)).toBeInTheDocument();
    });

    const toggleBtn = screen.getByRole('button', { name: /hide portfolio balance/i });
    await user.click(toggleBtn);

    expect(screen.getByText('₹ ••••••••')).toBeInTheDocument();

    const revealBtn = screen.getByRole('button', { name: /reveal portfolio balance/i });
    await user.click(revealBtn);

    expect(screen.getAllByText('₹1,25,000.00').length).toBeGreaterThanOrEqual(1);
  });
});
