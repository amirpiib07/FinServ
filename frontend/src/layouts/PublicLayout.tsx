/**
 * FINServ Public Layout
 */

import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BrandLogoPlaceholder } from '@/components/common/BrandLogo';
import { HealthWidget } from '@/features/health/HealthWidget';

export const PublicLayout: React.FC = () => {
  return (
    <div className="public-shell">
      <header className="public-header">
        <div className="container public-header-inner">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <BrandLogoPlaceholder size="sm" />
          </Link>

          <nav className="public-nav-links" aria-label="Public Navigation">
            <Link to="/" className="public-nav-link">
              Home
            </Link>
            <Link to="/app" className="public-nav-link">
              App Portal
            </Link>
            {import.meta.env.DEV && (
              <Link to="/design-system" className="public-nav-link" style={{ color: 'var(--brand-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                Design System
              </Link>
            )}
            <HealthWidget compact />
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', alignItems: 'center', textAlign: 'center' }}>
          <div>
            <strong>FINServ</strong> — Enterprise Banking Management System. Double-Entry General Ledger.
          </div>
          <div>
            Architecture: Spring Boot 3.3 + React 19 + TypeScript. Zero floating-point arithmetic. Strict maker-checker & immutable audit trail.
          </div>
        </div>
      </footer>
    </div>
  );
};
