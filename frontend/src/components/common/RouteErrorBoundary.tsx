/**
 * FINServ Route Error Boundary
 * Gracefully intercepts routing, lazy loading, and rendering exceptions.
 * Distinguishes true 404 Not Found from runtime application crashes,
 * providing real error details, retry action, and home redirection.
 */

import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Home, HelpCircle, AlertTriangle, RotateCcw } from 'lucide-react';

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();

  if (import.meta.env.DEV) {
    console.error('FINServ RouteErrorBoundary caught an error:', error);
  }

  // True HTTP 404 response
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-6)',
        }}
      >
        <EmptyState
          icon={<HelpCircle size={32} />}
          title="404 — Page Not Found"
          description="The banking resource, account view, or service page you requested does not exist or has been moved."
          action={
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button variant="primary" leftIcon={<Home size={16} />}>
                Return to Home
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const errorMessage =
    (error as Error)?.message ||
    (isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : null) ||
    'An unexpected system error occurred while rendering this banking view.';

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6)',
      }}
    >
      <EmptyState
        icon={<AlertTriangle size={32} color="var(--color-danger)" />}
        title="Banking Application Error"
        description={errorMessage}
        action={
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <Button
              variant="outline"
              leftIcon={<RotateCcw size={16} />}
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button variant="primary" leftIcon={<Home size={16} />}>
                Return to Home
              </Button>
            </Link>
          </div>
        }
      />
    </div>
  );
};
