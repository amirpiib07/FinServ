/**
 * FINServ Transfers & Transactions Type Definitions
 */

export interface TransactionDto {
  id: string;
  transactionReference: string;
  fromAccountId: string | null;
  fromAccountNumber: string | null;
  toAccountId: string | null;
  toAccountNumber: string | null;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_INTERNAL' | 'TRANSFER_EXTERNAL' | 'FEE' | 'INTEREST' | 'REVERSAL';
  amount: string | number;
  feeAmount: string | number;
  currency: string;
  fromAccountBalanceAfter: string | number | null;
  toAccountBalanceAfter: string | number | null;
  runningBalance: string | number | null;
  direction: 'CREDIT' | 'DEBIT' | 'SELF';
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
  failureReason?: string | null;
  channel: string;
  description: string;
  counterpartyName?: string | null;
  transferMode: string;
  createdAt: string;
  completedAt?: string | null;
}

export interface TransactionReceiptDto {
  id: string;
  transactionReference: string;
  status: string;
  transactionType: string;
  transferMode: string;
  amount: string | number;
  feeAmount: string | number;
  currency: string;
  fromAccountId?: string | null;
  fromAccountNumber?: string | null;
  fromAccountHolderName?: string | null;
  fromAccountBranch?: string | null;
  fromAccountIfsc?: string | null;
  toAccountId?: string | null;
  toAccountNumber?: string | null;
  toAccountHolderName?: string | null;
  toBankName?: string | null;
  toIfscCode?: string | null;
  runningBalance?: string | number | null;
  fromAccountBalanceAfter?: string | number | null;
  toAccountBalanceAfter?: string | number | null;
  description?: string | null;
  channel: string;
  createdAt: string;
  completedAt?: string | null;
  journalReference?: string | null;
}

export interface TransactionSummaryDto {
  totalCredits: string | number;
  totalDebits: string | number;
  netCashflow: string | number;
  transactionCount: number;
}

export interface TransactionPageResponse {
  items: TransactionDto[];
  summary: TransactionSummaryDto;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DepositRequest {
  accountId: string;
  amount: string;
  description?: string;
}

export interface WithdrawRequest {
  accountId: string;
  amount: string;
  description?: string;
}

export interface TransferRequest {
  fromAccountId: string;
  transferType: 'BENEFICIARY' | 'SELF' | 'DIRECT_ACCOUNT';
  beneficiaryId?: string;
  destinationAccountNumber?: string;
  transferMode: 'INTERNAL' | 'IMPS' | 'NEFT' | 'RTGS';
  amount: string;
  description?: string;
}

export interface TransactionFilterParams {
  accountId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  query?: string;
  page?: number;
  size?: number;
}
