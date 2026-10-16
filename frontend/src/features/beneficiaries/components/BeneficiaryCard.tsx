import React, { useState } from 'react';
import type { Beneficiary } from '@/types/beneficiary';
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
  Building,
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

  // Compute initials from beneficiary legal name or nickname
  const nameParts = (beneficiary.beneficiaryName || beneficiary.nickname)
    .trim()
    .split(/\s+/);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0]?.[0] || ''}${nameParts[1]?.[0] || ''}`.toUpperCase()
      : (beneficiary.beneficiaryName || beneficiary.nickname).slice(0, 2).toUpperCase();

  // Dynamic avatar colour palette based on initials
  const avatarColors = isIntraBank
    ? { bg: 'rgba(46, 196, 182, 0.12)', text: '#0D9488', border: 'rgba(46, 196, 182, 0.25)' }
    : { bg: 'rgba(99, 102, 241, 0.12)', text: '#4F46E5', border: 'rgba(99, 102, 241, 0.25)' };

  return (
    <div
      className="finserv-beneficiary-card"
      style={{
        padding: 'var(--spacing-5)',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--spacing-4)',
        boxShadow: 'var(--shadow-card)',
        transition: 'all var(--duration-fast) var(--ease-default)',
        position: 'relative',
      }}
    >
      <div>
        {/* Header: Initials Avatar + Name & Status Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: avatarColors.bg,
                color: avatarColors.text,
                border: `1.5px solid ${avatarColors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '15px',
                flexShrink: 0,
                letterSpacing: '0.02em',
              }}
            >
              {initials}
            </div>

            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                {beneficiary.nickname}
              </h3>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                {beneficiary.beneficiaryName}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <Badge variant={isIntraBank ? 'brand' : 'neutral'}>
              {isIntraBank ? 'Within FinServ' : 'Other Bank'}
            </Badge>
            <Badge variant={isVerified ? 'success' : 'warning'}>
              {isVerified ? 'VERIFIED' : 'PENDING'}
            </Badge>
          </div>
        </div>

        {/* Account Details & Monospace Badges */}
        <div
          style={{
            backgroundColor: 'var(--surface-subtle)',
            padding: 'var(--spacing-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            margin: 'var(--spacing-2) 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              Account Number
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
              <span
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.05em',
                }}
              >
                {beneficiary.maskedAccountNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyAcc}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: copiedAcc ? 'var(--color-success)' : 'var(--text-tertiary)',
                  padding: '2px 4px',
                  borderRadius: '4px',
                }}
                title="Copy account number"
                aria-label="Copy account number"
              >
                {copiedAcc ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)' }}>
            <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building size={12} /> Bank / IFSC
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                {beneficiary.bankName}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(15, 23, 42, 0.06)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                }}
              >
                {beneficiary.ifscCode}
              </span>
            </div>
          </div>

          {beneficiary.dailyTransferLimit && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)', paddingTop: '2px', borderTop: '1px dashed var(--border-default)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Daily Transfer Limit</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                <AmountDisplay amount={beneficiary.dailyTransferLimit} size="sm" />
              </span>
            </div>
          )}
        </div>

        {/* Verification / Cooling-off Alerts */}
        {!isVerified ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              fontSize: 'var(--font-size-xs)',
              color: '#B45309',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <ShieldAlert size={14} color="#D97706" style={{ flexShrink: 0 }} />
            <span>Pending OTP verification before transfer activation.</span>
          </div>
        ) : beneficiary.coolingOffUntil && new Date(beneficiary.coolingOffUntil) > new Date() ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              fontSize: '11px',
              color: '#1D4ED8',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Clock size={13} color="#2563EB" style={{ flexShrink: 0 }} />
            <span>Cooling-off safety window active.</span>
          </div>
        ) : null}
      </div>

      {/* Card Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 'var(--spacing-3)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
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
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: '#059669',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Check size={14} color="#059669" /> Ready for Transfer
          </span>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(beneficiary)}
          style={{ color: '#EF4444', padding: 'var(--spacing-1) var(--spacing-2)' }}
          title="Delete Beneficiary"
          aria-label="Delete Beneficiary"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
};
