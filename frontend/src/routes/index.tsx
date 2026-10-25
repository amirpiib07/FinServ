/**
 * FINServ Master Routing Configuration
 * - Clean entry routing: / redirects to /login, /onboarding, or /app/accounts
 * - Auth Routes (/login, /register)
 * - Progressive Onboarding & KYC (/onboarding)
 * - Core Banking App Shell (/app/accounts, /app/beneficiaries, etc.)
 * - ProtectedRoute session and customer verification guards
 * - Dev-only /design-system route (accessible strictly via direct URL in DEV mode)
 */

import { Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootRedirect } from './RootRedirect';
import { NotFoundPage } from '@/components/common/NotFoundPage';
import { RouteErrorBoundary } from '@/components/common/RouteErrorBoundary';
import { LoadingFallback } from '@/components/common/LoadingFallback';
import { ProtectedRoute } from './ProtectedRoute';
import { DesignSystemPage } from './lazyDesignSystemPage';
import {
  AccountsPage,
  AuditLedgerPage,
  AdminAccountsPage,
  AdminDashboardPage,
  AdminLayout,
  AppLayout,
  BeneficiariesPage,
  BranchesStaffPage,
  CardsPage,
  CustomerDashboardPage,
  DepositsPage,
  KycReviewPage,
  LoginPage,
  OnboardingPage,
  RegisterPage,
  TransactionsPage,
  TransfersPage,
} from './lazyScreens';

import { Navigate } from 'react-router-dom';
const lazyScreen = (screen: ReactNode) => (
  <Suspense fallback={<LoadingFallback message="Loading FINServ..." />}>{screen}</Suspense>
);

export const routes = [
  // Entry Route: Redirect unauthenticated -> /login, unverified -> /onboarding, verified -> /app/accounts
  {
    path: '/',
    element: <RootRedirect />,
    errorElement: <RouteErrorBoundary />,
  },

  // Auth Routes
  {
    path: '/login',
    element: lazyScreen(<LoginPage />),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/register',
    element: lazyScreen(<RegisterPage />),
    errorElement: <RouteErrorBoundary />,
  },

  // Progressive Onboarding & KYC (Requires authenticated session)
  {
    path: '/onboarding',
    element: (
      lazyScreen(
        <ProtectedRoute>
          <OnboardingPage />
        </ProtectedRoute>
      )
    ),
    errorElement: <RouteErrorBoundary />,
  },

  // Core Banking Application Routes (Requires authenticated session & verified customer)
  {
    path: '/app',
    element: (
      lazyScreen(
        <ProtectedRoute requireVerifiedCustomer={true}>
          <AppLayout />
        </ProtectedRoute>
      )
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: lazyScreen(<CustomerDashboardPage />),
      },
      {
        path: 'dashboard',
        element: lazyScreen(<CustomerDashboardPage />),
      },
      {
        path: 'accounts',
        element: lazyScreen(<AccountsPage />),
      },
      {
        path: 'accounts/:id',
        element: lazyScreen(<AccountsPage />),
      },
      {
        path: 'beneficiaries',
        element: lazyScreen(<BeneficiariesPage />),
      },
      {
        path: 'transfers',
        element: lazyScreen(<TransfersPage />),
      },
      {
        path: 'transactions',
        element: lazyScreen(<TransactionsPage />),
      },
      {
        path: 'deposits',
        element: lazyScreen(<DepositsPage />),
      },
      {
        path: 'cards',
        element: lazyScreen(<CardsPage />),
      },
      {
        path: 'statements',
        element: lazyScreen(<TransactionsPage />),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },

  // Admin & Super Admin Command Center Routes
  {
    path: '/admin',
    element: (
      lazyScreen(
        <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_EMPLOYEE']}>
          <AdminLayout />
        </ProtectedRoute>
      )
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: lazyScreen(<AdminDashboardPage />),
      },
      {
        path: 'kyc',
        element: lazyScreen(<KycReviewPage />),
      },
      {
        path: 'accounts',
        element: lazyScreen(<AdminAccountsPage />),
      },
      {
        path: 'branches-staff',
        element: (
          lazyScreen(
            <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN']}>
              <BranchesStaffPage />
            </ProtectedRoute>
          )
        ),
      },
      {
        path: 'audit-ledger',
        element: lazyScreen(<AuditLedgerPage />),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },

  // Development Only Route: Living Design System Catalog (Direct URL access only)
  ...(import.meta.env.DEV && DesignSystemPage
    ? [
        {
          path: '/design-system',
          element: (
            lazyScreen(<DesignSystemPage />)
          ),
          errorElement: <RouteErrorBoundary />,
        },
      ]
    : []),

  // Catch-all 404 Route
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export const router = createBrowserRouter(routes);

