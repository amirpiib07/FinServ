/**
 * FINServ Responsive App Shell & Navigation Layout — Luxury Core-Banking Architecture
 * Desktop sidebar, mobile navigation drawer, sticky blurred top bar,
 * live IST time badge, dynamic greeting, and ThemeToggle.
 */

import React, { useState, useRef, useContext, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatedOutlet } from '@/components/common/AnimatedOutlet';
import { BrandLogo } from '@/components/common/BrandLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BankingChatbot } from '@/components/common/BankingChatbot';
import { AuthContext } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  Users,
  ArrowLeftRight,
  PiggyBank,
  CreditCard,
  FileText,
  ShieldAlert,
  Menu,
  X,
  CheckCircle2,
  LogOut,
  Clock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { getAsiaKolkataGreeting, getUserDisplayName, getUserInitials } from '@/lib/user-identity';

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

  const navItems = [
    { to: '/app/dashboard', label: 'Executive Home', icon: <LayoutDashboard size={18} /> },
    { to: '/app/accounts', label: 'Accounts & Deposits', icon: <Wallet size={18} /> },
    { to: '/app/beneficiaries', label: 'Beneficiaries', icon: <Users size={18} /> },
    { to: '/app/transfers', label: 'Fund Transfers', icon: <ArrowLeftRight size={18} /> },
    { to: '/app/deposits', label: 'Term Deposits', icon: <PiggyBank size={18} /> },
    { to: '/app/cards', label: 'Cards & UPI', icon: <CreditCard size={18} /> },
    { to: '/app/statements', label: 'Passbook & Statements', icon: <FileText size={18} /> },
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

  const displayName = getUserDisplayName(user);
  const userInitials = getUserInitials(displayName);

  const handleLogout = async () => {
    await authContext?.logout();
    navigate('/login', { replace: true, state: { logoutTransition: true } });
  };

  return (
    <div className="app-shell">
      {/* Desktop Sidebar — Executive Navy Theme */}
      <aside className="app-sidebar" aria-label="Desktop Core Banking Navigation">
        <div className="sidebar-header">
          <BrandLogo size="sm" forceTheme="dark" />
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
                <CheckCircle2 size={12} />
                <span>Signed in</span>
              </div>
            </div>
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
              <BrandLogo size="sm" forceTheme="dark" />
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="btn-icon btn-ghost"
                  aria-label="Close navigation menu"
                  title="Close navigation menu"
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
                    <span>Signed in</span>
                  </div>
                </div>
                <button type="button" onClick={handleLogout} className="sidebar-logout-action" title="Log out">
                  <LogOut size={16} aria-hidden="true" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Main Content Area */}
      <div className="app-main-wrapper">
        <header className="app-topbar">
          <div className="app-topbar-identity" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <button
              ref={triggerRef}
              type="button"
              className="btn btn-icon btn-icon-md btn-ghost app-mobile-menu-trigger"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              title="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={20} />
            </button>

            {/* Dynamic Greeting */}
            <div className="app-greeting-block" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="app-greeting-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>
                  {getAsiaKolkataGreeting()}, {displayName}
                </span>
                <Sparkles className="app-greeting-sparkle" size={14} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Your accounts, transfers and statements
              </span>
            </div>
          </div>

          {/* Topbar Actions: Live IST Badge + Theme Toggle + User Pill */}
          <div className="app-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
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

            {/* Sleek Theme Toggle */}
            <ThemeToggle variant="glass" size="md" />

            <details className="app-user-menu">
              <summary
                className="app-user-trigger"
                aria-label={`Open profile menu for ${displayName}`}
                title={`Profile: ${displayName}`}
              >
                <span className="app-user-avatar" aria-hidden="true">{userInitials}</span>
                <span className="app-user-trigger-name">{displayName}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <div className="app-user-dropdown">
                <div className="app-user-profile-summary">
                  <span className="app-user-avatar app-user-avatar--large" aria-hidden="true">
                    {userInitials}
                  </span>
                  <div className="app-user-profile-copy">
                    <span className="app-user-profile-label">Profile</span>
                    <strong>{displayName}</strong>
                  </div>
                </div>
                <button type="button" className="app-user-menu-action" onClick={handleLogout}>
                  <LogOut size={18} aria-hidden="true" />
                  <span>Log out</span>
                </button>
              </div>
            </details>
          </div>
        </header>

        <main className="app-content page-transition-enter">
          <Breadcrumbs items={breadcrumbItems} />
          <AnimatedOutlet />
        </main>
      </div>

      {/* Floating Banking Concierge Chatbot */}
      <BankingChatbot />
    </div>
  );
};
