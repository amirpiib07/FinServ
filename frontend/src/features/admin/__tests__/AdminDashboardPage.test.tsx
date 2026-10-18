import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../AdminDashboardPage';
import { adminService } from '../adminService';
import type { AdminOverviewDto } from '@/types/admin';

vi.mock('../adminService');

const mockAdminOverview: AdminOverviewDto = {
  totalCustomers: 142,
  pendingKycReviews: 3,
  pendingAccountApplications: 2,
  totalActiveAccounts: 189,
  totalCustomerDeposits: 54200000.0,
  todayTransactionVolume: 1250000.0,
  glTrialBalanceStatus: 'BALANCED',
  glIntegrityBalanced: true,
};

describe('AdminDashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders system KPIs, queue counters, and GL balance integrity badge', async () => {
    vi.mocked(adminService.getOverview).mockResolvedValue(mockAdminOverview);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Operations Command Center')).toBeInTheDocument();
    });

    // Check KPI cards
    expect(screen.getByText('Total Customers')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('Customer Deposits')).toBeInTheDocument();
    expect(screen.getByText(/Across 189 active accounts/i)).toBeInTheDocument();
    expect(screen.getByText('₹5,42,00,000.00')).toBeInTheDocument();

    // Check General Ledger trial balance health
    expect(screen.getByText(/GL TRIAL BALANCE: BALANCED/i)).toBeInTheDocument();

    // Check pending queues
    expect(screen.getByText('Pending KYC Reviews')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Customer KYC Review Queue')).toBeInTheDocument();
  });
});
