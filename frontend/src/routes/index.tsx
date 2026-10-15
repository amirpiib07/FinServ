/**
 * FINServ Master Routing Configuration
 * - Public Layout and Core Banking App Shell
 * - Auth & Progressive Onboarding Routes (/login, /register, /onboarding)
 * - ProtectedRoute session and customer verification guards
 * - Placeholder pages mapped to the consolidated 7-Phase Master Roadmap
 * - Dev-only /design-system route
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { HomePage } from './HomePage';
import { PlaceholderPage } from './PlaceholderPage';
import { NotFoundPage } from '@/components/common/NotFoundPage';
import { LoadingFallback } from '@/components/common/LoadingFallback';
import { ProtectedRoute } from './ProtectedRoute';

import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { AccountsPage } from '@/features/accounts/AccountsPage';
import { BeneficiariesPage } from '@/features/beneficiaries/BeneficiariesPage';

// Lazy-load DesignSystemPage conditionally in development only
const LazyDesignSystemPage = import.meta.env.DEV
  ? lazy(() =>
      import('@/features/design-system/DesignSystemPage').then(module => ({
        default: module.DesignSystemPage,
      }))
    )
  : null;

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },

  // Progressive Onboarding & KYC (Requires authenticated session)
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
    errorElement: <NotFoundPage />,
  },

  // Core Banking Application Routes (Requires authenticated session & verified customer)
  {
    path: '/app',
    element: (
      <ProtectedRoute requireVerifiedCustomer={true}>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: (
          <PlaceholderPage
            title="Customer Banking Dashboard"
            phaseNumber={6}
            phaseName="Customer Dashboard + Employee/Admin Portal"
            description="Overview of retail deposit balances, quick pay actions, recent transactions, and financial analytics."
          />
        ),
      },
      {
        path: 'accounts',
        element: <AccountsPage />,
      },
      {
        path: 'accounts/:id',
        element: <AccountsPage />,
      },
      {
        path: 'beneficiaries',
        element: <BeneficiariesPage />,
      },
      {
        path: 'transfers',
        element: (
          <PlaceholderPage
            title="Fund Transfers & Double-Entry Ledger"
            phaseNumber={5}
            phaseName="Money Transfers, Deposits/Withdrawals & Double-Entry Ledger"
            description="Double-entry ledger posting, pessimistic row locking, and strict idempotency key replay protection."
          />
        ),
      },
      {
        path: 'deposits',
        element: (
          <PlaceholderPage
            title="Fixed & Recurring Deposits"
            phaseNumber={7}
            phaseName="Core Add-ons (FD/Cards Overview), UI/Motion Polish & Final Docs"
            description="Term deposit creation, compounding interest calculator, and premature liquidation handling."
          />
        ),
      },
      {
        path: 'cards',
        element: (
          <PlaceholderPage
            title="Debit/Credit Cards & UPI"
            phaseNumber={7}
            phaseName="Core Add-ons (FD/Cards Overview), UI/Motion Polish & Final Docs"
            description="Virtual card issuance, limit management, ATM/Online security toggles, and UPI VPAs."
          />
        ),
      },
      {
        path: 'statements',
        element: (
          <PlaceholderPage
            title="Statements & Receipts"
            phaseNumber={5}
            phaseName="Money Transfers, Deposits/Withdrawals & Statements/Receipts"
            description="Paginated transaction ledger, cryptographic digital receipts, and downloadable PDF/CSV statements."
          />
        ),
      },
      {
        path: 'audit',
        element: (
          <PlaceholderPage
            title="Audit Chain & Operations"
            phaseNumber={6}
            phaseName="Customer Dashboard + Employee/Admin Portal & Audit Logs"
            description="Tamper-evident SHA-256 audit log explorer with microsecond timestamps and payload diff viewer."
          />
        ),
      },
    ],
  },

  // Development Only Route: Living Design System Catalog
  ...(import.meta.env.DEV && LazyDesignSystemPage
    ? [
        {
          path: '/design-system',
          element: <PublicLayout />,
          children: [
            {
              index: true,
              element: (
                <Suspense fallback={<LoadingFallback message="Loading living design system..." />}>
                  <LazyDesignSystemPage />
                </Suspense>
              ),
            },
          ],
        },
      ]
    : []),

  // Catch-all 404 Route
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
