/**
 * FINServ Responsive App Shell & Navigation Layout
 * Desktop sidebar, mobile navigation drawer, top bar, and content breadcrumbs
 */

import React, { useState, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { BrandLogoPlaceholder } from '@/components/common/BrandLogo';
import { HealthWidget } from '@/features/health/HealthWidget';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  CreditCard,
  FileText,
  ShieldCheck,
  Palette,
  Menu,
  X,
  Building2,
  User,
  Users,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  const navItems = [
    { to: '/app', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
    { to: '/app/accounts', label: 'Accounts', icon: <Wallet size={18} /> },
    { to: '/app/beneficiaries', label: 'Beneficiaries', icon: <Users size={18} /> },
    { to: '/app/transfers', label: 'Transfers', icon: <ArrowLeftRight size={18} /> },
    { to: '/app/deposits', label: 'Deposits (FD/RD)', icon: <PiggyBank size={18} /> },
    { to: '/app/cards', label: 'Cards & UPI', icon: <CreditCard size={18} /> },
    { to: '/app/statements', label: 'Statements', icon: <FileText size={18} /> },
    { to: '/app/audit', label: 'Audit Chain', icon: <ShieldCheck size={18} /> },
    ...(import.meta.env.DEV
      ? [{ to: '/design-system', label: 'Design System (Dev)', icon: <Palette size={18} /> }]
      : []),
  ];

  // Derive simple breadcrumbs from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    ...pathSegments.map((seg, idx) => {
      const href = '/' + pathSegments.slice(0, idx + 1).join('/');
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
      return { label, href };
    }),
  ];

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside className="app-sidebar" aria-label="Desktop Core Banking Navigation">
        <div className="sidebar-header">
          <BrandLogoPlaceholder size="sm" />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Core Banking</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
            <Building2 size={16} color="var(--text-tertiary)" />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Branch 1001 (Head Office)
            </span>
          </div>
          <HealthWidget compact />
        </div>
      </aside>

      {/* Mobile Drawer using Radix Dialog for accessible focus trapping & return */}
      <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="mobile-drawer-backdrop" />
          <Dialog.Content
            className="mobile-drawer-content"
            aria-label="Mobile Navigation Menu"
            onCloseAutoFocus={e => {
              e.preventDefault();
              triggerRef.current?.focus();
            }}
          >
            <Dialog.Title className="sr-only">Mobile Navigation Menu</Dialog.Title>
            <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
              <BrandLogoPlaceholder size="sm" />
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="btn-icon btn-ghost"
                  aria-label="Close navigation menu"
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            <nav className="sidebar-nav">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="sidebar-footer">
              <HealthWidget compact />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Main Content Area */}
      <div className="app-main-wrapper">
        <header className="app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <button
              ref={triggerRef}
              type="button"
              className="btn-icon btn-ghost"
              style={{ display: 'inline-flex' }}
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={20} />
            </button>

            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)' }}>
              FINServ Core Banking Portal
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                padding: 'var(--spacing-1) var(--spacing-3)',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--surface-subtle)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)',
              }}
            >
              <User size={14} />
              <span>Phase 4 Auth (Guest)</span>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Breadcrumbs items={breadcrumbItems} />
          <Outlet />
        </main>
      </div>
    </div>
  );
};
