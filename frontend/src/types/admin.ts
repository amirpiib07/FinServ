/**
 * FINServ Admin & Super Admin Portal TypeScript Types
 */

export interface AdminOverviewDto {
  totalCustomers: number;
  pendingKycReviews: number;
  pendingAccountApplications: number;
  totalActiveAccounts: number;
  totalCustomerDeposits: number;
  todayTransactionVolume: number;
  glTrialBalanceStatus: string;
  glIntegrityBalanced: boolean;
}

export interface AdminPageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminKycApplicationDto {
  id: string;
  userId: string;
  applicationReference: string;
  applicantUsername?: string | null;
  applicantEmail?: string | null;
  applicantPhone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  maskedPan?: string | null;
  idType?: string | null;
  maskedIdNumber?: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  currentStep: number;
  submittedAt?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  residentialAddress?: string | null;
  declarationsAccepted: string[];
  rejectionReason?: string | null;
}

export interface AdminAccountSummaryDto {
  accountId: string;
  accountNumber: string;
  customerNumber: string;
  customerName: string;
  productName: string;
  productType: string;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'DORMANT' | 'CLOSED';
  availableBalance: number;
  currentBalance: number;
  holdBalance: number;
  branchName: string;
  ifscCode: string;
  openedAt: string;
}

export interface AdminAccountApplicationDto {
  id: string;
  applicationNumber: string;
  customerId: string;
  customerNumber: string;
  customerName: string;
  productName: string;
  productType: string;
  branchName: string;
  initialDepositAmount: number;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  rejectionReason?: string | null;
}

export interface BranchDto {
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

export interface StaffDto {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  role: string;
  branchId: string;
  branchName: string;
  department?: string;
  designation?: string;
  status: string;
  createdAt: string;
}

export interface CreateBranchRequest {
  branchCode: string;
  branchName: string;
  ifscCode: string;
  routingNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumber: string;
}

export interface CreateStaffRequest {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: 'EMPLOYEE' | 'ADMIN' | 'SUPER_ADMIN';
  branchId: string;
  department?: string;
  designation?: string;
}

export interface GlAccountTrialDto {
  glAccountId: string;
  accountCode: string;
  accountName: string;
  classification: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  currency: string;
  normalBalance: 'DEBIT' | 'CREDIT';
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  status: string;
}

export interface GlTrialBalanceDto {
  balanced: boolean;
  totalDebits: number;
  totalCredits: number;
  difference: number;
  accounts: GlAccountTrialDto[];
}

export interface AuditLogDto {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorUserId?: string;
  actorUsername?: string;
  actorRole?: string;
  action: string;
  ipAddress?: string;
  previousHash: string;
  currentHash: string;
  occurredAt: string;
  metadata?: string;
}
