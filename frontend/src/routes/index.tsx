/**
 * FINServ Master Routing Configuration
 * - Clean entry routing: / redirects to /login, /onboarding, or /app/accounts
 * - Auth Routes (/login, /register)
 * - Progressive Onboarding & KYC (/onboarding)
 * - Core Banking App Shell (/app/accounts, /app/beneficiaries, etc.)
 * - ProtectedRoute session and customer verification guards
 * - Dev-only /design-system route (accessible strictly via direct URL in DEV mode)
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootRedirect } from './RootRedirect';
import { AppLayout } from '@/layouts/AppLayout';
import { PlaceholderPage } from './PlaceholderPage';
import { NotFoundPage } from '@/components/common/NotFoundPage';
import { LoadingFallback } from '@/components/common/LoadingFallback';
import { ProtectedRoute } from './ProtectedRoute';

import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { AccountsPage } from '@/features/accounts/AccountsPage';
import { BeneficiariesPage } from '@/features/beneficiaries/BeneficiariesPage';
import { TransfersPage } from '@/features/transfers/TransfersPage';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';

// Lazy-load DesignSystemPage conditionally in development only (direct URL only)
const LazyDesignSystemPage = import.meta.env.DEV
  ? lazy(() =>
      import('@/features/design-system/DesignSystemPage').then((module) => ({
        default: module.DesignSystemPage,
      }))
    )
  : null;

export const router = createBrowserRouter([
  // Entry Route: Redirect unauthenticated -> /login, unverified -> /onboarding, verified -> /app/accounts
  {
    path: '/',
    element: <RootRedirect />,
    errorElement: <NotFoundPage />,
  },

  // Auth Routes
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
    errorElement: <NotFoundPage />,
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
        element: <AccountsPage />,
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
        element: <TransfersPage />,
      },
      {
        path: 'transactions',
        element: <TransactionsPage />,
      },
      {
        path: 'deposits',
        element: (
          <PlaceholderPage
            title="Term Deposits & Wealth Products"
            description="High-yield fixed deposits, compounding recurring deposits, and tax-saver investment accounts."
          />
        ),
      },
      {
        path: 'cards',
        element: (
          <PlaceholderPage
            title="Debit Cards, Virtual Cards & UPI"
            description="Manage physical and virtual debit cards, spend limits, international usage toggles, and UPI VPAs."
          />
        ),
      },
      {
        path: 'statements',
        element: <TransactionsPage />,
      },
      {
        path: 'audit',
        element: (
          <PlaceholderPage
            title="Security Audit & Access History"
            description="Review secure session history, device fingerprints, and verified account operation logs."
          />
        ),
      },
    ],
  },

  // Development Only Route: Living Design System Catalog (Direct URL access only)
  ...(import.meta.env.DEV && LazyDesignSystemPage
    ? [
        {
          path: '/design-system',
          element: (
            <Suspense fallback={<LoadingFallback message="Loading design system catalog..." />}>
              <LazyDesignSystemPage />
            </Suspense>
          ),
          errorElement: <NotFoundPage />,
        },
      ]
    : []),

  // Catch-all 404 Route
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
