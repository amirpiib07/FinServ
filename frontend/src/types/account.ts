/**
 * FINServ Account & Banking Products Types
 */

export interface AccountProduct {
  id: string;
  productCode: string;
  productName: string;
  productType: 'SAVINGS' | 'CURRENT' | 'SALARY' | 'STUDENT';
  currency: string;
  minBalance: number | string;
  interestRatePercentage: number | string;
  overdraftAllowed: boolean;
  overdraftLimit: number | string;
  isActive: boolean;
}

export interface Branch {
  id: string;
  branchCode: string;
  branchName: string;
  ifscCode: string;
  routingNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumber: string;
  status: string;
}

export interface BankAccount {
  id: string;
  customerId: string;
  branchId: string;
  branchName?: string;
  branchCode?: string;
  ifscCode?: string;
  productId: string;
  productCode?: string;
  productName?: string;
  productType?: string;
  accountNumber: string;
  maskedAccountNumber: string;
  currency: string;
  currentBalance: string | number;
  availableBalance: string | number;
  holdBalance: string | number;
  status: 'ACTIVE' | 'DORMANT' | 'FROZEN' | 'CLOSED';
  nickname?: string;
  openedAt: string;
  version: number;
}

export interface AccountApplication {
  id: string;
  applicationNumber: string;
  customerId: string;
  productId: string;
  productName?: string;
  productCode?: string;
  branchId?: string;
  branchName?: string;
  initialDepositAmount: string | number;
  applicationStatus: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAccountId?: string;
  createdAt: string;
}

export interface CreateAccountApplicationPayload {
  productId: string;
  branchId: string;
  initialDepositAmount?: number | string;
  nickname?: string;
  autoActivate?: boolean;
}

export interface UpdateAccountControlsPayload {
  nickname?: string;
  statementPreference?: string;
}
