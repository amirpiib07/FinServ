import React, { useState } from 'react';
import type { Beneficiary } from '@/types/beneficiary';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { useToast } from '@/hooks/useToast';
import {
  Copy,
  Check,
  Trash2,
  KeyRound,
  ShieldAlert,
  Clock,
} from 'lucide-react';

interface BeneficiaryCardProps {
  beneficiary: Beneficiary;
  onVerify: (beneficiary: Beneficiary) => void;
  onDelete: (beneficiary: Beneficiary) => void;
}

export const BeneficiaryCard: React.FC<BeneficiaryCardProps> = ({
  beneficiary,
  onVerify,
  onDelete,
}) => {
  const [copiedAcc, setCopiedAcc] = useState(false);
  const toast = useToast();

  const handleCopyAcc = async () => {
    try {
      await navigator.clipboard.writeText(beneficiary.accountNumber);
      setCopiedAcc(true);
      toast.success('Account number copied');
      setTimeout(() => setCopiedAcc(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const isIntraBank = beneficiary.payeeType === 'INTRA_BANK';
  const isVerified = beneficiary.verificationStatus === 'VERIFIED';

  return (
    <Card
      variant="bordered"
      style={{
        padding: 'var(--spacing-5)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--spacing-4)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div>
        {/* Header Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-2)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              {beneficiary.nickname}
            </h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              {beneficiary.beneficiaryName}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
            <Badge variant={isIntraBank ? 'brand' : 'neutral'}>
              {isIntraBank ? 'Within FinServ' : 'Other Bank'}
            </Badge>
            <Badge variant={isVerified ? 'success' : 'warning'}>
              {isVerified ? 'VERIFIED' : 'PENDING'}
            </Badge>
          </div>
        </div>

        {/* Account Details Box */}
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: 'var(--spacing-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            margin: 'var(--spacing-2) 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              Account Number
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {beneficiary.maskedAccountNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyAcc}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedAcc ? 'var(--color-success-400)' : 'var(--text-tertiary)', padding: '2px' }}
                title="Copy account number"
                aria-label="Copy account number"
              >
                {copiedAcc ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>IFSC / Bank</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              {beneficiary.ifscCode} • {beneficiary.bankName}
            </span>
          </div>

          {beneficiary.dailyTransferLimit && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)', paddingTop: '2px' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Daily Limit</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                <AmountDisplay amount={beneficiary.dailyTransferLimit} size="sm" />
              </span>
            </div>
          )}
        </div>

        {/* Cooling-off or Verification warning */}
        {!isVerified ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-warning-400)',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <ShieldAlert size={14} />
            <span>Pending OTP verification before transfer activation.</span>
          </div>
        ) : beneficiary.coolingOffUntil && new Date(beneficiary.coolingOffUntil) > new Date() ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              fontSize: '11px',
              color: 'var(--color-primary-300)',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Clock size={12} />
            <span>Cooling-off safety window active.</span>
          </div>
        ) : null}
      </div>

      {/* Card Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--spacing-2)', borderTop: '1px solid var(--border-color)' }}>
        {!isVerified ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onVerify(beneficiary)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}
          >
            <KeyRound size={14} />
            Verify with OTP
          </Button>
        ) : (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={14} /> Ready for Transfer
          </span>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(beneficiary)}
          style={{ color: 'var(--color-error-400)', padding: 'var(--spacing-1) var(--spacing-2)' }}
          title="Delete Beneficiary"
          aria-label="Delete Beneficiary"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </Card>
  );
};
