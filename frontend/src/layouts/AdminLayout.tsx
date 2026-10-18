/**
 * FINServ Admin & Super Admin Command Center Layout
 * - Executive sidebar with Gold Super Admin / Electric Blue Bank Officer badge
 * - Live IST Clock, Theme Toggle, Retail Banking switcher, and secure session exit
 * - Radix Dialog mobile drawer navigation
 */

import React, { useState, useEffect, useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ShieldCheck,
  LayoutDashboard,
  UserCheck,
  CreditCard,
  Building2,
  FileSpreadsheet,
  LogOut,
  Sparkles,
  ArrowRightLeft,
  Menu,
  X,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';
import { BrandLogo } from '@/components/common/BrandLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { adminService } from '@/features/admin/adminService';

export const AdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingKycCount, setPendingKycCount] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const isSuperAdmin = user?.roles.includes('ROLE_SUPER_ADMIN');
  const isAdmin = user?.roles.includes('ROLE_ADMIN');

  // Live IST Clock
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

  // Poll for pending KYC count periodically
  useEffect(() => {
    let isMounted = true;
    const fetchCounts = () => {
      adminService
        .getOverview()
        .then((overview) => {
          if (isMounted) {
            setPendingKycCount(overview.pendingKycReviews);
          }
        })
        .catch(() => {
          // ignore background polling error
        });
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Command Overview',
      icon: <LayoutDashboard size={18} />,
    },
    {
      to: '/admin/kyc',
      label: 'KYC Approval Queue',
      icon: <UserCheck size={18} />,
      badge: pendingKycCount > 0 ? pendingKycCount : undefined,
    },
    {
      to: '/admin/accounts',
      label: 'Accounts & Freeze Control',
      icon: <CreditCard size={18} />,
    },
    ...(isSuperAdmin
      ? [
          {
            to: '/admin/branches-staff',
            label: 'Branches & Staff',
            icon: <Building2 size={18} />,
          },
        ]
      : []),
    {
      to: '/admin/audit-ledger',
      label: 'General Ledger & Audit',
      icon: <FileSpreadsheet size={18} />,
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--surface-canvas)' }}>
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: '280px',
          backgroundColor: 'var(--surface-card)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 20,
        }}
        className="app-sidebar-desktop"
      >
        <div>
          {/* Logo & Role Badge Header */}
          <div style={{ padding: 'var(--spacing-5)', borderBottom: '1px solid var(--border-subtle)' }}>
            <BrandLogo size="md" />
            <div style={{ marginTop: 'var(--spacing-3)' }}>
              {isSuperAdmin ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    color: '#D4AF37',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}
                >
                  <Sparkles size={13} />
                  SUPER ADMIN CONSOLE
                </div>
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    color: '#3B82F6',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}
                >
                  <ShieldCheck size={13} />
                  {isAdmin ? 'ADMINISTRATOR' : 'BANK OFFICER'}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: 'var(--spacing-4) var(--spacing-3)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ padding: '0 var(--spacing-3) var(--spacing-2)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Operations & Risk Control
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-lg)',
                  textDecoration: 'none',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  backgroundColor: isActive
                    ? isSuperAdmin
                      ? '#B45309'
                      : 'var(--brand-accent)'
                    : 'transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    style={{
                      backgroundColor: 'var(--color-danger)',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Actions & User Profile */}
        <div style={{ padding: 'var(--spacing-4)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          {/* Switch to Customer Banking */}
          <button
            type="button"
            onClick={() => navigate('/app/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--surface-sunken)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowRightLeft size={14} color="var(--brand-accent)" />
              Customer View
            </span>
            <ChevronRight size={14} color="var(--text-tertiary)" />
          </button>

          {/* Officer Info & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {user?.username || 'Officer'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {user?.email || 'officer@finserv.local'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => authContext?.logout()}
              title="Sign Out"
              aria-label="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: '64px',
            backgroundColor: 'var(--surface-card)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--spacing-6)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Mobile Menu Trigger & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="mobile-nav-trigger"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'none',
              }}
              aria-label="Open Admin Navigation"
            >
              <Menu size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                FINServ Central Core-Banking Operations
              </span>
              <span style={{ color: 'var(--border-subtle)' }}>•</span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {currentTimeStr}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
            <ThemeToggle />
          </div>
        </header>

        {/* Nested Page Content */}
        <main style={{ flex: 1, padding: 'var(--spacing-6)', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Radix Dialog Drawer */}
      <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 50,
              backdropFilter: 'blur(4px)',
            }}
          />
          <Dialog.Content
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '280px',
              backgroundColor: 'var(--surface-card)',
              zIndex: 51,
              padding: 'var(--spacing-5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                <BrandLogo size="sm" />
                <Dialog.Close asChild>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    aria-label="Close Navigation"
                  >
                    <X size={20} />
                  </button>
                </Dialog.Close>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'var(--spacing-4)' }}>
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-lg)',
                      textDecoration: 'none',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--brand-accent)' : 'transparent',
                    })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        style={{
                          backgroundColor: 'var(--color-danger)',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div style={{ paddingTop: 'var(--spacing-4)', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/app/dashboard');
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--surface-sunken)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginBottom: 'var(--spacing-3)',
                }}
              >
                Switch to Customer Banking
              </button>

              <button
                type="button"
                onClick={() => authContext?.logout()}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: 'var(--color-danger)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <LogOut size={14} /> Exit Admin Console
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
