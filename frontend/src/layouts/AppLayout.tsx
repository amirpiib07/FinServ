/**
 * FINServ Responsive App Shell & Navigation Layout
 * Desktop sidebar, mobile navigation drawer, top bar, and content breadcrumbs
 */

import React, { useState, useRef, useContext } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { BrandLogoPlaceholder } from '@/components/common/BrandLogo';
import { HealthWidget } from '@/features/health/HealthWidget';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AuthContext } from '@/context/AuthContext';
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
  Users,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

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

  const displayName = user?.username ? user.username : 'Customer';
  const userInitials = (user?.username || 'CU').slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside className="app-sidebar" aria-label="Desktop Core Banking Navigation">
        <div className="sidebar-header">
          <BrandLogoPlaceholder size="sm" />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Core Banking</div>
          {navItems.map((item) => (
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
          {/* Executive User Profile Card */}
          <div className="sidebar-user-profile">
            <div className="sidebar-user-avatar">{userInitials}</div>
            <div className="sidebar-user-details">
              <div className="sidebar-user-name" title={displayName}>
                {displayName}
              </div>
              <div className="sidebar-user-status">
                <CheckCircle2 size={12} color="#34D399" />
                <span>KYC Verified Tier 1</span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              padding: '0 var(--spacing-1)',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <Building2 size={14} color="rgba(255, 255, 255, 0.5)" />
            <span>Branch 1001 (Mumbai HQ)</span>
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
            onCloseAutoFocus={(e) => {
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
                  style={{ color: '#FFFFFF' }}
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            <nav className="sidebar-nav">
              {navItems.map((item) => (
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
              <div className="sidebar-user-profile">
                <div className="sidebar-user-avatar">{userInitials}</div>
                <div className="sidebar-user-details">
                  <div className="sidebar-user-name">{displayName}</div>
                  <div className="sidebar-user-status">
                    <CheckCircle2 size={12} color="#34D399" />
                    <span>Verified Customer</span>
                  </div>
                </div>
              </div>
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
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={20} />
            </button>

            <div>
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                FINServ Core Banking Portal
              </span>
            </div>
          </div>

          {/* Topbar Search Pill & Environment Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
            {/* Quick Command Pill */}
            <div
              style={{
                display: 'none',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
              }}
              className="desktop-search-pill"
            >
              <Search size={14} color="var(--text-tertiary)" />
              <span>Search accounts, payees...</span>
              <kbd
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-default)',
                  borderRadius: '4px',
                  padding: '1px 5px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                ⌘K
              </kbd>
            </div>

            {/* Regulatory Simulation Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(5, 150, 105, 0.08)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
                color: '#065F46',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                  display: 'inline-block',
                }}
              />
              <span>LIVE SIMULATION / RBI PILOT</span>
            </div>

            {/* User Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                padding: '4px 12px 4px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0B2545 0%, #2EC4B6 100%)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {userInitials}
              </div>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-primary)',
                }}
              >
                {displayName}
              </span>
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
