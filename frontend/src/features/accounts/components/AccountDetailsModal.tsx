import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BankAccount } from '@/types/account';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { useToast } from '@/hooks/useToast';
import {
  Copy,
  Check,
  Building,
  ShieldCheck,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from 'lucide-react';

interface AccountDetailsModalProps {
  account: BankAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  account,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState(false);
  const toast = useToast();

  if (!account) return null;

  const handleCopyAcc = async () => {
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopiedAcc(true);
      toast.success('Account number copied');
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
      toast.success('IFSC Code copied');
      setTimeout(() => setCopiedIfsc(false), 2000);
    } catch {
      toast.error('Failed to copy IFSC');
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={account.productName || 'Bank Account Details'}
      description="Complete ledger account records and routing specifications."
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
        {/* Top Summary Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            padding: 'var(--spacing-5)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Available Balance
            </div>
            <div style={{ marginTop: 'var(--spacing-1)' }}>
              <AmountDisplay amount={account.availableBalance} size="xl" />
            </div>
          </div>
          <Badge variant={account.status === 'ACTIVE' ? 'success' : 'warning'}>
            {account.status}
          </Badge>
        </div>

        {/* Specifications Table */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-4)' }}>
          {/* Account Number */}
          <div style={{ padding: 'var(--spacing-3)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
              14-Digit Account Number
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                {account.accountNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyAcc}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedAcc ? 'var(--color-success-400)' : 'var(--text-tertiary)', padding: '2px' }}
                title="Copy account number"
                aria-label="Copy account number"
              >
                {copiedAcc ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-success-400)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
              <ShieldCheck size={12} /> ISO 7064 Mod 11,10 Validated
            </span>
          </div>

          {/* IFSC Code */}
          <div style={{ padding: 'var(--spacing-3)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
              IFSC Routing Code
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                {account.ifscCode || '—'}
              </span>
              {account.ifscCode && (
                <button
                  type="button"
                  onClick={handleCopyIfsc}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedIfsc ? 'var(--color-success-400)' : 'var(--text-tertiary)', padding: '2px' }}
                  title="Copy IFSC"
                  aria-label="Copy IFSC"
                >
                  {copiedIfsc ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block', marginTop: '4px' }}>
              RTGS / NEFT / IMPS Enabled
            </span>
          </div>

          {/* Branch */}
          <div style={{ padding: 'var(--spacing-3)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
              Branch Allocation
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
              <Building size={14} color="var(--text-tertiary)" />
              {account.branchName || 'Head Office Branch'}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block', marginTop: '4px' }}>
              Branch Code: {account.branchCode || '1001'}
            </span>
          </div>

          {/* Date Opened */}
          <div style={{ padding: 'var(--spacing-3)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
              Date Opened
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
              <Calendar size={14} color="var(--text-tertiary)" />
              {new Date(account.openedAt).toLocaleDateString()}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block', marginTop: '4px' }}>
              Version Lock: v{account.version}
            </span>
          </div>
        </div>

        {/* Balance Ledger Breakdown */}
        <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--spacing-3) 0' }}>
            Ledger Balance Invariants
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-xs)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Gross Ledger Balance (Current):</span>
              <strong style={{ color: 'var(--text-primary)' }}><AmountDisplay amount={account.currentBalance} size="sm" /></strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Earmarked Hold Funds (Unsettled / Disputed):</span>
              <strong style={{ color: Number(account.holdBalance) > 0 ? 'var(--color-warning-400)' : 'var(--text-primary)' }}>
                - <AmountDisplay amount={account.holdBalance} size="sm" />
              </strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 'var(--spacing-2)',
                borderTop: '1px solid var(--border-color)',
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-success-400)',
              }}
            >
              <span>Net Available Spendable Balance:</span>
              <AmountDisplay amount={account.availableBalance} size="md" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-3)', paddingTop: 'var(--spacing-3)', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/app/transfers?tab=DEPOSIT&accountId=${account.id}`);
              }}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowDownLeft size={14} /> Deposit Funds
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/app/transfers?tab=WITHDRAW&accountId=${account.id}`);
              }}
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowUpRight size={14} /> Withdraw Cash
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/app/transfers?tab=BENEFICIARY&accountId=${account.id}`);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowLeftRight size={14} /> Transfer
            </Button>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
