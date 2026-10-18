import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/common/BrandLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { BankingChatbot } from '@/components/common/BankingChatbot';
import {
  Lock,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Database,
  KeyRound,
  Wifi,
} from 'lucide-react';
import type { AppError } from '@/types/api';

const loginSchema = z.object({
  usernameOrEmail: z
    .string()
    .min(3, 'Username or Email must be at least 3 characters long')
    .trim(),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app/accounts';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
  });

  const fillCredentials = (username: string, pass: string) => {
    setValue('usernameOrEmail', username, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setServerError(null);
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await login(data);
      const isStaffOrAdmin = response.user.roles.some((r: string) =>
        ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_EMPLOYEE'].includes(r)
      );

      if (isStaffOrAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else if (
        response.user.roles.includes('ROLE_CUSTOMER') &&
        response.user.status === 'PENDING_VERIFICATION'
      ) {
        navigate('/onboarding', { replace: true });
      } else {
        const target = from === '/app/accounts' ? '/app/dashboard' : from;
        navigate(target, { replace: true });
      }
    } catch (err) {
      const appErr = err as AppError;
      setServerError(
        appErr.userMessage || appErr.message || 'Authentication failed. Please verify your credentials.'
      );
    }
  };

  return (
    <div
      className="auth-split-container page-transition-enter"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: 'var(--surface-canvas)',
      }}
    >
      {/* Left Executive Brand & Platinum Showcase Panel (Desktop) */}
      <div
        className="auth-brand-showcase"
        style={{
          flex: '1 1 48%',
          background: isDark
            ? 'linear-gradient(145deg, #060D1A 0%, #0A192F 50%, #0F2942 100%)'
            : 'linear-gradient(145deg, #EBF3FC 0%, #F0F9FF 50%, #F8FAFC 100%)',
          padding: 'var(--spacing-12) var(--spacing-10)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: isDark ? '#FFFFFF' : '#0B2545',
          position: 'relative',
          overflow: 'hidden',
          borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--border-subtle)',
          transition: 'background 0.3s ease, color 0.3s ease',
        }}
      >
        {/* Ambient Radial Mesh Background Glows */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-15%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(46, 196, 182, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-8)' }}>
            <Link to="/" aria-label="FINServ Banking Home" style={{ textDecoration: 'none' }}>
              <BrandLogo size="md" />
            </Link>

            {/* Live Network Status Indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(16, 185, 129, 0.28)',
                fontSize: '11px',
                fontWeight: 600,
                color: isDark ? '#34D399' : '#065F46',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#34D399' : '#10B981',
                  boxShadow: isDark ? '0 0 8px #34D399' : '0 0 6px #10B981',
                  display: 'inline-block',
                }}
              />
              <span>RBI PILOT • CORE CLEARING LIVE</span>
            </div>
          </div>

          <div style={{ maxWidth: '480px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.12)',
                color: isDark ? '#38BDF8' : '#0369A1',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <ShieldCheck size={14} />
              Enterprise Institutional Security
            </span>

            <h2
              style={{
                fontSize: 'clamp(1.75rem, 2.5vw, 2.25rem)',
                fontWeight: 700,
                lineHeight: 1.25,
                margin: '0 0 var(--spacing-4) 0',
                color: isDark ? '#FFFFFF' : '#0B2545',
                letterSpacing: '-0.02em',
              }}
            >
              The Modern Core-Banking Standard.
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#475569',
                lineHeight: 1.6,
                margin: '0 0 var(--spacing-8) 0',
              }}
            >
              Instant ISO 7064 account openings, immutable double-entry general ledger, and dual-officer authorization workflows.
            </p>

            {/* Stylized FinServ Platinum Card Preview */}
            <div
              className="finserv-account-card"
              style={{
                maxWidth: '380px',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: isDark
                  ? '0 20px 40px -10px rgba(0, 0, 0, 0.5), inset 0 0 1px 1px rgba(255, 255, 255, 0.2)'
                  : '0 20px 35px -10px rgba(15, 23, 42, 0.25), inset 0 0 1px 1px rgba(255, 255, 255, 0.2)',
                padding: 'var(--spacing-5)',
                marginBottom: 'var(--spacing-8)',
                position: 'relative',
                backdropFilter: 'blur(16px)',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="emv-chip">
                    <div className="emv-chip-line-horizontal" />
                    <div className="emv-chip-line-vertical" />
                    <div className="emv-chip-center" />
                  </div>
                  <Wifi size={16} color="rgba(255, 255, 255, 0.7)" style={{ transform: 'rotate(90deg)' }} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#F59E0B', textTransform: 'uppercase' }}>
                  PLATINUM WEALTH
                </div>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '1.15rem',
                  letterSpacing: '0.18em',
                  color: '#FFFFFF',
                  margin: 'var(--spacing-3) 0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                •••• &nbsp;•••• &nbsp;•••• &nbsp;8821
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'var(--spacing-4)' }}>
                <div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.05em' }}>
                    Cardholder
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
                    EXECUTIVE DEPOSITOR
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.05em' }}>
                    Valid Thru
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: '#FFFFFF' }}>
                    12/30
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#34D399' : '#059669',
                  }}
                >
                  <Lock size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                    256-bit AES-GCM Encrypted
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#64748B' }}>
                    Hardware-isolated session keys and TLS 1.3 transport security.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(14, 165, 233, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#38BDF8' : '#0284C7',
                  }}
                >
                  <Database size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                    Double-Entry Verified Ledger
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#64748B' }}>
                    Strict mathematical zero-sum balance and cryptographic idempotency.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(245, 158, 11, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#F59E0B' : '#D97706',
                  }}
                >
                  <KeyRound size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                    Institutional Authorization Workflow
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#64748B' }}>
                    Dual-officer approvals and cooling-off transfer protection.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'var(--text-tertiary)', borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--border-subtle)', paddingTop: 'var(--spacing-4)' }}>
          © 2026 FINServ Core Banking Platform • RBI Pilot Simulator
        </div>
      </div>

      {/* Right Authentication Area */}
      <div
        style={{
          flex: '1 1 52%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-8) var(--spacing-6)',
          position: 'relative',
        }}
      >
        {/* Sleek Theme Toggle in Top Right Corner */}
        <div style={{ position: 'absolute', top: 'var(--spacing-6)', right: 'var(--spacing-6)' }}>
          <ThemeToggle variant="glass" size="md" />
        </div>

        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-8)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ marginBottom: 'var(--spacing-6)', textAlign: 'left' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--brand-accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 'var(--spacing-2)',
                }}
              >
                <span>Customer Access Portal</span>
              </div>
              <h1
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  margin: '0 0 var(--spacing-1) 0',
                  letterSpacing: '-0.02em',
                }}
              >
                Sign in to FINServ
              </h1>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)',
                  margin: 0,
                }}
              >
                Access your secure personal core banking account
              </p>
            </div>

            {serverError && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-3)',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  backgroundColor: 'var(--color-danger-subtle)',
                  border: '1px solid var(--color-danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-danger)',
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--spacing-5)',
                }}
              >
                <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{serverError}</span>
              </div>
            )}

            {/* Quick Demo Access Bar */}
            <div
              style={{
                marginBottom: 'var(--spacing-5)',
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-sunken)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-tertiary)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <KeyRound size={13} color="var(--brand-accent)" />
                <span>Instant Demo Access (Click to autofill)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => fillCredentials('alex.kumar', 'AlexSecureP@ss1!')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Verified Customer with INR accounts & beneficiaries"
                >
                  <div style={{ fontWeight: 600, color: 'var(--brand-accent)' }}>Customer</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>alex.kumar</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('officer.mumbai', 'OfficerSecureP@ss1!')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Bank Officer: KYC Review Queue & Account Opening"
                >
                  <div style={{ fontWeight: 600, color: '#38BDF8' }}>Bank Officer</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>officer.mumbai</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('amit.kumar.singh', 'AdminMasterP@ss1!')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '6px',
                    border: '1px solid rgba(217, 119, 6, 0.4)',
                    backgroundColor: 'var(--surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Super Admin: Branches, Staff, GL Trial Balance & Audit Trail"
                >
                  <div style={{ fontWeight: 600, color: '#F59E0B' }}>Super Admin</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>amit.kumar.singh</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormField
                label="Username or Email"
                error={errors.usernameOrEmail?.message}
                required
                htmlFor="usernameOrEmail"
              >
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder="e.g. jsmith or john@example.com"
                  autoComplete="username"
                  disabled={isSubmitting}
                  hasError={Boolean(errors.usernameOrEmail)}
                  {...register('usernameOrEmail')}
                />
              </FormField>

              <FormField
                label="Password"
                error={errors.password?.message}
                required
                htmlFor="password"
              >
                <PasswordInput
                  id="password"
                  placeholder="Enter your banking password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  hasError={Boolean(errors.password)}
                  {...register('password')}
                />
              </FormField>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'var(--spacing-2)',
                  marginBottom: 'var(--spacing-6)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} color="var(--color-success)" />
                  256-bit SSL Session
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  Branch Helpdesk / 24x7 Support
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isSubmitting}
                disabled={isSubmitting}
                style={{ height: '44px', fontWeight: 600 }}
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In Securely'}
              </Button>
            </form>

            <div
              style={{
                marginTop: 'var(--spacing-6)',
                paddingTop: 'var(--spacing-4)',
                borderTop: '1px solid var(--border-subtle)',
                textAlign: 'center',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              Don't have an account yet?{' '}
              <Link
                to="/register"
                style={{
                  color: 'var(--brand-accent)',
                  fontWeight: 'var(--font-weight-semibold)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  textDecoration: 'none',
                }}
              >
                Apply for Bank Account <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 24/7 Digital Banking Concierge Chatbot */}
      <BankingChatbot />
    </div>
  );
};
