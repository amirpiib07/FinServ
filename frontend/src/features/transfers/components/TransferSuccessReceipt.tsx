/**
 * FINServ Luxury Payment Success Receipt Card
 * Renders strictly AFTER backend confirmation with animated SVG checkmark,
 * one-click UTR copy, updated balance, and official receipt print action.
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

  const handleCopyReference = () => {
    if (transaction.transactionReference) {
      navigator.clipboard.writeText(transaction.transactionReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    : 'Just now';

  return (
    <div className="max-w-xl mx-auto p-8 rounded-3xl bg-surface border border-border/60 shadow-2xl space-y-8 animate-fade-in">
      {/* Animated SVG Checkmark + Ripple Ring */}
      <div className="flex flex-col items-center text-center space-y-4">
        <SuccessAnimation size={80} />
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Confirmed by FINServ Core Banking Engine
          </p>
        </div>
      </div>

      {/* Prominent Amount Card */}
      <div className="p-6 rounded-2xl bg-surface-raised border border-border/50 text-center space-y-2">
        <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
          Total Amount Transferred
        </span>
        <div className="text-4xl font-extrabold font-mono text-emerald-500 tracking-tight">
          {formatINR(transaction.amount)}
        </div>
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Status: Completed
          </span>
          <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-surface text-text-muted border border-border/60">
            Mode: {transaction.transferMode || 'IMPS'}
          </span>
        </div>
      </div>

      {/* Reference & Audit Details */}
      <div className="space-y-3">
        {/* Reference Number with One-Click Copy */}
        <div className="p-4 rounded-xl bg-surface-subtle border border-border/40 flex items-center justify-between">
          <div>
            <div className="text-xs text-text-muted">Transaction Reference (UTR)</div>
            <div className="text-sm font-mono font-bold text-text-primary mt-0.5">
              {transaction.transactionReference}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyReference}
            className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-raised transition-colors flex items-center gap-1.5 text-xs font-medium text-text-primary"
            aria-label="Copy transaction reference"
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

        {/* Counterparty / Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border/40">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Clock size={14} />
              <span>Timestamp</span>
            </div>
            <div className="text-xs font-medium text-text-primary mt-1">
              {formattedDate}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border/40">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Wallet size={14} />
              <span>Updated Balance</span>
            </div>
            <div className="text-sm font-mono font-bold text-text-primary mt-0.5">
              {transaction.runningBalance ? formatINR(transaction.runningBalance) : 'Updated'}
            </div>
          </div>
        </div>

        {/* Counterparty / Narration */}
        {transaction.counterpartyName && (
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border/40 flex items-center justify-between">
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
      <div className="flex items-center justify-center gap-2 text-xs text-text-muted pt-2 border-t border-border/40">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>Cryptographically verified on immutable double-entry general ledger</span>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onPrintReceipt(transaction.id)}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Printer size={16} />
          Print Official Receipt
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
