import React, { useState } from 'react';
import type { BankAccount } from '@/types/account';
import { Card } from '@/components/ui/Card';
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

  const statusVariant: 'success' | 'warning' | 'danger' =
    account.status === 'ACTIVE'
      ? 'success'
      : account.status === 'FROZEN'
      ? 'warning'
      : 'danger';

  return (
    <Card
      variant="bordered"
      className="finserv-account-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'var(--spacing-6)',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%), var(--color-surface)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Card Header: Product type, Nickname, Status badge */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <CreditCard size={18} color="var(--color-primary-400)" />
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                {account.productName || 'FinServ Retail Account'}
              </h3>
            </div>
            {account.nickname && (
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-primary-400)',
                  fontWeight: 500,
                  display: 'inline-block',
                  marginTop: 'var(--spacing-1)',
                }}
              >
                &ldquo;{account.nickname}&rdquo;
              </span>
            )}
          </div>
          <Badge variant={statusVariant}>{account.status}</Badge>
        </div>

        {/* Account Number with Reveal & Copy */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            padding: 'var(--spacing-2) var(--spacing-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            margin: 'var(--spacing-3) 0 var(--spacing-5)',
          }}
        >
          <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
            {revealed ? account.accountNumber : account.maskedAccountNumber}
          </div>
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--spacing-1)',
            }}
            title={revealed ? 'Hide account number' : 'Reveal full account number'}
            aria-label={revealed ? 'Hide account number' : 'Reveal full account number'}
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            type="button"
            onClick={handleCopyAcc}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: copiedAcc ? 'var(--color-success-400)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--spacing-1)',
            }}
            title="Copy account number"
            aria-label="Copy account number"
          >
            {copiedAcc ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {/* Balances Display */}
        <div style={{ marginBottom: 'var(--spacing-5)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Available Balance
          </div>
          <div style={{ margin: 'var(--spacing-1) 0' }}>
            <AmountDisplay amount={account.availableBalance} size="xl" />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-2)', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            <div>
              Current: <strong style={{ color: 'var(--text-secondary)' }}><AmountDisplay amount={account.currentBalance} size="sm" /></strong>
            </div>
            {Number(account.holdBalance) > 0 && (
              <div style={{ color: 'var(--color-warning-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldAlert size={12} />
                Hold: <AmountDisplay amount={account.holdBalance} size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Branch & IFSC Info */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: 'var(--spacing-3)',
            marginBottom: 'var(--spacing-4)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
            <Building size={14} color="var(--text-tertiary)" />
            <span>{account.branchName || 'Head Office'}</span>
          </div>
          {account.ifscCode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
              <span>IFSC: <strong style={{ color: 'var(--text-primary)' }}>{account.ifscCode}</strong></span>
              <button
                type="button"
                onClick={handleCopyIfsc}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: copiedIfsc ? 'var(--color-success-400)' : 'var(--text-tertiary)',
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
      <div style={{ display: 'flex', gap: 'var(--spacing-2)', paddingTop: 'var(--spacing-2)' }}>
        {onViewDetails && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(account)}
            style={{ flex: 1 }}
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
          >
            <Settings size={16} />
          </Button>
        )}
      </div>
    </Card>
  );
};
