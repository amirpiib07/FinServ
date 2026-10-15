/**
 * FINServ Customer Account Registration Screen
 * - Progressive credentials creation
 * - Password complexity meter & confirmation check
 * - Explains why phone & email are required
 * - Automatic session creation & direct handoff into Onboarding Stepper
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
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
      // After registration, customer role user proceeds immediately to onboarding stepper
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
          maxWidth: '520px',
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
            Create Your Banking Profile
          </h1>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            Step 1 of 2: Create secure banking credentials
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
            label="Banking Username"
            error={errors.username?.message}
            hint="Unique handle for sign in (letters, numbers, underscore)"
            required
            htmlFor="username"
          >
            <Input
              id="username"
              type="text"
              placeholder="e.g. rahul_sharma"
              disabled={isSubmitting}
              hasError={Boolean(errors.username)}
              {...register('username')}
            />
          </FormField>

          <FormField
            label="Email Address"
            error={errors.email?.message}
            hint="Used for critical transaction receipts and account notices"
            required
            htmlFor="email"
          >
            <Input
              id="email"
              type="email"
              placeholder="rahul.sharma@example.com"
              disabled={isSubmitting}
              hasError={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>

          <FormField
            label="Mobile Number (India)"
            error={errors.phoneNumber?.message}
            hint="Required for mandatory 2-Factor Authentication (OTP)"
            required
            htmlFor="phoneNumber"
          >
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+919876543210"
              disabled={isSubmitting}
              hasError={Boolean(errors.phoneNumber)}
              {...register('phoneNumber')}
            />
          </FormField>

          <FormField
            label="Master Password"
            error={errors.password?.message}
            required
            htmlFor="password"
          >
            <PasswordInput
              id="password"
              placeholder="Min. 8 chars with uppercase, number & symbol"
              autoComplete="new-password"
              disabled={isSubmitting}
              hasError={Boolean(errors.password)}
              {...register('password', {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordValue(e.target.value),
              })}
            />
          </FormField>

          {/* Password complexity checklist */}
          <div
            style={{
              padding: 'var(--spacing-3)',
              backgroundColor: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-4)',
              fontSize: 'var(--font-size-xs)',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--spacing-2)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: hasMinLength ? 'var(--color-success)' : 'var(--text-tertiary)',
              }}
            >
              <CheckCircle2 size={12} /> 8+ Characters
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: hasUpper && hasLower ? 'var(--color-success)' : 'var(--text-tertiary)',
              }}
            >
              <CheckCircle2 size={12} /> Upper & Lowercase
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: hasDigit ? 'var(--color-success)' : 'var(--text-tertiary)',
              }}
            >
              <CheckCircle2 size={12} /> At least 1 Number
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: hasSpecial ? 'var(--color-success)' : 'var(--text-tertiary)',
              }}
            >
              <CheckCircle2 size={12} /> Special Character
            </span>
          </div>

          <FormField
            label="Confirm Password"
            error={errors.confirmPassword?.message}
            required
            htmlFor="confirmPassword"
          >
            <PasswordInput
              id="confirmPassword"
              placeholder="Re-type your password"
              autoComplete="new-password"
              disabled={isSubmitting}
              hasError={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
          </FormField>

          <div
            style={{
              padding: 'var(--spacing-3)',
              backgroundColor: 'rgba(46, 196, 182, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(46, 196, 182, 0.2)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-5)',
              display: 'flex',
              gap: 'var(--spacing-2)',
            }}
          >
            <ShieldCheck size={16} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
            <span>
              Bank Security Notice: Registration creates your access profile. Account activation requires completing
              statutory KYC verification in accordance with RBI Master Directions.
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Profile...' : 'Continue to KYC Verification'}
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
          Already have an account?{' '}
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
            Sign in here <ArrowRight size={14} />
          </Link>
        </div>
      </Card>
    </div>
  );
};
