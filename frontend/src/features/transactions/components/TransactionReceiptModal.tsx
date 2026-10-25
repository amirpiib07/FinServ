/**
 * FINServ Official Transaction Receipt Modal & Printable Advice
 * - Displays complete verified transaction details, UTR/Reference, counterparty, and GL Journal ID
 * - Integrated 1-click copy for reference number
 * - Native @media print styling for executive clean PDF export
 * - Regulatory compliance disclosures (RBI / DICGC)
 */

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Printer,
  Copy,
  Check,
  X,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatINR } from '@/lib/money';
import { formatDateTimeIST } from '@/lib/dates';
import { maskAccountNumber } from '@/lib/masking';
import { transferService } from '@/features/transfers/services/transferService';
import type { TransactionReceiptDto } from '@/features/transfers/types/transferTypes';

export interface TransactionReceiptModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  receipt?: TransactionReceiptDto | null;
  transactionId?: string | null;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  isOpen,
  open,
  onClose,
  onOpenChange,
  receipt,
  transactionId,
}) => {
  const [copied, setCopied] = useState(false);
  const [loadedReceipt, setLoadedReceipt] = useState<TransactionReceiptDto | null>(null);

  const effectiveOpen = open !== undefined ? open : (isOpen ?? false);
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  useEffect(() => {
    if (transactionId && effectiveOpen && !receipt) {
      transferService
        .getTransactionReceipt(transactionId)
        .then((data) => setLoadedReceipt(data))
        .catch((err) => console.error('Failed to load transaction receipt:', err));
    }
  }, [transactionId, effectiveOpen, receipt]);

  const r = receipt || loadedReceipt;

  if (!effectiveOpen || !r) return null;

  const handleCopyReference = () => {
    if (!r.transactionReference) return;
    navigator.clipboard.writeText(r.transactionReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isDeposit = r.transactionType === 'DEPOSIT';
  const isWithdrawal = r.transactionType === 'WITHDRAWAL';
  const isCredit =
    r.transactionType === 'DEPOSIT' ||
    (r.toAccountNumber && !r.fromAccountNumber);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--color-success)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <CheckCircle2 size={13} />
            Success / Settled
          </span>
        );
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: 'var(--color-warning)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <Clock size={13} />
            Processing
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--color-danger)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertCircle size={13} />
            {status}
          </span>
        );
    }
  };

  const getModeLabel = (mode: string, type: string) => {
    if (type === 'DEPOSIT') return 'Cash / Treasury Deposit';
    if (type === 'WITHDRAWAL') return 'ATM / Cash Withdrawal';
    switch (mode) {
      case 'INTERNAL':
        return 'FinServ Instant Internal Transfer';
      case 'IMPS':
        return 'IMPS 24x7 Real-Time Payment';
      case 'NEFT':
        return 'NEFT National Electronic Clearing';
      case 'RTGS':
        return 'RTGS Real-Time Gross Settlement';
      default:
        return mode || 'Electronic Funds Transfer';
    }
  };

  return (
    <Dialog.Root open={effectiveOpen} onOpenChange={(openVal) => !openVal && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-backdrop print:hidden" />
        <Dialog.Content
          className="modal-content print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none"
          style={{
            maxWidth: '560px',
            width: '95vw',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: 'var(--spacing-6)',
          }}
          aria-describedby="receipt-desc"
        >
          <div className="print-area">
            {/* Header: FinServ Brand + Close Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 'var(--spacing-4)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #0A192F 0%, #1D4ED8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60A5FA',
                    fontWeight: 800,
                    fontSize: '14px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  FS
                </div>
                <div>
                  <Dialog.Title
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                      margin: 0,
                    }}
                  >
                    FINServ Banking Corporation
                  </Dialog.Title>
                  <p
                    id="receipt-desc"
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-tertiary)',
                      margin: 0,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Official Electronic Transaction Advice
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                {getStatusBadge(r.status)}
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="btn-icon btn-ghost print:hidden"
                    onClick={handleClose}
                    aria-label="Close transaction receipt"
                    title="Close transaction receipt"
                  >
                    <X size={18} />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Amount Banner */}
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-6) var(--spacing-4)',
                background: 'var(--surface-subtle)',
                borderRadius: 'var(--radius-xl)',
                margin: 'var(--spacing-5) 0',
                border: '1px solid var(--border-subtle)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: isDeposit
                    ? 'rgba(16, 185, 129, 0.15)'
                    : isWithdrawal
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(59, 130, 246, 0.15)',
                  color: isDeposit
                    ? 'var(--color-success)'
                    : isWithdrawal
                      ? 'var(--color-danger)'
                      : 'var(--brand-accent)',
                  margin: '0 auto var(--spacing-2) auto',
                }}
              >
                {isDeposit ? (
                  <ArrowDownLeft size={22} />
                ) : isWithdrawal ? (
                  <ArrowUpRight size={22} />
                ) : (
                  <ArrowLeftRight size={22} />
                )}
              </div>

              <div
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: isCredit ? 'var(--color-success)' : 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-family-mono)',
                  marginBottom: 'var(--spacing-1)',
                }}
              >
                {formatINR(r.amount, { showSymbol: true })}
              </div>

              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-secondary)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                {getModeLabel(r.transferMode, r.transactionType)}
              </div>
            </div>

            {/* Primary Details Grid */}
            <div
              style={{
                display: 'grid',
                gap: 'var(--spacing-3)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {/* Reference / UTR Number with Copy */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  backgroundColor: 'var(--surface-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                  UTR / Reference No.
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    {r.transactionReference}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyReference}
                    className="btn-icon btn-ghost print:hidden"
                    style={{ padding: '2px', color: copied ? '#10B981' : 'var(--text-tertiary)' }}
                    title="Copy Reference"
                    aria-label="Copy Reference"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Timestamp */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderBottom: '1px dashed var(--border-subtle)',
                }}
              >
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                  Transaction Date & Time
                </span>
                <span
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {formatDateTimeIST(r.createdAt)}
                </span>
              </div>

              {/* Sender Details */}
              {r.fromAccountNumber && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    borderBottom: '1px dashed var(--border-subtle)',
                  }}
                >
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                    Paid From Account
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.fromAccountHolderName || 'Primary Account'}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {maskAccountNumber(r.fromAccountNumber)} (IFSC: {r.fromAccountIfsc || 'FSVN0001001'})
                    </div>
                  </div>
                </div>
              )}

              {/* Recipient / Counterparty Details */}
              {(r.toAccountNumber || r.toAccountHolderName) && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    borderBottom: '1px dashed var(--border-subtle)',
                  }}
                >
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                    Transferred To
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.toAccountHolderName || 'Recipient'}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {r.toAccountNumber ? maskAccountNumber(r.toAccountNumber) : ''}{' '}
                      {r.toBankName ? `• ${r.toBankName}` : ''}{' '}
                      {r.toIfscCode ? `(IFSC: ${r.toIfscCode})` : ''}
                    </div>
                  </div>
                </div>
              )}

              {/* Narration / Remarks */}
              {r.description && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    borderBottom: '1px dashed var(--border-subtle)',
                  }}
                >
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                    Description / Narration
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {r.description}
                  </span>
                </div>
              )}

              {/* Fees & Charges */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderBottom: '1px dashed var(--border-subtle)',
                }}
              >
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                  Bank Processing Fee
                </span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                  ₹0.00 (Zero Surcharge)
                </span>
              </div>

              {/* Running Balance After Transaction */}
              {r.runningBalance !== null && r.runningBalance !== undefined && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    backgroundColor: 'var(--surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                    Available Balance After Transaction
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {formatINR(r.runningBalance)}
                  </span>
                </div>
              )}

              {/* General Ledger Journal Reference */}
              {r.journalReference && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-1) var(--spacing-3)',
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <span>Ledger Audit Journal ID:</span>
                  <span style={{ fontFamily: 'var(--font-family-mono)' }}>
                    {r.journalReference}
                  </span>
                </div>
              )}
            </div>

            {/* Regulatory Footer & Disclaimer */}
            <div
              style={{
                marginTop: 'var(--spacing-5)',
                paddingTop: 'var(--spacing-4)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                }}
              >
                <ShieldCheck size={14} color="#10B981" />
                <span>
                  Reserve Bank of India Regulated • DICGC Insured Deposit Protection up to ₹5,00,000
                </span>
              </div>
              <p
                style={{
                  fontSize: '10px',
                  color: 'var(--text-tertiary)',
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                This is a computer-generated electronic payment advice issued under the Information
                Technology Act, 2000. It requires no physical signature. For queries, quote the UTR
                Reference Number to FINServ Customer Support (1800-200-FINSERV).
              </p>
            </div>
          </div>

          {/* Action Bar (Hidden in Print) */}
          <div
            className="print:hidden"
            style={{
              display: 'flex',
              gap: 'var(--spacing-3)',
              marginTop: 'var(--spacing-5)',
              paddingTop: 'var(--spacing-4)',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ flex: 1, gap: 'var(--spacing-2)' }}
            >
              <Printer size={16} />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
