import React, { useState } from 'react';
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

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app/accounts';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await login(data);
      if (
        response.user.roles.includes('ROLE_CUSTOMER') &&
        response.user.status === 'PENDING_VERIFICATION'
      ) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from, { replace: true });
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
          background: 'linear-gradient(145deg, #060D1A 0%, #0A192F 50%, #0F2942 100%)',
          padding: 'var(--spacing-12) var(--spacing-10)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
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
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
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
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, transparent 70%)',
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
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: '11px',
                fontWeight: 600,
                color: '#34D399',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#34D399',
                  boxShadow: '0 0 8px #34D399',
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
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
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
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              The Modern Core-Banking Standard.
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'rgba(255, 255, 255, 0.75)',
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
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), inset 0 0 1px 1px rgba(255, 255, 255, 0.2)',
                padding: 'var(--spacing-5)',
                marginBottom: 'var(--spacing-8)',
                position: 'relative',
                backdropFilter: 'blur(16px)',
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
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34D399',
                  }}
                >
                  <Lock size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#FFFFFF' }}>
                    256-bit AES-GCM Encrypted
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)' }}>
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
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38BDF8',
                  }}
                >
                  <Database size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#FFFFFF' }}>
                    Double-Entry Verified Ledger
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)' }}>
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
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F59E0B',
                  }}
                >
                  <KeyRound size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#FFFFFF' }}>
                    Institutional Authorization Workflow
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)' }}>
                    Dual-officer approvals and cooling-off transfer protection.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 'var(--spacing-4)' }}>
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
    </div>
  );
};
