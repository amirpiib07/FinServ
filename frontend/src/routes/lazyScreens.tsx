import { lazy } from 'react';

export const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then(({ LoginPage }) => ({ default: LoginPage }))
);
export const RegisterPage = lazy(() =>
  import('@/features/auth/RegisterPage').then(({ RegisterPage }) => ({ default: RegisterPage }))
);
export const OnboardingPage = lazy(() =>
  import('@/features/onboarding/OnboardingPage').then(({ OnboardingPage }) => ({ default: OnboardingPage }))
);
export const AppLayout = lazy(() =>
  import('@/layouts/AppLayout').then(({ AppLayout }) => ({ default: AppLayout }))
);
export const AccountsPage = lazy(() =>
  import('@/features/accounts/AccountsPage').then(({ AccountsPage }) => ({ default: AccountsPage }))
);
export const BeneficiariesPage = lazy(() =>
  import('@/features/beneficiaries/BeneficiariesPage').then(({ BeneficiariesPage }) => ({ default: BeneficiariesPage }))
);
export const TransfersPage = lazy(() =>
  import('@/features/transfers/TransfersPage').then(({ TransfersPage }) => ({ default: TransfersPage }))
);
export const TransactionsPage = lazy(() =>
  import('@/features/transactions/TransactionsPage').then(({ TransactionsPage }) => ({ default: TransactionsPage }))
);
export const CustomerDashboardPage = lazy(() =>
  import('@/features/dashboard/CustomerDashboardPage').then(({ CustomerDashboardPage }) => ({ default: CustomerDashboardPage }))
);
export const DepositsPage = lazy(() =>
  import('@/features/deposits/DepositsPage').then(({ DepositsPage }) => ({ default: DepositsPage }))
);
export const CardsPage = lazy(() =>
  import('@/features/cards/CardsPage').then(({ CardsPage }) => ({ default: CardsPage }))
);
export const AdminLayout = lazy(() =>
  import('@/layouts/AdminLayout').then(({ AdminLayout }) => ({ default: AdminLayout }))
);
export const AdminDashboardPage = lazy(() =>
  import('@/features/admin/AdminDashboardPage').then(({ AdminDashboardPage }) => ({ default: AdminDashboardPage }))
);
export const KycReviewPage = lazy(() =>
  import('@/features/admin/KycReviewPage').then(({ KycReviewPage }) => ({ default: KycReviewPage }))
);
export const AdminAccountsPage = lazy(() =>
  import('@/features/admin/AdminAccountsPage').then(({ AdminAccountsPage }) => ({ default: AdminAccountsPage }))
);
export const BranchesStaffPage = lazy(() =>
  import('@/features/admin/BranchesStaffPage').then(({ BranchesStaffPage }) => ({ default: BranchesStaffPage }))
);
export const AuditLedgerPage = lazy(() =>
  import('@/features/admin/AuditLedgerPage').then(({ AuditLedgerPage }) => ({ default: AuditLedgerPage }))
);
