import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/common/BrandLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { BankingChatbot } from '@/components/common/BankingChatbot';
import { AlertCircle, ArrowRight, KeyRound, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import type { AppError } from '@/types/api';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(3, 'Enter a username or email address').trim(),
  password: z.string().min(1, 'Enter your password'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const [serverError, setServerError] = useState<string | null>(null);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [confirmedDestination, setConfirmedDestination] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    || '/app/accounts';
  const isLogoutArrival = Boolean(
    (location.state as { logoutTransition?: boolean } | null)?.logoutTransition
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { usernameOrEmail: '', password: '' },
  });
  const passwordRegistration = register('password');

  const continueToApp = useCallback(() => {
    if (confirmedDestination) {
      navigate(confirmedDestination, { replace: true, state: { loginConfirmed: true } });
    }
  }, [confirmedDestination, navigate]);

  useEffect(() => {
    if (!confirmedDestination) return;
    if (prefersReducedMotion) {
      continueToApp();
      return;
    }
    const timeout = window.setTimeout(continueToApp, 320);
    return () => window.clearTimeout(timeout);
  }, [confirmedDestination, continueToApp, prefersReducedMotion]);

  const fillUsername = (username: string) => {
    setValue('usernameOrEmail', username, { shouldValidate: true });
    setValue('password', '', { shouldValidate: false });
    setServerError(null);
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setConfirmedDestination(null);
    try {
      const response = await login(data);
      const isStaffOrAdmin = response.user.roles.some((role: string) =>
        ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_EMPLOYEE'].includes(role)
      );

      if (isStaffOrAdmin) {
        setConfirmedDestination('/admin/dashboard');
      } else if (
        response.user.roles.includes('ROLE_CUSTOMER')
        && response.user.status === 'PENDING_VERIFICATION'
      ) {
        setConfirmedDestination('/onboarding');
      } else {
        setConfirmedDestination(from === '/app/accounts' ? '/app/dashboard' : from);
      }
    } catch (error) {
      const appError = error as AppError;
      setServerError(
        appError.userMessage
          || appError.message
          || 'We could not verify those details. Check them and try again.'
      );
    }
  };

  return (
    <div className={`auth-split-container ${confirmedDestination ? 'auth-success-state' : ''} ${isLogoutArrival ? 'auth-logout-arrival' : ''}`}>
      <section className="auth-brand-showcase" aria-label="FINServ digital banking">
        <div className="auth-brand-glow auth-brand-glow--top" aria-hidden="true" />
        <div className="auth-brand-glow auth-brand-glow--bottom" aria-hidden="true" />
        <div className="auth-brand-topline">
          <Link to="/" aria-label="FINServ Banking Home" className="auth-brand-link">
            <BrandLogo size="md" forceTheme="dark" />
          </Link>
          <span className="auth-brand-status">
            <span className="auth-status-dot" aria-hidden="true" />
            FINServ Digital Banking
          </span>
        </div>

        <div className="auth-brand-copy">
          <span className="auth-brand-kicker"><ShieldCheck size={15} /> Banking, with clarity</span>
          <h2>Make more room for what matters.</h2>
          <p>
            A considered place to manage everyday banking, keep track of your money, and move
            confidently through what comes next.
          </p>
          <div className="auth-brand-art" aria-hidden="true">
            <div className="auth-art-orbit auth-art-orbit--outer" />
            <div className="auth-art-orbit auth-art-orbit--inner" />
            <div className="auth-art-card">
              <BrandLogo size="sm" variant="mark" showSubtitle={false} />
              <div className="auth-art-card-lines">
                <span />
                <span />
              </div>
              <Sparkles size={18} />
            </div>
          </div>
        </div>

        <div className="auth-brand-foot">
          <LockKeyhole size={15} aria-hidden="true" />
          <span>Private access to your FINServ account</span>
        </div>
      </section>

      <main className="auth-main">
        <div className="auth-main-toolbar">
          <Link to="/" aria-label="FINServ Banking Home" className="auth-mobile-brand">
            <BrandLogo size="sm" showSubtitle={false} />
          </Link>
          <ThemeToggle variant="glass" size="md" />
        </div>

        <div className="auth-form-region">
          <section
            className={`auth-login-card ${serverError ? 'auth-login-card--error' : ''} ${confirmedDestination ? 'auth-login-card--success' : ''}`}
            aria-labelledby="login-title"
          >
            <div className="auth-card-heading">
              <span className="auth-card-kicker">Customer access</span>
              <h1 id="login-title">Welcome back</h1>
              <p>Sign in to continue to your FINServ account.</p>
            </div>

            {serverError && (
              <div className="auth-error-message" role="alert">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{serverError}</span>
              </div>
            )}

            {import.meta.env.DEV && (
              <details className="auth-demo-shortcuts">
                <summary><KeyRound size={15} aria-hidden="true" /> Development account shortcuts</summary>
                <p>Use the local demo password configured for your backend.</p>
                <div className="auth-demo-actions">
                  <button type="button" onClick={() => fillUsername('officer.mumbai')}>
                    <span>Bank officer</span>
                    <small>officer.mumbai</small>
                  </button>
                  <button type="button" onClick={() => fillUsername('amit.kumar.singh')}>
                    <span>Super admin</span>
                    <small>amit.kumar.singh</small>
                  </button>
                </div>
              </details>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormField
                label="Username or email"
                error={errors.usernameOrEmail?.message}
                required
                htmlFor="usernameOrEmail"
              >
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder="Enter your username or email"
                  autoComplete="username"
                  disabled={isSubmitting || Boolean(confirmedDestination)}
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isSubmitting || Boolean(confirmedDestination)}
                  hasError={Boolean(errors.password)}
                  aria-describedby={capsLockOn ? 'password-capslock-hint' : undefined}
                  {...passwordRegistration}
                  onKeyUp={(event) => setCapsLockOn(event.getModifierState('CapsLock'))}
                  onBlur={(event) => {
                    passwordRegistration.onBlur(event);
                    setCapsLockOn(false);
                  }}
                />
              </FormField>
              {capsLockOn && (
                <p id="password-capslock-hint" className="auth-caps-lock-hint" role="status">
                  Caps Lock is on
                </p>
              )}

              <div className="auth-security-note">
                <span><LockKeyhole size={15} aria-hidden="true" /> Secure sign in</span>
                <span>Need help? Contact your administrator.</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isSubmitting}
                disabled={Boolean(confirmedDestination)}
                className="auth-submit-button"
              >
                {confirmedDestination ? 'Signed in securely' : isSubmitting ? 'Signing in securely' : 'Sign in'}
              </Button>
              <span className="sr-only" role="status" aria-live="polite">
                {isSubmitting ? 'Signing in' : ''}
              </span>
            </form>

            {confirmedDestination && !prefersReducedMotion && (
              <button type="button" className="auth-skip-transition" onClick={continueToApp}>
                Continue now <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}

            <div className="auth-register-link">
              <span>New to FINServ?</span>
              <Link to="/register">Apply for an account <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
          </section>
          <p className="auth-legal-note">FINServ Digital Banking <span aria-hidden="true">·</span> © 2026</p>
        </div>
      </main>

      <BankingChatbot />
    </div>
  );
};
