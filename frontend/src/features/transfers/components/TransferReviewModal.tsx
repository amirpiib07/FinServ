/**
 * FINServ Luxury Transfer Review & Confirm Modal
 * Displays complete transaction preview, charges (Free), and active Idempotency-Key
 * Disables submission while in flight to eliminate duplicate submissions.
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/money';
import {
  ShieldCheck,
  ArrowRight,
  X,
  Lock,
  Building2,
  Wallet,
} from 'lucide-react';

export interface TransferReviewData {
  type: 'BENEFICIARY' | 'SELF' | 'DEPOSIT' | 'WITHDRAW';
  fromAccountNumber?: string;
  fromAccountNickname?: string;
  fromAccountBalance?: string | number;
  toName?: string;
  toAccountNumber?: string;
  toBankName?: string;
  toIfsc?: string;
  amount: string;
  mode: string;
  description?: string;
  idempotencyKey: string;
}

interface TransferReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: TransferReviewData | null;
  onConfirm: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export const TransferReviewModal: React.FC<TransferReviewModalProps> = ({
  open,
  onOpenChange,
  data,
  onConfirm,
  isSubmitting,
  error,
}) => {
  if (!data) return null;

  const isDeposit = data.type === 'DEPOSIT';
  const isWithdraw = data.type === 'WITHDRAW';

  const actionTitle = isDeposit
    ? 'Review Account Funding'
    : isWithdraw
      ? 'Review Cash Withdrawal'
      : 'Review Money Transfer';

  const confirmButtonText = isSubmitting
    ? 'Authorizing Transaction...'
    : isDeposit
      ? 'Confirm & Add Funds'
      : isWithdraw
        ? 'Confirm & Withdraw'
        : 'Confirm & Transfer Money';

  return (
    <Dialog.Root open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content transfer-review-dialog max-w-lg p-0 overflow-hidden"
          aria-describedby="transfer-review-description"
        >
          {/* Header */}
          <div className="transfer-review-header">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck size={20} />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-text-primary">
                  {actionTitle}
                </Dialog.Title>
                <Dialog.Description id="transfer-review-description" className="text-xs text-text-muted">
                  Review the recipient and amount before confirming.
                </Dialog.Description>
              </div>
            </div>

            {!isSubmitting && (
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                  aria-label="Close review dialog"
                  title="Close review dialog"
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            )}
          </div>

          <div className="transfer-review-body">
            {/* Amount Banner */}
            <div className="transfer-review-amount">
              <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
                {isDeposit ? 'Deposit Amount' : isWithdraw ? 'Withdrawal Amount' : 'Transfer Amount'}
              </span>
              <div className="text-3xl font-bold font-mono text-text-primary tracking-tight mt-1">
                {formatINR(data.amount)}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface text-text-muted border border-border/60">
                  {data.mode}
                </span>
              </div>
            </div>

            {error && (
              <div className="transfer-review-error" role="alert">
                {error}
                <span>Retrying here reuses the same idempotency key.</span>
              </div>
            )}

            {/* Account Routing Details */}
            <div className="transfer-review-details">
              {/* From Account */}
              <div className="transfer-review-route">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center text-text-muted">
                    <Wallet size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">
                      {isDeposit ? 'Funding Source' : 'From Account'}
                    </div>
                    <div className="text-sm font-semibold text-text-primary">
                      {isDeposit ? 'Deposit to account' : data.fromAccountNickname || 'FinServ Account'}
                    </div>
                  </div>
                </div>
                {!isDeposit && (
                  <div className="text-right">
                    <div className="text-xs font-mono text-text-muted">
                      {data.fromAccountNumber}
                    </div>
                    {data.fromAccountBalance && (
                      <div className="text-xs text-emerald-500 font-medium">
                        Bal: {formatINR(data.fromAccountBalance)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Destination Arrow (for transfers) */}
              {!isDeposit && !isWithdraw && (
                <div className="flex justify-center -my-1 text-text-muted">
                  <div className="w-6 h-6 rounded-full bg-surface-raised border border-border/60 flex items-center justify-center">
                    <ArrowRight size={12} />
                  </div>
                </div>
              )}

              {/* To Account */}
              <div className="transfer-review-route">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center text-text-muted">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">
                      {isWithdraw ? 'Payout Channel' : 'To Beneficiary / Destination'}
                    </div>
                    <div className="text-sm font-semibold text-text-primary">
                      {isWithdraw ? 'Account withdrawal' : data.toName || 'FinServ Account'}
                    </div>
                  </div>
                </div>
                {!isWithdraw && data.toAccountNumber && (
                  <div className="text-right">
                    <div className="text-xs font-mono text-text-muted">
                      {data.toAccountNumber}
                    </div>
                    {data.toBankName && (
                      <div className="text-xs text-text-muted font-medium">
                        {data.toBankName}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Narration */}
            {data.description && (
              <div className="transfer-review-note">
                <span className="font-medium text-text-primary">Note / Remarks:</span> {data.description}
              </div>
            )}

            {/* Financial Safety Footnote & Idempotency Key */}
            <div className="transfer-review-footnote">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Lock size={12} className="text-emerald-500" />
                <span>The transaction result will be confirmed by FinServ after submission.</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-muted font-mono">
                <span>Idempotency-Key:</span>
                <span className="truncate max-w-[200px]" title={data.idempotencyKey}>
                  {data.idempotencyKey}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="transfer-review-footer">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Modify
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={onConfirm}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="px-6"
            >
              {confirmButtonText}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
