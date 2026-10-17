/**
 * FINServ Beneficiary & Payee Types
 */

export interface Beneficiary {
  id: string;
  customerId: string;
  payeeType: 'INTRA_BANK' | 'INTER_BANK' | 'UPI';
  nickname: string;
  beneficiaryName: string;
  accountNumber: string;
  maskedAccountNumber: string;
  ifscCode: string;
  bankName: string;
  dailyTransferLimit?: string | number | null;
  coolingOffUntil?: string | null;
  verificationStatus: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  isActive: boolean;
  createdAt: string;
}

export interface CreateBeneficiaryPayload {
  nickname: string;
  beneficiaryName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  dailyTransferLimit?: number | string;
}

export interface VerifyBeneficiaryPayload {
  otpCode: string;
}
