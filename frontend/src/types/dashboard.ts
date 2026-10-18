/**
 * FINServ Customer Dashboard Types
 */

export interface DashboardAccountDto {
  id: string;
  accountNumber: string;
  productName: string;
  productType: string;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'DORMANT' | 'CLOSED';
  currentBalance: number;
  availableBalance: number;
  branchName?: string;
  ifscCode?: string;
}

export interface DashboardRecentTransactionDto {
  id: string;
  transactionReference: string;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_INTERNAL' | 'TRANSFER_NEFT' | 'TRANSFER_RTGS' | 'TRANSFER_IMPS';
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REVERSED';
  initiatedAt: string;
  narrative: string;
  balanceAfter: number;
  counterpartyAccount?: string | null;
  counterpartyName?: string | null;
}

export interface DashboardTopBeneficiaryDto {
  id: string;
  beneficiaryName: string;
  accountNumber: string;
  bankName: string;
  transferType: string;
  status: string;
}

export interface DashboardAlertDto {
  alertType: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  severity: 'INFO' | 'WARNING' | 'ALERT';
}

export interface CustomerDashboardOverview {
  totalNetWorth: number;
  activeAccountsCount: number;
  verifiedBeneficiariesCount: number;
  monthlyCredits: number;
  monthlyDebits: number;
  netCashflow30d: number;
  primaryAccount: DashboardAccountDto | null;
  allAccounts: DashboardAccountDto[];
  recentTransactions: DashboardRecentTransactionDto[];
  topBeneficiaries: DashboardTopBeneficiaryDto[];
  pendingAlerts: DashboardAlertDto[];
}
