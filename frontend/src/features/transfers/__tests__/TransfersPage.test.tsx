import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TransfersPage } from '../TransfersPage';
import { transferService } from '../services/transferService';
import { accountService } from '@/features/accounts/accountService';
import { beneficiaryService } from '@/features/beneficiaries/beneficiaryService';
import { ToastProvider } from '@/context/ToastProvider';
import type { BankAccount } from '@/types/account';
import type { Beneficiary } from '@/types/beneficiary';
import type { TransactionDto } from '../types/transferTypes';

vi.mock('../services/transferService');
vi.mock('@/features/accounts/accountService');
vi.mock('@/features/beneficiaries/beneficiaryService');

const mockAccounts: BankAccount[] = [
  {
    id: 'acc-1',
    accountNumber: '10010100000018',
    maskedAccountNumber: '•••• •••• •••• 0018',
    customerId: 'cust-1',
    branchId: 'branch-1',
    productId: 'prod-1',
    productCode: 'PROD_SAV_REG',
    productName: 'FinServ Regular Savings',
    branchCode: '1001',
    branchName: 'Mumbai Fort HQ',
    ifscCode: 'FSIN0001001',
    currency: 'INR',
    status: 'ACTIVE',
    currentBalance: '50000.00',
    holdBalance: '0.00',
    availableBalance: '50000.00',
    openedAt: '2026-10-15T10:00:00Z',
    version: 1,
  },
  {
    id: 'acc-2',
    accountNumber: '10010100000029',
    maskedAccountNumber: '•••• •••• •••• 0029',
    customerId: 'cust-1',
    branchId: 'branch-1',
    productId: 'prod-2',
    productCode: 'PROD_CUR_PREM',
    productName: 'FinServ Premium Current',
    branchCode: '1001',
    branchName: 'Mumbai Fort HQ',
    ifscCode: 'FSIN0001001',
    currency: 'INR',
    status: 'ACTIVE',
    currentBalance: '25000.00',
    holdBalance: '0.00',
    availableBalance: '25000.00',
    openedAt: '2026-10-15T10:00:00Z',
    version: 1,
  },
];

const mockBeneficiaries: Beneficiary[] = [
  {
    id: 'ben-1',
    customerId: 'cust-1',
    beneficiaryName: 'Priya Sharma',
    nickname: 'Priya Personal',
    accountNumber: '10010100000099',
    maskedAccountNumber: '•••• •••• •••• 0099',
    ifscCode: 'FSIN0001001',
    bankName: 'FINServ Bank',
    payeeType: 'INTRA_BANK',
    verificationStatus: 'VERIFIED',
    isActive: true,
    dailyTransferLimit: '100000.00',
    createdAt: '2026-10-15T10:00:00Z',
  },
];

const mockDepositResponse: TransactionDto = {
  id: 'tx-1',
  transactionReference: 'FSV202610170001',
  fromAccountId: null,
  fromAccountNumber: null,
  toAccountId: 'acc-1',
  toAccountNumber: '10010100000018',
  transactionType: 'DEPOSIT',
  amount: '5000.00',
  feeAmount: '0.00',
  currency: 'INR',
  fromAccountBalanceAfter: null,
  toAccountBalanceAfter: '55000.00',
  runningBalance: '55000.00',
  direction: 'CREDIT',
  status: 'COMPLETED',
  channel: 'INTERNET_BANKING',
  description: 'Self Cash Deposit',
  transferMode: 'DEPOSIT',
  createdAt: '2026-10-17T10:00:00Z',
};

describe('TransfersPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountService.getMyAccounts).mockResolvedValue(mockAccounts);
    vi.mocked(beneficiaryService.getBeneficiaries).mockResolvedValue(mockBeneficiaries);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransfersPage />
        </ToastProvider>
      </MemoryRouter>
    );

  it('renders Transfer Studio with tabs and loads active accounts and payees', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Fund Transfers & Payments/i)).toBeInTheDocument();
      expect(accountService.getMyAccounts).toHaveBeenCalled();
      expect(beneficiaryService.getBeneficiaries).toHaveBeenCalled();
    });

    // Check tabs
    expect(screen.getByText(/To Beneficiary/i)).toBeInTheDocument();
    expect(screen.getByText(/Own Account \/ Direct/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Funds \(Deposit\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Withdraw Cash/i)).toBeInTheDocument();

    // Check payee name
    expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
  });

  it('shows inline validation warning if amount exceeds available balance', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Fund Transfers & Payments/i)).toBeInTheDocument();
      expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
    });

    // Input an amount greater than 50,000 (e.g. 75000)
    const amountInput = screen.getByPlaceholderText('0.00');
    await user.type(amountInput, '75000');

    // Should display warning that amount exceeds available balance
    await waitFor(() => {
      expect(
        screen.getByText(/Insufficient balance! Your available balance is/i)
      ).toBeInTheDocument();
    });
  });

  it('switches to Instant Deposit tab and executes deposit successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(transferService.deposit).mockResolvedValue(mockDepositResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Fund Transfers & Payments/i)).toBeInTheDocument();
    });

    // Click Instant Deposit tab
    await user.click(screen.getByText(/Add Funds \(Deposit\)/i));

    // Verify Deposit amount label
    expect(screen.getByText(/Deposit Amount \(INR\)/i)).toBeInTheDocument();

    // Enter deposit amount
    const amountInput = screen.getByPlaceholderText('0.00');
    await user.type(amountInput, '5000');

    // Click review button
    const reviewBtn = screen.getByRole('button', { name: /Review & Authorize/i });
    await user.click(reviewBtn);

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText(/Review Account Funding/i)).toBeInTheDocument();
      expect(screen.getByText(/Fee: ₹0.00 Free/i)).toBeInTheDocument();
    });

    // Confirm deposit
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Add Funds/i });
    await user.click(confirmBtn);

    // Should render Success Receipt
    await waitFor(() => {
      expect(transferService.deposit).toHaveBeenCalled();
      expect(screen.getByText(/Account Funded Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText(/FSV202610170001/i)).toBeInTheDocument();
    });
  });
});
