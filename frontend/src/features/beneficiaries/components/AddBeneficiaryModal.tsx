import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { beneficiaryService } from '../beneficiaryService';
import type { Beneficiary } from '@/types/beneficiary';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';

const beneficiarySchema = z
  .object({
    nickname: z.string().min(2, 'Nickname must be at least 2 characters').max(60, 'Nickname cannot exceed 60 characters'),
    beneficiaryName: z.string().min(2, 'Beneficiary name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    accountNumber: z.string().regex(/^[0-9]{9,34}$/, 'Account number must be between 9 and 34 digits'),
    confirmAccountNumber: z.string().min(1, 'Please confirm the account number'),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code (e.g. FINS0001001 or HDFC0001234)'),
    bankName: z.string().min(2, 'Bank name is required').max(100, 'Bank name cannot exceed 100 characters'),
    dailyTransferLimit: z
      .string()
      .optional()
      .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
        message: 'Daily transfer limit must be a positive amount',
      }),
  })
  .refine((data) => data.accountNumber === data.confirmAccountNumber, {
    message: 'Account numbers do not match',
    path: ['confirmAccountNumber'],
  });

type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

interface AddBeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBeneficiary: Beneficiary) => void;
}

export const AddBeneficiaryModal: React.FC<AddBeneficiaryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [createdBeneficiary, setCreatedBeneficiary] = useState<Beneficiary | null>(null);
  const [otpCode, setOtpCode] = useState<string>('123456');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const toast = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      nickname: '',
      beneficiaryName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      bankName: '',
      dailyTransferLimit: '50000',
    },
  });

  const handleReset = () => {
    reset();
    setStep('form');
    setCreatedBeneficiary(null);
    setOtpCode('123456');
    setServerError(null);
  };

  const handleFormSubmit = async (data: BeneficiaryFormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const result = await beneficiaryService.addBeneficiary({
        nickname: data.nickname.trim(),
        beneficiaryName: data.beneficiaryName.trim(),
        accountNumber: data.accountNumber.trim(),
        confirmAccountNumber: data.confirmAccountNumber.trim(),
        ifscCode: data.ifscCode.trim().toUpperCase(),
        bankName: data.bankName.trim(),
        dailyTransferLimit: data.dailyTransferLimit ? parseFloat(data.dailyTransferLimit) : undefined,
      });

      setCreatedBeneficiary(result);
      setStep('otp');
      toast.info('Beneficiary registered. Please enter OTP to verify.');
    } catch (err: unknown) {
      const appErr = err as { userMessage?: string; message?: string };
      setServerError(appErr.userMessage || appErr.message || 'Failed to add beneficiary.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdBeneficiary) return;

    if (!otpCode || otpCode.length !== 6) {
      setServerError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setVerifying(true);
    setServerError(null);

    try {
      const verified = await beneficiaryService.verifyBeneficiary(createdBeneficiary.id, {
        otpCode: otpCode.trim(),
      });
      toast.success(`Beneficiary "${verified.nickname}" verified successfully!`);
      onSuccess(verified);
      handleReset();
      onClose();
    } catch (err: unknown) {
      const appErr = err as { userMessage?: string; message?: string };
      setServerError(appErr.userMessage || appErr.message || 'OTP verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !submitting && !verifying) {
          handleReset();
          onClose();
        }
      }}
      title={step === 'form' ? 'Add New Beneficiary' : 'Verify Beneficiary with OTP'}
      description={
        step === 'form'
          ? 'Add an internal FinServ or external bank beneficiary for NEFT / RTGS / IMPS fund transfers.'
          : `A simulated security verification code was generated for ${createdBeneficiary?.nickname}.`
      }
      maxWidth="540px"
    >
      {serverError && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-error-500)',
            color: 'var(--color-error-400)',
            padding: 'var(--spacing-3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          {serverError}
        </div>
      )}

      {step === 'form' ? (
        <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {/* Nickname & Full Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
            <div>
              <label
                htmlFor="beneficiaryNickname"
                style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}
              >
                Payee Nickname *
              </label>
              <Input
                id="beneficiaryNickname"
                {...register('nickname')}
                placeholder="e.g. Landlord, Rahul"
              />
              {errors.nickname && (
                <span style={{ fontSize: '11px', color: 'var(--color-error-400)', marginTop: '2px', display: 'block' }}>
                  {errors.nickname.message}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="beneficiaryName"
                style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}
              >
                Beneficiary Full Name *
              </label>
              <Input
                id="beneficiaryName"
                {...register('beneficiaryName')}
                placeholder="As on bank records"
              />
              {errors.beneficiaryName && (
                <span style={{ fontSize: '11px', color: 'var(--color-error-400)', marginTop: '2px', display: 'block' }}>
                  {errors.beneficiaryName.message}
                </span>
              )}
            </div>
          </div>

          {/* Account Number & Confirm */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
            <div>
              <label
                htmlFor="accountNumber"
                style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}
              >
                Account Number *
              </label>
              <Input
                id="accountNumber"
                type="password"
                autoComplete="off"
                {...register('accountNumber')}
                placeholder="9 to 34 digits"
              />
              {errors.accountNumber && (
                <span style={{ fontSize: '11px', color: 'var(--color-error-400)', marginTop: '2px', display: 'block' }}>
                  {errors.accountNumber.message}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmAccountNumber"
                style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}
              >
                Confirm Account Number *
              </label>
              <Input
                id="confirmAccountNumber"
                type="text"
                autoComplete="off"
                {...register('confirmAccountNumber')}
                placeholder="Re-enter account number"
              />
              {errors.confirmAccountNumber && (
                <span style={{ fontSize: '11px', color: 'var(--color-error-400)', marginTop: '2px', display: 'block' }}>
                  {errors.confirmAccountNumber.message}
                </span>
              )}
            </div>
          </div>

          {/* IFSC Code & Bank Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
            <div>
              <label
                htmlFor="ifscCode"
                style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}
              >
                IFSC Code *
              </label>
              <Input
                id="ifscCode"
                {...register('ifscCode', {
                  onChange: (e) => {
                    setValue('ifscCode', e.target.value.toUpperCase());
                  },
                })}
                placeholder="e.g. FINS0001001"
                style={{ textTransform: 'uppercase' }}
              />
              {errors.ifscCode && (
                <span style={{ fontSize: '11px', color: 'var(--color-error-400)', marginTop: '2px', display: 'block' }}>
                  {errors.ifscCode.message}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="bankName"
                style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}
              >
                Bank Name *
              </label>
              <Input
                id="bankName"
                {...register('bankName')}
                placeholder="e.g. FINServ Bank, HDFC"
              />
              {errors.bankName && (
                <span style={{ fontSize: '11px', color: 'var(--color-error-400)', marginTop: '2px', display: 'block' }}>
                  {errors.bankName.message}
                </span>
              )}
            </div>
          </div>

          {/* Daily Limit */}
          <div>
            <label
              htmlFor="dailyTransferLimit"
              style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}
            >
              Daily Transfer Limit (₹) (Optional)
            </label>
            <Input
              id="dailyTransferLimit"
              type="number"
              step="1000"
              {...register('dailyTransferLimit')}
              placeholder="e.g. 50000"
            />
            {errors.dailyTransferLimit && (
              <span style={{ fontSize: '11px', color: 'var(--color-error-400)', marginTop: '2px', display: 'block' }}>
                {errors.dailyTransferLimit.message}
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-3)' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                handleReset();
                onClose();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              rightIcon={<ArrowRight size={16} />}
            >
              Next: OTP Verify
            </Button>
          </div>
        </form>
      ) : (
        /* Step 2: OTP Verification */
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
          <div
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid var(--color-primary-500)',
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-2)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--color-primary-400)', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              Simulated 2FA Authentication
            </div>
            <div>
              Target Payee: <strong style={{ color: 'var(--text-primary)' }}>{createdBeneficiary?.beneficiaryName}</strong> ({createdBeneficiary?.nickname})
            </div>
            <div>
              Account: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{createdBeneficiary?.maskedAccountNumber}</strong> ({createdBeneficiary?.bankName})
            </div>
            <div style={{ marginTop: 'var(--spacing-1)', color: 'var(--text-tertiary)' }}>
              Demo Test Hint: Enter <strong>123456</strong> or any 6-digit code to immediately verify.
            </div>
          </div>

          <div>
            <label
              htmlFor="otpCodeInput"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--spacing-2)', color: 'var(--text-primary)' }}
            >
              Enter 6-Digit Verification Code
            </label>
            <Input
              id="otpCodeInput"
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              style={{ fontSize: 'var(--font-size-lg)', letterSpacing: '0.25em', textAlign: 'center', fontWeight: 600 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                handleReset();
                onClose();
              }}
              disabled={verifying}
            >
              Skip For Now
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={verifying}
              disabled={otpCode.length !== 6}
              leftIcon={<KeyRound size={16} />}
            >
              Verify Beneficiary
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
