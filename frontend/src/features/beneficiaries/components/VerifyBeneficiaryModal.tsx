import React, { useState } from 'react';
import type { Beneficiary } from '@/types/beneficiary';
import { beneficiaryService } from '../beneficiaryService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SuccessAnimation } from '@/components/common/SuccessAnimation';
import { useToast } from '@/hooks/useToast';
import { ShieldCheck, KeyRound } from 'lucide-react';

interface VerifyBeneficiaryModalProps {
  beneficiary: Beneficiary | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (verified: Beneficiary) => void;
}

export const VerifyBeneficiaryModal: React.FC<VerifyBeneficiaryModalProps> = ({
  beneficiary,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [prevBeneficiary, setPrevBeneficiary] = useState<Beneficiary | null>(beneficiary);
  const [otpCode, setOtpCode] = useState<string>('123456');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedBeneficiary, setVerifiedBeneficiary] = useState<Beneficiary | null>(null);
  const toast = useToast();

  if (beneficiary !== prevBeneficiary) {
    setPrevBeneficiary(beneficiary);
    setOtpCode('123456');
    setError(null);
    setVerifiedBeneficiary(null);
  }

  if (!beneficiary) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const verified = await beneficiaryService.verifyBeneficiary(beneficiary.id, {
        otpCode: otpCode.trim(),
      });
      toast.success(`Beneficiary "${verified.nickname}" is now verified.`);
      setVerifiedBeneficiary(verified);
      onSuccess(verified);
    } catch (err: unknown) {
      const appErr = err as { userMessage?: string; message?: string };
      setError(appErr.userMessage || appErr.message || 'OTP verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !verifying) {
          setVerifiedBeneficiary(null);
          onClose();
        }
      }}
      title="Verify Beneficiary"
      description={`Enter the security verification code to authorize transfers to ${beneficiary.beneficiaryName}.`}
      maxWidth="440px"
    >
      {verifiedBeneficiary ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-6) var(--spacing-4)' }}>
          <SuccessAnimation
            message="Beneficiary Verified"
            subMessage={`Transfers to ${verifiedBeneficiary.beneficiaryName} (${verifiedBeneficiary.maskedAccountNumber}) are now authorized.`}
            size={80}
          />
          <div style={{ marginTop: 'var(--spacing-6)' }}>
            <Button
              variant="primary"
              onClick={() => {
                setVerifiedBeneficiary(null);
                onClose();
              }}
              style={{ minWidth: '140px' }}
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-error-500)',
              color: 'var(--color-error-400)',
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid var(--color-primary-500)',
            padding: 'var(--spacing-3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--color-primary-400)', fontWeight: 600 }}>
            <ShieldCheck size={16} />
            Security Verification Required
          </div>
          <div style={{ marginTop: '4px' }}>
            Account: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{beneficiary.maskedAccountNumber}</strong> ({beneficiary.bankName})
          </div>
        </div>

        <div>
          <label
            htmlFor="directOtpInput"
            style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--spacing-1)', color: 'var(--text-primary)' }}
          >
            6-Digit Verification Code
          </label>
          <Input
            id="directOtpInput"
            type="text"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="123456"
            style={{ fontSize: 'var(--font-size-lg)', letterSpacing: '0.25em', textAlign: 'center', fontWeight: 600 }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
            Demo code: <strong>123456</strong>
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-2)' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={verifying}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={verifying}
            disabled={otpCode.length !== 6}
            leftIcon={<KeyRound size={16} />}
          >
            Confirm Verification
          </Button>
        </div>
      </form>
      )}
    </Modal>
  );
};
