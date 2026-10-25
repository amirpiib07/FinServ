/**
 * FINServ Luxury Payment Success Receipt Card
 * Renders strictly AFTER backend confirmation with animated SVG checkmark,
 * transaction-reference copy, updated balance, and printable receipt action.
 */

import React, { useState } from 'react';
import { SuccessAnimation } from '@/components/common/SuccessAnimation';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/money';
import { formatDateTimeIST } from '@/lib/dates';
import type { TransactionDto } from '../types/transferTypes';
import {
  Copy,
  Check,
  Printer,
  ArrowRight,
  ShieldCheck,
  Building2,
  Wallet,
  Clock,
} from 'lucide-react';

interface TransferSuccessReceiptProps {
  transaction: TransactionDto;
  onReset: () => void;
  onViewPassbook: () => void;
  onPrintReceipt: (transactionId: string) => void;
}

export const TransferSuccessReceipt: React.FC<TransferSuccessReceiptProps> = ({
  transaction,
  onReset,
  onViewPassbook,
  onPrintReceipt,
}) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopyReference = async () => {
    if (!transaction.transactionReference) return;
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(transaction.transactionReference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError('Could not copy the reference. Select and copy it manually.');
    }
  };

  const isDeposit = transaction.transactionType === 'DEPOSIT';
  const isWithdraw = transaction.transactionType === 'WITHDRAWAL';

  const title = isDeposit
    ? 'Account Funded Successfully!'
    : isWithdraw
      ? 'Cash Withdrawal Confirmed!'
      : 'Payment Transfer Successful!';

  const formattedDate = transaction.createdAt
    ? formatDateTimeIST(transaction.createdAt)
    : 'Timestamp unavailable';
  const displayedBalance =
    transaction.runningBalance ??
    transaction.toAccountBalanceAfter ??
    transaction.fromAccountBalanceAfter;
  const amountLabel = isDeposit ? 'Amount deposited' : isWithdraw ? 'Amount withdrawn' : 'Amount transferred';

  return (
    <div className="transfer-success-receipt">
      {/* Animated SVG Checkmark + Ripple Ring */}
      <div className="transfer-success-heading">
        <SuccessAnimation size={80} />
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Confirmation received from the banking service.
          </p>
        </div>
      </div>

      {/* Prominent Amount Card */}
      <div className="transfer-success-amount">
        <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
          {amountLabel}
        </span>
        <div className="transfer-success-total">
          {formatINR(transaction.amount)}
        </div>
        <div className="transfer-success-status">
          <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Status: {transaction.status}
          </span>
          <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-surface text-text-muted border border-border/60">
            Mode: {transaction.transferMode || 'Not provided'}
          </span>
        </div>
      </div>

      {/* Reference & Audit Details */}
      <div className="transfer-receipt-details">
        {/* Reference Number with One-Click Copy */}
        <div className="transfer-reference">
          <div>
            <div className="text-xs text-text-muted">Transaction reference</div>
            <div className="text-sm font-mono font-bold text-text-primary mt-0.5">
              {transaction.transactionReference || 'Not provided'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyReference}
            disabled={!transaction.transactionReference}
            className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-raised transition-colors flex items-center gap-1.5 text-xs font-medium text-text-primary"
            aria-label="Copy transaction reference"
            title="Copy transaction reference"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Ref</span>
              </>
            )}
          </button>
        </div>
        {copyError && <p className="transfer-copy-error" role="alert">{copyError}</p>}

        {/* Counterparty / Details */}
        <div className="transfer-receipt-grid">
          <div className="transfer-receipt-item">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Clock size={14} />
              <span>Timestamp</span>
            </div>
            <div className="text-xs font-medium text-text-primary mt-1">
              {formattedDate}
            </div>
          </div>

          <div className="transfer-receipt-item">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Wallet size={14} />
              <span>Updated Balance</span>
            </div>
            <div className="text-sm font-mono font-bold text-text-primary mt-0.5">
              {displayedBalance != null ? formatINR(displayedBalance) : 'Balance unavailable'}
            </div>
          </div>
        </div>

        {/* Counterparty / Narration */}
        {transaction.counterpartyName && (
          <div className="transfer-receipt-item transfer-counterparty">
            <div className="flex items-center gap-2.5">
              <Building2 size={16} className="text-text-muted" />
              <div>
                <div className="text-xs text-text-muted">Recipient / Account</div>
                <div className="text-xs font-semibold text-text-primary">
                  {transaction.counterpartyName}
                </div>
              </div>
            </div>
            {transaction.toAccountNumber && (
              <div className="text-xs font-mono text-text-muted">
                {transaction.toAccountNumber}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Endorsement */}
      <div className="transfer-ledger-note">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>Transaction details returned by the banking service.</span>
      </div>

      {/* Actions */}
      <div className="transfer-receipt-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onPrintReceipt(transaction.id)}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Printer size={16} />
          Print Receipt
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={onViewPassbook}
            className="flex-1 sm:flex-none"
          >
            View Passbook
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={onReset}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5"
          >
            <span>Transfer Again</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};
