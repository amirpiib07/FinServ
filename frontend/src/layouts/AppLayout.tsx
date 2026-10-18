/**
 * FINServ Responsive App Shell & Navigation Layout — Luxury Core-Banking Architecture
 * Desktop sidebar, mobile navigation drawer, sticky blurred top bar,
 * live IST time badge, dynamic greeting, and ThemeToggle.
 */

import React, { useState, useRef, useContext, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { BrandLogo } from '@/components/common/BrandLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AuthContext } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  Users,
  ArrowLeftRight,
  PiggyBank,
  CreditCard,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Menu,
  X,
  Building2,
  CheckCircle2,
  LogOut,
  Clock,
  Sparkles,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  // Live IST Clock
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istDate = now.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const istTime = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setCurrentTimeStr(`${istDate} • ${istTime} IST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Time-of-day greeting
  const getGreeting = () => {
    try {
      const istHour = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
      ).getHours();
      if (istHour < 12) return 'Good morning';
      if (istHour < 17) return 'Good afternoon';
      return 'Good evening';
    } catch {
      return 'Welcome back';
    }
  };

  const navItems = [
    { to: '/app/dashboard', label: 'Executive Home', icon: <LayoutDashboard size={18} /> },
    { to: '/app/accounts', label: 'Accounts & Deposits', icon: <Wallet size={18} /> },
    { to: '/app/beneficiaries', label: 'Beneficiaries', icon: <Users size={18} /> },
    { to: '/app/transfers', label: 'Fund Transfers', icon: <ArrowLeftRight size={18} /> },
    { to: '/app/deposits', label: 'Term Deposits', icon: <PiggyBank size={18} /> },
    { to: '/app/cards', label: 'Cards & UPI', icon: <CreditCard size={18} /> },
    { to: '/app/statements', label: 'Passbook & Statements', icon: <FileText size={18} /> },
    { to: '/app/audit', label: 'Audit Security', icon: <ShieldCheck size={18} /> },
  ];

  // Derive simple breadcrumbs from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { label: 'Banking Portal', href: '/app/accounts' },
    ...pathSegments.slice(1).map((seg, idx) => {
      const href = '/app/' + pathSegments.slice(1, idx + 2).join('/');
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
      return { label, href };
    }),
  ];

  const displayName = user?.username ? user.username : 'Customer';
  const userInitials = (user?.username || 'CU').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await authContext?.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      {/* Desktop Sidebar — Executive Navy Theme */}
      <aside className="app-sidebar" aria-label="Desktop Core Banking Navigation">
        <div className="sidebar-header">
          <BrandLogo size="sm" />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Core Banking Services</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
                <span>KYC Tier 1 Verified</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-icon btn-ghost"
              title="Sign Out"
              aria-label="Sign Out"
              style={{ color: 'rgba(255, 255, 255, 0.6)', padding: '4px' }}
            >
              <LogOut size={15} />
            </button>
          </div>

          {user?.roles.some((r) => ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_EMPLOYEE'].includes(r)) && (
            <NavLink
              to="/admin/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--border-radius-md)',
                background: 'rgba(217, 119, 6, 0.15)',
                border: '1px solid rgba(217, 119, 6, 0.35)',
                color: '#FCD34D',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                marginBottom: '8px',
              }}
            >
              <ShieldAlert size={15} />
              <span>Admin Command Center</span>
            </NavLink>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              padding: '0 var(--spacing-1)',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.55)',
            }}
          >
            <Building2 size={13} color="rgba(255, 255, 255, 0.55)" />
            <span>Branch 1001 (Mumbai Fort HQ)</span>
          </div>
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
              <BrandLogo size="sm" />
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
                    <span>KYC Tier 1 Verified</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-icon btn-ghost"
                  title="Sign Out"
                  aria-label="Sign Out"
                  style={{ color: 'rgba(255, 255, 255, 0.6)', padding: '4px' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
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

            {/* Dynamic Greeting */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {getGreeting()}, {displayName}
                </span>
                <Sparkles size={14} color="#F59E0B" />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Private Core Banking Relationship
              </span>
            </div>
          </div>

          {/* Topbar Actions: Live IST Badge + Theme Toggle + User Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            {/* Live IST Date & Time Badge */}
            {currentTimeStr && (
              <div
                style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-family-mono)',
                  color: 'var(--text-secondary)',
                }}
                className="desktop-search-pill"
              >
                <Clock size={12} color="var(--brand-accent)" />
                <span>{currentTimeStr}</span>
              </div>
            )}

            {/* Regulatory Protection Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: 'var(--color-success)',
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
              <span>DICGC INSURED</span>
            </div>

            {/* Sleek Theme Toggle */}
            <ThemeToggle variant="glass" size="md" />

            {/* User Avatar Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                padding: '3px 10px 3px 4px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #10B981 100%)',
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

        <main className="app-content page-transition-enter">
          <Breadcrumbs items={breadcrumbItems} />
          <Outlet />
        </main>
      </div>
    </div>
  );
};
