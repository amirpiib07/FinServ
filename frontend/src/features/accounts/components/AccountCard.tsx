import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BankAccount } from '@/types/account';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { useToast } from '@/hooks/useToast';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Building,
  Settings,
  CreditCard,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface AccountCardProps {
  account: BankAccount;
  onEditControls?: (account: BankAccount) => void;
  onViewDetails?: (account: BankAccount) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onEditControls,
  onViewDetails,
}) => {
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState(false);
  const toast = useToast();

  const handleCopyAcc = async () => {
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopiedAcc(true);
      toast.success('Account number copied to clipboard');
      setTimeout(() => setCopiedAcc(false), 2000);
    } catch {
      toast.error('Failed to copy account number');
    }
  };

  const handleCopyIfsc = async () => {
    if (!account.ifscCode) return;
    try {
      await navigator.clipboard.writeText(account.ifscCode);
      setCopiedIfsc(true);
      toast.success('IFSC Code copied to clipboard');
      setTimeout(() => setCopiedIfsc(false), 2000);
    } catch {
      toast.error('Failed to copy IFSC code');
    }
  };

  const isCurrent =
    account.productCode?.includes('CUR') ||
    account.productName?.toLowerCase().includes('current');

  const cardGradient = isCurrent
    ? 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #022C22 100%)'
    : 'linear-gradient(135deg, #0A192F 0%, #112240 55%, #0B2545 100%)';

  const cardAccent = isCurrent ? '#34D399' : '#2EC4B6';

  const statusVariant: 'success' | 'warning' | 'danger' =
    account.status === 'ACTIVE'
      ? 'success'
      : account.status === 'FROZEN'
      ? 'warning'
      : 'danger';

  return (
    <div
      className="finserv-account-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'var(--spacing-6)',
        borderRadius: 'var(--radius-xl)',
        background: cardGradient,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow:
          '0 10px 30px -5px rgba(10, 22, 40, 0.3), 0 0 1px 1px rgba(255, 255, 255, 0.15) inset',
        position: 'relative',
        overflow: 'hidden',
        color: '#FFFFFF',
        minHeight: '290px',
        transition: 'transform var(--duration-fast) var(--ease-default), box-shadow var(--duration-fast) var(--ease-default)',
      }}
    >
      {/* Background Geometric Watermark SVG */}
      <svg
        style={{
          position: 'absolute',
          right: '-20px',
          bottom: '-30px',
          width: '260px',
          height: '260px',
          opacity: 0.08,
          pointerEvents: 'none',
        }}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="90" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="6 6" />
        <circle cx="100" cy="100" r="70" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="50" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="30" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M10 100H190M100 10V190" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.5" />
      </svg>

      {/* Card Top: Brand mark, Chip, and Status Pill */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            {/* Metallic Gold EMV Chip Icon */}
            <div
              style={{
                width: '34px',
                height: '26px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.4)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '14px',
                  border: '1px solid rgba(0,0,0,0.25)',
                  borderRadius: '2px',
                }}
              />
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                color: cardAccent,
              }}
            >
              <CreditCard size={12} />
              <span>{isCurrent ? 'CURRENT' : 'SAVINGS'}</span>
            </div>
          </div>

          <Badge variant={statusVariant}>{account.status}</Badge>
        </div>

        {/* Product Title and Nickname */}
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              margin: 0,
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
            }}
          >
            {account.productName || 'FinServ Retail Account'}
          </h3>
          {account.nickname && (
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'rgba(255, 255, 255, 0.75)',
                fontWeight: 500,
                display: 'inline-block',
                marginTop: '2px',
              }}
            >
              &ldquo;{account.nickname}&rdquo;
            </span>
          )}
        </div>

        {/* Frosted Glass Account Number Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            backgroundColor: 'rgba(0, 0, 0, 0.28)',
            backdropFilter: 'blur(10px)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            marginBottom: 'var(--spacing-5)',
          }}
        >
          <div
            style={{
              flex: 1,
              fontFamily: 'var(--font-family-mono)',
              fontSize: '13px',
              letterSpacing: '0.1em',
              color: '#FFFFFF',
              fontWeight: 600,
            }}
          >
            {revealed ? account.accountNumber : account.maskedAccountNumber}
          </div>

          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              padding: '4px 6px',
              transition: 'background var(--duration-fast)',
            }}
            title={revealed ? 'Hide account number' : 'Reveal full account number'}
            aria-label={revealed ? 'Hide account number' : 'Reveal full account number'}
          >
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>

          <button
            type="button"
            onClick={handleCopyAcc}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: copiedAcc ? '#34D399' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              padding: '4px 6px',
              transition: 'background var(--duration-fast)',
            }}
            title="Copy account number"
            aria-label="Copy account number"
          >
            {copiedAcc ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>

        {/* Available Balance Header & Amount */}
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.65)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            Available Balance
          </div>
          <div style={{ margin: '4px 0 6px', color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            <AmountDisplay amount={account.availableBalance} size="xl" />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-4)',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.75)',
            }}
          >
            <div>
              Current:{' '}
              <strong style={{ color: '#FFFFFF' }}>
                <AmountDisplay amount={account.currentBalance} size="sm" />
              </strong>
            </div>
            {Number(account.holdBalance) > 0 && (
              <div
                style={{
                  color: '#FBBF24',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                <ShieldAlert size={12} />
                Hold: <AmountDisplay amount={account.holdBalance} size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Branch & IFSC Info */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: 'var(--spacing-3)',
            marginBottom: 'var(--spacing-4)',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.75)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
            <Building size={13} color="rgba(255, 255, 255, 0.6)" />
            <span>{account.branchName || 'Head Office'}</span>
          </div>

          {account.ifscCode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
              <span>
                IFSC: <strong style={{ color: '#FFFFFF' }}>{account.ifscCode}</strong>
              </span>
              <button
                type="button"
                onClick={handleCopyIfsc}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: copiedIfsc ? '#34D399' : 'rgba(255, 255, 255, 0.6)',
                  padding: '2px',
                }}
                title="Copy IFSC code"
                aria-label="Copy IFSC code"
              >
                {copiedIfsc ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-2)',
          paddingTop: 'var(--spacing-2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/app/transfers?tab=DEPOSIT&accountId=${account.id}`)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            color: '#34D399',
            borderColor: 'rgba(52, 211, 153, 0.35)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <ArrowDownLeft size={14} /> Deposit
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/app/transfers?tab=WITHDRAW&accountId=${account.id}`)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            color: '#FBBF24',
            borderColor: 'rgba(251, 191, 36, 0.35)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <ArrowUpRight size={14} /> Withdraw
        </Button>
        {onViewDetails && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(account)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              borderColor: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(8px)',
              fontWeight: 500,
            }}
          >
            Details
          </Button>
        )}
        {onEditControls && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditControls(account)}
            title="Account Controls & Preferences"
            aria-label="Account Controls"
            style={{
              color: 'rgba(255, 255, 255, 0.85)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <Settings size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};
