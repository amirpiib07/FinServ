import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/common/BrandLogo';
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

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app';

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
      className="auth-split-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: 'var(--surface-canvas)',
      }}
    >
      {/* Left Executive Brand & Security Showcase (Desktop) */}
      <div
        className="auth-brand-showcase"
        style={{
          flex: '1 1 45%',
          background: 'linear-gradient(150deg, #0A1628 0%, #0F2342 55%, #172B4D 100%)',
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
        {/* Subtle Watermark Circles */}
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(46, 196, 182, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div>
          <Link to="/" aria-label="Go to FINServ Home" style={{ display: 'inline-block', marginBottom: 'var(--spacing-8)' }}>
            <BrandLogo size="md" />
          </Link>

          <div style={{ maxWidth: '460px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(46, 196, 182, 0.15)',
                color: 'var(--brand-accent)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <ShieldCheck size={13} />
              Enterprise Security Architecture
            </span>

            <h2
              style={{
                fontSize: '2rem',
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
              Instant ISO 7064 account openings, immutable double-entry general ledger consistency, and dual-officer authorization workflows.
            </p>

            {/* Trust Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
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
                    Hardware-isolated session keys & TLS 1.3 transport security.
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
                    color: 'var(--brand-accent)',
                  }}
                >
                  <Database size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#FFFFFF' }}>
                    Double-Entry Verified Ledger
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)' }}>
                    Zero floating-point arithmetic with strict mathematical zero-sum balance.
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
                    color: '#FBBF24',
                  }}
                >
                  <KeyRound size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#FFFFFF' }}>
                    RBI-Grade Security Workflow
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)' }}>
                    Maker-checker dual approvals and automated cooling-off transfer limits.
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

      {/* Right Authentication Card Area */}
      <div
        style={{
          flex: '1 1 55%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-8) var(--spacing-6)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
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
                  color: 'var(--text-tertiary)',
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
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-md)',
                  color: '#DC2626',
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
                  <Lock size={12} color="#059669" />
                  256-bit SSL Session
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  Self-service recovery in Ph.6
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
                  color: '#2563EB',
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
