export interface FdRateSlab {
  tenureMonths: number;
  interestRatePercentage: number;
  displayLabel: string;
  description: string;
}

export interface FixedDeposit {
  id: string;
  depositNumber: string;
  customerId: string;
  sourceAccountId: string;
  sourceAccountNumber: string;
  principalAmount: number;
  interestRatePercentage: number;
  tenureMonths: number;
  interestEarned: number;
  maturityAmount: number;
  status: 'ACTIVE' | 'CLOSED';
  startDate: string;
  maturityDate: string;
  createdAt: string;
}

export interface BookFixedDepositRequest {
  sourceAccountId: string;
  principalAmount: string;
  tenureMonths: number;
}
