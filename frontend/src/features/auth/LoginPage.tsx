/**
 * FINServ Secure Banking Login Screen
 * - React Hook Form + Zod schema validation
 * - PasswordInput with visibility toggle
 * - Double-submit and in-flight mutation protection
 * - Account lockout and RFC 7807 problem details error display
 * - Post-login routing (onboarding redirect for unverified customers)
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Lock, ShieldAlert, ArrowRight } from 'lucide-react';
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
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-4)',
        backgroundColor: 'var(--surface-bg)',
      }}
    >
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <Link to="/" aria-label="Go to FINServ Home">
          <BrandLogo size="lg" />
        </Link>
      </div>

      <Card
        variant="elevated"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: 'var(--spacing-6)',
          backgroundColor: 'var(--surface-elevated)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ marginBottom: 'var(--spacing-6)', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              margin: '0 0 var(--spacing-2) 0',
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
              padding: 'var(--spacing-3)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#EF4444',
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
              <Lock size={12} />
              256-bit SSL Session
            </span>
            <span style={{ color: 'var(--brand-accent)' }}>
              Self-service recovery in Ph.6
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
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
      </Card>
    </div>
  );
};
