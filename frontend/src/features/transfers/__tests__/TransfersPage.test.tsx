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

const mockTransferResponse: TransactionDto = {
  ...mockDepositResponse,
  id: 'tx-2',
  transactionReference: 'FSV202610170002',
  fromAccountId: 'acc-1',
  fromAccountNumber: '10010100000018',
  toAccountId: null,
  toAccountNumber: '10010100000099',
  transactionType: 'TRANSFER_EXTERNAL',
  amount: '5000.00',
  direction: 'DEBIT',
  runningBalance: '45000.00',
  status: 'COMPLETED',
  transferMode: 'IMPS',
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
    const reviewBtn = screen.getByRole('button', { name: /Review transfer/i });
    await user.click(reviewBtn);

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText(/Review Account Funding/i)).toBeInTheDocument();
      expect(screen.getByText(/Direct Deposit/i)).toBeInTheDocument();
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

  it('keeps the same idempotency key when retrying a failed submission', async () => {
    const user = userEvent.setup();
    vi.mocked(transferService.transfer)
      .mockRejectedValueOnce(new Error('Temporary network failure'))
      .mockResolvedValueOnce(mockTransferResponse);

    renderComponent();

    await screen.findByText('Priya Sharma');
    await user.click(screen.getByRole('button', { name: /Priya Sharma/i }));
    await user.type(screen.getByPlaceholderText('0.00'), '5000');
    await user.click(screen.getByRole('button', { name: /Review transfer/i }));
    await user.click(await screen.findByRole('button', { name: /Confirm & Transfer Money/i }));

    expect(await screen.findAllByText('Temporary network failure')).not.toHaveLength(0);
    await user.click(screen.getByRole('button', { name: /Confirm & Transfer Money/i }));

    await screen.findByText(/Payment Transfer Successful!/i);
    const calls = vi.mocked(transferService.transfer).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[1]?.[1]).toBe(calls[0]?.[1]);
  });

  it('does not present a pending transfer as successful or offer another transfer', async () => {
    const user = userEvent.setup();
    vi.mocked(transferService.transfer).mockResolvedValue({
      ...mockTransferResponse,
      status: 'PENDING',
    });

    renderComponent();

    await screen.findByText('Priya Sharma');
    await user.click(screen.getByRole('button', { name: /Priya Sharma/i }));
    await user.type(screen.getByPlaceholderText('0.00'), '5000');
    await user.click(screen.getByRole('button', { name: /Review transfer/i }));
    await user.click(await screen.findByRole('button', { name: /Confirm & Transfer Money/i }));

    expect(await screen.findByRole('heading', { name: 'Transfer pending' })).toBeInTheDocument();
    expect(screen.queryByText(/Payment Transfer Successful!/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Start another transfer/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View transactions/i })).toBeInTheDocument();
  });

  it('shows a retry state instead of reporting empty accounts when data loading fails', async () => {
    vi.mocked(beneficiaryService.getBeneficiaries)
      .mockRejectedValueOnce(new Error('Payee service unavailable'));

    renderComponent();

    expect(await screen.findByText('Banking data could not be loaded')).toBeInTheDocument();
    expect(screen.getByText('Payee service unavailable')).toBeInTheDocument();
    expect(screen.queryByText('No verified payees found.')).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /Try again/i }));
    expect(await screen.findByText('Fund Transfers & Payments')).toBeInTheDocument();
  });
});
