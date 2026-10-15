import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AccountsPage } from '../AccountsPage';
import { accountService } from '../accountService';
import { ToastProvider } from '@/context/ToastProvider';
import type { BankAccount, AccountApplication, AccountProduct, Branch } from '@/types/account';

vi.mock('../accountService');

const mockAccounts: BankAccount[] = [
  {
    id: 'acc-uuid-1',
    accountNumber: '10010100000018',
    maskedAccountNumber: '•••• •••• •••• 0018',
    customerId: 'cust-uuid-1',
    branchId: 'branch-uuid-1',
    productId: 'prod-uuid-sav',
    productCode: 'PROD_SAV_REG',
    productName: 'FinServ Regular Savings',
    branchCode: '1001',
    branchName: 'FinServ Central Mumbai',
    ifscCode: 'FSIN0001001',
    currency: 'INR',
    status: 'ACTIVE',
    currentBalance: '50000.00',
    holdBalance: '0.00',
    availableBalance: '50000.00',
    openedAt: '2026-10-15T10:00:00Z',
    nickname: 'Salary Account',
    version: 1,
  },
];

const mockApplications: AccountApplication[] = [
  {
    id: 'app-uuid-1',
    applicationNumber: 'APP-2026-0001',
    customerId: 'cust-uuid-1',
    productId: 'prod-uuid-cur',
    productCode: 'PROD_CUR_PREM',
    productName: 'FinServ Premium Current',
    branchId: 'branch-uuid-1',
    branchName: 'FinServ Central Mumbai',
    initialDepositAmount: '5000.00',
    applicationStatus: 'SUBMITTED',
    createdAt: '2026-10-15T11:00:00Z',
  },
];

const mockProducts: AccountProduct[] = [
  {
    id: 'prod-uuid-sav',
    productCode: 'PROD_SAV_REG',
    productName: 'FinServ Regular Savings',
    productType: 'SAVINGS',
    interestRatePercentage: '4.00',
    minBalance: '1000.00',
    overdraftAllowed: false,
    overdraftLimit: '0.00',
    currency: 'INR',
    isActive: true,
  },
];

const mockBranches: Branch[] = [
  {
    id: 'branch-uuid-1',
    branchCode: '1001',
    branchName: 'FinServ Central Mumbai',
    ifscCode: 'FSIN0001001',
    routingNumber: '100100',
    streetAddress: '123 Nariman Point',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400021',
    phoneNumber: '+912222001100',
    status: 'ACTIVE',
  },
];

function renderWithProviders() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <AccountsPage />
      </MemoryRouter>
    </ToastProvider>
  );
}

describe('AccountsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountService.getMyAccounts).mockResolvedValue(mockAccounts);
    vi.mocked(accountService.getMyApplications).mockResolvedValue(mockApplications);
    vi.mocked(accountService.getAccountProducts).mockResolvedValue(mockProducts);
    vi.mocked(accountService.getBranches).mockResolvedValue(mockBranches);
  });

  it('renders customer accounts, balances formatted in INR, and pending application alert', async () => {
    renderWithProviders();

    // Verify account cards load
    await waitFor(() => {
      expect(screen.getByText('FinServ Regular Savings')).toBeInTheDocument();
      expect(screen.getByText('“Salary Account”')).toBeInTheDocument();
      expect(screen.getByText('•••• •••• •••• 0018')).toBeInTheDocument();
      expect(screen.getByText('FSIN0001001')).toBeInTheDocument();
    });

    // Verify Pending application banner
    expect(screen.getByText('Account Application in Review:')).toBeInTheDocument();
    expect(screen.getByText('APP-2026-0001')).toBeInTheDocument();
  });

  it('toggles masked and unmasked account number on reveal click', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('•••• •••• •••• 0018')).toBeInTheDocument();
    });

    const revealButton = screen.getByRole('button', { name: /reveal full account number/i });
    await user.click(revealButton);

    // Unmasked 14-digit ISO 7064 account number is now displayed
    expect(screen.getByText('10010100000018')).toBeInTheDocument();

    const hideButton = screen.getByRole('button', { name: /hide account number/i });
    await user.click(hideButton);

    expect(screen.getByText('•••• •••• •••• 0018')).toBeInTheDocument();
  });

  it('opens Open Account modal, validates fields, and submits application', async () => {
    const user = userEvent.setup();
    vi.mocked(accountService.applyForAccount).mockResolvedValueOnce({
      id: 'app-new-1',
      applicationNumber: 'APP-2026-0002',
      customerId: 'cust-uuid-1',
      productId: 'prod-uuid-sav',
      productCode: 'PROD_SAV_REG',
      productName: 'FinServ Regular Savings',
      branchId: 'branch-uuid-1',
      branchName: 'FinServ Central Mumbai',
      initialDepositAmount: '5000.00',
      applicationStatus: 'APPROVED',
      createdAt: '2026-10-15T12:00:00Z',
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('FinServ Regular Savings')).toBeInTheDocument();
    });

    // Click "Open New Account"
    const openBtn = screen.getByRole('button', { name: /open new account/i });
    await user.click(openBtn);

    // Verify modal dialog appears and reference data loads
    await waitFor(() => {
      expect(screen.getByText('Open New Bank Account')).toBeInTheDocument();
      expect(screen.getByLabelText(/I agree to the FINServ Account Terms/i)).toBeInTheDocument();
    });

    // Check terms and conditions checkbox
    const termsCheckbox = screen.getByLabelText(/I agree to the FINServ Account Terms/i);
    await user.click(termsCheckbox);

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /open account now/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(accountService.applyForAccount).toHaveBeenCalledTimes(1);
    });
  });
});
