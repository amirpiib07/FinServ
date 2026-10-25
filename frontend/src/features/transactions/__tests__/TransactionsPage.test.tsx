import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TransactionsPage } from '../TransactionsPage';
import { transferService } from '@/features/transfers/services/transferService';
import { accountService } from '@/features/accounts/accountService';
import { ToastProvider } from '@/context/ToastProvider';
import { ToastContainer } from '@/components/ui/ToastContainer';
import type { BankAccount } from '@/types/account';
import type {
  TransactionDto,
  TransactionPageResponse,
  TransactionReceiptDto,
} from '@/features/transfers/types/transferTypes';

vi.mock('@/features/transfers/services/transferService');
vi.mock('@/features/accounts/accountService');

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
    currentBalance: '55000.00',
    holdBalance: '0.00',
    availableBalance: '55000.00',
    openedAt: '2026-10-15T10:00:00Z',
    version: 1,
  },
];

const mockTransactions: TransactionDto[] = [
  {
    id: 'tx-1',
    transactionReference: 'FSV202610170001',
    fromAccountId: null,
    fromAccountNumber: null,
    toAccountId: 'acc-1',
    toAccountNumber: '10010100000018',
    transactionType: 'DEPOSIT',
    amount: '10000.00',
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
  },
  {
    id: 'tx-2',
    transactionReference: 'FSV202610170002',
    fromAccountId: 'acc-1',
    fromAccountNumber: '10010100000018',
    toAccountId: null,
    toAccountNumber: '10010100000099',
    transactionType: 'TRANSFER_EXTERNAL',
    amount: '2500.00',
    feeAmount: '0.00',
    currency: 'INR',
    fromAccountBalanceAfter: '52500.00',
    toAccountBalanceAfter: null,
    runningBalance: '52500.00',
    direction: 'DEBIT',
    status: 'COMPLETED',
    channel: 'INTERNET_BANKING',
    counterpartyName: 'Priya Sharma',
    description: 'Monthly Rent Split',
    transferMode: 'IMPS',
    createdAt: '2026-10-17T11:30:00Z',
  },
];

const mockPageResponse: TransactionPageResponse = {
  items: mockTransactions,
  summary: {
    totalCredits: '10000.00',
    totalDebits: '2500.00',
    netCashflow: '7500.00',
    transactionCount: 2,
  },
  page: 0,
  size: 15,
  totalElements: 2,
  totalPages: 1,
};

const mockReceipt: TransactionReceiptDto = {
  id: 'tx-1',
  transactionReference: 'FSV202610170001',
  status: 'COMPLETED',
  transactionType: 'DEPOSIT',
  transferMode: 'DEPOSIT',
  amount: '10000.00',
  feeAmount: '0.00',
  currency: 'INR',
  fromAccountId: null,
  fromAccountNumber: null,
  toAccountId: 'acc-1',
  toAccountNumber: '10010100000018',
  runningBalance: '55000.00',
  description: 'Self Cash Deposit',
  channel: 'INTERNET_BANKING',
  createdAt: '2026-10-17T10:00:00Z',
  journalReference: 'JRN-20261017-0001',
};

describe('TransactionsPage (Passbook & Statements)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountService.getMyAccounts).mockResolvedValue(mockAccounts);
    vi.mocked(transferService.getTransactions).mockResolvedValue(mockPageResponse);
    vi.mocked(transferService.getTransactionReceipt).mockResolvedValue(mockReceipt);
  });

  const renderComponent = () =>
    render(
      <ToastProvider>
        <MemoryRouter>
          <TransactionsPage />
        </MemoryRouter>
        <ToastContainer />
      </ToastProvider>
    );

  it('renders Passbook header and KPI summary cards', async () => {
    renderComponent();

    expect(screen.getByText(/Passbook & Statements/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(transferService.getTransactions).toHaveBeenCalled();
    });

    // Check KPI cards
    expect(screen.getByText(/Money In \(Credits\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Money Out \(Debits\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Net Period Cashflow/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Records/i)).toBeInTheDocument();
  });

  it('renders transaction rows with UTR, narration, and running balances', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Self Cash Deposit/i)).toBeInTheDocument();
      expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      expect(screen.getByText(/UTR: FSV202610170001/i)).toBeInTheDocument();
      expect(screen.getByText(/UTR: FSV202610170002/i)).toBeInTheDocument();
    });
  });

  it('opens Transaction Receipt Modal on clicking receipt button', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Self Cash Deposit/i)).toBeInTheDocument();
    });

    const receiptButtons = screen.getAllByTitle(/View Official Receipt/i);
    expect(receiptButtons.length).toBeGreaterThan(0);

    await user.click(receiptButtons[0]!);

    await waitFor(() => {
      expect(transferService.getTransactionReceipt).toHaveBeenCalledWith('tx-1');
      expect(screen.getByText(/Official Electronic Transaction Advice/i)).toBeInTheDocument();
      expect(screen.getByText(/Print \/ Save PDF/i)).toBeInTheDocument();
    });
  });

  it('does not show a fallback receipt when the official receipt request fails', async () => {
    const user = userEvent.setup();
    vi.mocked(transferService.getTransactionReceipt).mockRejectedValueOnce(
      new Error('Official receipt is unavailable.')
    );
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Self Cash Deposit/i)).toBeInTheDocument();
    });
    await user.click(screen.getAllByTitle(/View Official Receipt/i)[0]!);

    expect(await screen.findByText('Official receipt is unavailable.')).toBeInTheDocument();
    expect(screen.queryByText(/Official Electronic Transaction Advice/i)).not.toBeInTheDocument();
  });

  it('applies draft search filters with one request instead of fetching for each keystroke', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(transferService.getTransactions).toHaveBeenCalledTimes(1);
    });
    await user.type(screen.getByLabelText(/Search Narration \/ UTR/i), 'rent');
    expect(transferService.getTransactions).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await waitFor(() => {
      expect(transferService.getTransactions).toHaveBeenCalledTimes(2);
    });
    expect(vi.mocked(transferService.getTransactions).mock.calls[1]?.[0]).toMatchObject({
      query: 'rent',
      page: 0,
    });
  });
});
