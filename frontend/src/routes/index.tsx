/**
 * FINServ Master Routing Configuration
 * - Public Layout and Core Banking App Shell
 * - Placeholder pages with "Coming in Phase X" adhering to zero-fake-data policy
 * - Dev-only /design-system route (statically excluded from production builds)
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { HomePage } from './HomePage';
import { PlaceholderPage } from './PlaceholderPage';
import { NotFoundPage } from '@/components/common/NotFoundPage';
import { LoadingFallback } from '@/components/common/LoadingFallback';

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
    ],
  },

  // Core Banking Application Routes
  {
    path: '/app',
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: (
          <PlaceholderPage
            title="Customer Banking Dashboard"
            phaseNumber={11}
            phaseName="Customer Dashboard + Core-Banking Navigation"
            description="Overview of retail deposit balances, quick pay actions, recent transactions, and financial analytics will be rendered after Phase 4 authentication is established."
          />
        ),
      },
      {
        path: 'accounts',
        element: (
          <PlaceholderPage
            title="Account Management"
            phaseNumber={7}
            phaseName="Account Applications, Opening, Management"
            description="Savings & Current accounts, 14-digit ISO 7064 Mod 11,10 account numbers, and account freezing controls."
          />
        ),
      },
      {
        path: 'transfers',
        element: (
          <PlaceholderPage
            title="Fund Transfers & Payments"
            phaseNumber={9}
            phaseName="Deposits, Withdrawals, Transfers, Ledger, Safety"
            description="Double-entry ledger posting, pessimistic row locking, and strict idempotency key replay protection."
          />
        ),
      },
      {
        path: 'deposits',
        element: (
          <PlaceholderPage
            title="Fixed & Recurring Deposits"
            phaseNumber={15}
            phaseName="FD/RD and Deposit Products"
            description="Term deposit creation, compounding interest calculator, and premature liquidation handling."
          />
        ),
      },
      {
        path: 'cards',
        element: (
          <PlaceholderPage
            title="Debit/Credit Cards & UPI"
            phaseNumber={19}
            phaseName="Cards and UPI Integrations"
            description="Virtual card issuance, limit management, ATM/Online security toggles, and UPI VPAs."
          />
        ),
      },
      {
        path: 'statements',
        element: (
          <PlaceholderPage
            title="Statements & Tax Receipts"
            phaseNumber={10}
            phaseName="Transaction History, Statements, Receipts"
            description="Paginated transaction ledger, cryptographic digital receipts, and downloadable PDF/CSV statements."
          />
        ),
      },
      {
        path: 'audit',
        element: (
          <PlaceholderPage
            title="Audit Chain Explorer"
            phaseNumber={12}
            phaseName="Employee Portal, Admin Portal, Audit Operations"
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
