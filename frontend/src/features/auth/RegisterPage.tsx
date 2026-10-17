/**
 * FINServ Customer Account Registration Screen — Luxury Split-Screen Architecture
 * - Progressive credentials creation
 * - Password complexity meter & confirmation check
 * - Zero developer jargon
 * - Animated Sun/Moon ThemeToggle
 * - Platinum card showcase preview
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/common/BrandLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ShieldAlert, ArrowRight, CheckCircle2, Wifi } from 'lucide-react';
import type { AppError } from '@/types/api';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores')
      .trim(),
    email: z
      .string()
      .email('Please enter a valid email address')
      .trim()
      .toLowerCase(),
    phoneNumber: z
      .string()
      .regex(
        /^\+91[6-9]\d{9}$/,
        'Enter a valid 10-digit Indian mobile number prefixed with +91 (e.g. +919876543210)'
      ),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      phoneNumber: '+91',
      password: '',
      confirmPassword: '',
    },
  });

  const [passwordValue, setPasswordValue] = useState<string>('');

  // Password requirements calculation
  const hasMinLength = passwordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordValue);
  const hasLower = /[a-z]/.test(passwordValue);
  const hasDigit = /[0-9]/.test(passwordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerAuth({
        username: data.username,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
      });
      navigate('/onboarding', { replace: true });
    } catch (err) {
      const appErr = err as AppError;
      setServerError(
        appErr.userMessage || appErr.message || 'Registration failed. Please check your information.'
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
      {/* Left Executive Brand & Platinum Showcase */}
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
              <span>RBI PILOT • INSTANT ONBOARDING</span>
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
              Instant Bank Account Opening
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
              Open Your High-Yield Account in Minutes.
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'rgba(255, 255, 255, 0.75)',
                lineHeight: 1.6,
                margin: '0 0 var(--spacing-6) 0',
              }}
            >
              Create your secure credentials, verify contact ownership with OTP, complete regulatory KYC, and receive your 14-digit ISO 7064 account number.
            </p>

            {/* Stylized Platinum Card Preview */}
            <div
              className="finserv-account-card"
              style={{
                maxWidth: '380px',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), inset 0 0 1px 1px rgba(255, 255, 255, 0.2)',
                padding: 'var(--spacing-5)',
                marginBottom: 'var(--spacing-6)',
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
                  FINSERV PRIVILEGE
                </div>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '1.15rem',
                  letterSpacing: '0.18em',
                  color: '#FFFFFF',
                  margin: 'var(--spacing-3) 0',
                }}
              >
                •••• &nbsp;•••• &nbsp;•••• &nbsp;9042
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'var(--spacing-3)' }}>
                <div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)' }}>
                    Customer
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
                    NEW RELATIONSHIP
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)' }}>
                    Protected
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#34D399' }}>
                    DICGC COVERED
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.9)' }}>
                <CheckCircle2 size={16} color="#34D399" />
                <span>Zero minimum balance deposit options available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.9)' }}>
                <CheckCircle2 size={16} color="#34D399" />
                <span>Instant NEFT, RTGS & IMPS payment rails</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.9)' }}>
                <CheckCircle2 size={16} color="#34D399" />
                <span>DICGC deposit insurance protection up to ₹5,00,000</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 'var(--spacing-4)' }}>
          Mandatory KYC verified under Prevention of Money Laundering Act (PMLA).
        </div>
      </div>

      {/* Right Registration Card Area */}
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

        <div style={{ width: '100%', maxWidth: '480px' }}>
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
                <span>Step 1: Security Credentials</span>
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
                Apply for Bank Account
              </h1>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)',
                  margin: 0,
                }}
              >
                Create your primary credentials to initiate digital KYC onboarding
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
                label="Choose Username"
                error={errors.username?.message}
                hint="Used for banking sign-in. Only letters, numbers, and underscores."
                required
                htmlFor="username"
              >
                <Input
                  id="username"
                  placeholder="e.g. john_smith"
                  autoComplete="username"
                  disabled={isSubmitting}
                  hasError={Boolean(errors.username)}
                  {...register('username')}
                />
              </FormField>

              <FormField
                label="Email Address"
                error={errors.email?.message}
                hint="For account statements, transaction alerts, and e-receipts."
                required
                htmlFor="email"
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  hasError={Boolean(errors.email)}
                  {...register('email')}
                />
              </FormField>

              <FormField
                label="Mobile Phone Number"
                error={errors.phoneNumber?.message}
                hint="For instant OTP verification and high-value transfer authorization."
                required
                htmlFor="phoneNumber"
              >
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+919876543210"
                  autoComplete="tel"
                  disabled={isSubmitting}
                  hasError={Boolean(errors.phoneNumber)}
                  {...register('phoneNumber')}
                />
              </FormField>

              <FormField
                label="Create Master Password"
                error={errors.password?.message}
                required
                htmlFor="password"
              >
                <PasswordInput
                  id="password"
                  placeholder="Minimum 8 characters with upper, lower, digit & symbol"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  hasError={Boolean(errors.password)}
                  {...register('password', {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      setPasswordValue(e.target.value);
                    },
                  })}
                />
              </FormField>

              {/* Password Complexity Checklist */}
              {passwordValue && (
                <div
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-4)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    PASSWORD STRENGTH REQUIREMENTS:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px' }}>
                    <span style={{ color: hasMinLength ? 'var(--color-success)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> 8+ Characters
                    </span>
                    <span style={{ color: hasUpper ? 'var(--color-success)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Uppercase Letter
                    </span>
                    <span style={{ color: hasLower ? 'var(--color-success)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Lowercase Letter
                    </span>
                    <span style={{ color: hasDigit ? 'var(--color-success)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Number (0-9)
                    </span>
                    <span style={{ color: hasSpecial ? 'var(--color-success)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', gridColumn: 'span 2' }}>
                      <CheckCircle2 size={12} /> Special Character (!@#$%^&*)
                    </span>
                  </div>
                </div>
              )}

              <FormField
                label="Confirm Password"
                error={errors.confirmPassword?.message}
                required
                htmlFor="confirmPassword"
              >
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  hasError={Boolean(errors.confirmPassword)}
                  {...register('confirmPassword')}
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isSubmitting}
                disabled={isSubmitting}
                style={{ height: '44px', fontWeight: 600, marginTop: 'var(--spacing-2)' }}
              >
                {isSubmitting ? 'Creating Secure Account...' : 'Continue to Digital Verification'}
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
              Already registered?{' '}
              <Link
                to="/login"
                style={{
                  color: 'var(--brand-accent)',
                  fontWeight: 'var(--font-weight-semibold)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  textDecoration: 'none',
                }}
              >
                Sign In <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
