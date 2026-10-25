/**
 * FINServ Interactive Luxury Transfer Studio
 * Hub for Beneficiary Transfers, Self Transfers, Instant Account Funding, and Cash Withdrawals.
 * Features live balance validation, quick chips, review confirmation modal, and success animations.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { accountService } from '@/features/accounts/accountService';
import { beneficiaryService } from '@/features/beneficiaries/beneficiaryService';
import { transferService } from './services/transferService';
import { TransferReviewModal, type TransferReviewData } from './components/TransferReviewModal';
import { TransferSuccessReceipt } from './components/TransferSuccessReceipt';
import { TransactionReceiptModal } from '@/features/transactions/components/TransactionReceiptModal';
import { Button } from '@/components/ui/Button';
import { formatINR, parseAmount } from '@/lib/money';
import { generateIdempotencyKey } from '@/lib/idempotency';
import type { BankAccount } from '@/types/account';
import type { Beneficiary } from '@/types/beneficiary';
import type { TransactionDto } from './types/transferTypes';
import './transfers.css';
import {
  ArrowLeftRight,
  Send,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Users,
  AlertCircle,
  PlusCircle,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import Decimal from 'decimal.js';

type TransferTab = 'BENEFICIARY' | 'SELF' | 'DEPOSIT' | 'WITHDRAW';

export const TransfersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Data state
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form state - parse tab from URL query if provided
  const tabParam = (searchParams.get('tab') || searchParams.get('mode') || '').toUpperCase();
  const initialTab: TransferTab =
    tabParam === 'DEPOSIT'
      ? 'DEPOSIT'
      : tabParam === 'WITHDRAW'
      ? 'WITHDRAW'
      : tabParam === 'SELF'
      ? 'SELF'
      : 'BENEFICIARY';

  const [activeTab, setActiveTab] = useState<TransferTab>(initialTab);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>('');
  const [destinationAccountNumber, setDestinationAccountNumber] = useState<string>('');
  const [transferMode, setTransferMode] = useState<'IMPS' | 'NEFT' | 'INTERNAL'>('IMPS');
  const [amountInput, setAmountInput] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Review & Confirmation Modal state
  const [reviewOpen, setReviewOpen] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState<TransferReviewData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Post-Execution Success State
  const [confirmedTransaction, setConfirmedTransaction] = useState<TransactionDto | null>(null);

  // Transaction Receipt Modal (for full receipt view/print)
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [receiptTxnId, setReceiptTxnId] = useState<string | null>(null);

  const loadData = useCallback(async (refresh = false, isActive: () => boolean = () => true) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [accs, bens] = await Promise.all([
        accountService.getMyAccounts(),
        beneficiaryService.getBeneficiaries(),
      ]);
      if (!isActive()) return;
      setAccounts(accs);
      setBeneficiaries(bens);

      // Account preselection from URL or default active
      const urlAccountId = searchParams.get('accountId');
      if (urlAccountId && accs.some((a) => a.id === urlAccountId)) {
        setSelectedAccountId(urlAccountId);
      } else if (accs.length > 0) {
        const active = accs.find((a) => a.status === 'ACTIVE') || accs[0];
        if (active) {
          setSelectedAccountId((current) =>
            accs.some((account) => account.id === current) ? current : active.id
          );
        }
      } else {
        setSelectedAccountId('');
      }

      const urlBenId = searchParams.get('beneficiaryId');
      if (urlBenId && bens.some((b) => b.id === urlBenId)) {
        setSelectedBeneficiaryId(urlBenId);
      } else {
        setSelectedBeneficiaryId((current) =>
          bens.some(
            (beneficiary) =>
              beneficiary.id === current &&
              beneficiary.isActive &&
              beneficiary.verificationStatus === 'VERIFIED'
          )
            ? current
            : ''
        );
      }
    } catch (err: unknown) {
      if (!isActive()) return;
      const appError = err as { userMessage?: string };
      setError(
        appError.userMessage ||
          (err instanceof Error ? err.message : 'Failed to load banking data. Please try again.')
      );
    } finally {
      if (isActive()) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(() => {
      if (!ignore) void loadData(false, () => !ignore);
    });
    return () => {
      ignore = true;
    };
  }, [loadData]);

  // Synchronize activeTab, account, and beneficiary if searchParams change dynamically
  useEffect(() => {
    const rawTab = (searchParams.get('tab') || searchParams.get('mode') || '').toUpperCase();
    if (rawTab === 'DEPOSIT' || rawTab === 'WITHDRAW' || rawTab === 'SELF' || rawTab === 'BENEFICIARY') {
      setActiveTab(rawTab as TransferTab);
    }
    const accParam = searchParams.get('accountId');
    if (accParam && accounts.some((a) => a.id === accParam)) {
      setSelectedAccountId(accParam);
    }
    const benParam = searchParams.get('beneficiaryId');
    if (benParam && beneficiaries.some((b) => b.id === benParam)) {
      setSelectedBeneficiaryId(benParam);
    }
  }, [searchParams, accounts, beneficiaries]);

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId);
  }, [accounts, selectedAccountId]);

  const verifiedBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) => b.verificationStatus === 'VERIFIED' && b.isActive);
  }, [beneficiaries]);

  const otherAccounts = useMemo(() => {
    return accounts.filter((a) => a.id !== selectedAccountId && a.status === 'ACTIVE');
  }, [accounts, selectedAccountId]);

  // Real-time balance evaluation
  const availableBalance = useMemo(() => {
    if (!selectedAccount) return new Decimal(0);
    try {
      return parseAmount(selectedAccount.availableBalance || 0);
    } catch {
      return new Decimal(0);
    }
  }, [selectedAccount]);

  const enteredAmount = useMemo(() => {
    if (!amountInput || isNaN(Number(amountInput))) return new Decimal(0);
    try {
      return parseAmount(amountInput);
    } catch {
      return new Decimal(0);
    }
  }, [amountInput]);

  const isInsufficientBalance = useMemo(() => {
    if (activeTab === 'DEPOSIT') return false; // Deposits fund the account
    return enteredAmount.gt(availableBalance);
  }, [activeTab, enteredAmount, availableBalance]);

  const hasInvalidAmountPrecision = enteredAmount.decimalPlaces() > 2;
  const isValidAmount = enteredAmount.gte(1) && !hasInvalidAmountPrecision && !isInsufficientBalance;

  // Handle Quick Amount Chips
  const handleQuickAmount = (increment: number) => {
    try {
      const current = enteredAmount.gt(0) ? enteredAmount : new Decimal(0);
      const next = current.add(increment);
      setAmountInput(next.toFixed(2));
    } catch {
      setAmountInput(increment.toFixed(2));
    }
  };

  const handleMaxAmount = () => {
    if (availableBalance.gt(0)) {
      setAmountInput(availableBalance.toFixed(2));
    }
  };

  // Prepare and open Review Modal
  const handleInitiateReview = () => {
    if (!selectedAccount) return;
    if (!isValidAmount) return;
    if (
      activeTab === 'SELF' &&
      (!/^\d{14}$/.test(destinationAccountNumber.trim()) ||
        destinationAccountNumber.trim() === selectedAccount.accountNumber)
    ) {
      setError('Enter a valid 14-digit destination account number that differs from the source account.');
      return;
    }
    setError(null);

    let toName = '';
    let toAccNum = '';
    let toBank = '';
    let toIfsc = '';

    if (activeTab === 'BENEFICIARY') {
      const ben = beneficiaries.find((b) => b.id === selectedBeneficiaryId);
      if (!ben) return;
      toName = ben.beneficiaryName;
      toAccNum = ben.accountNumber;
      toBank = ben.bankName;
      toIfsc = ben.ifscCode;
    } else if (activeTab === 'SELF') {
      const dest = accounts.find((a) => a.accountNumber === destinationAccountNumber);
      toName = dest?.nickname || 'Own FinServ Account';
      toAccNum = destinationAccountNumber;
      toBank = 'FINServ Main';
    }

    const reviewPayload: TransferReviewData = {
      type: activeTab,
      fromAccountNumber: selectedAccount.accountNumber,
      fromAccountNickname: selectedAccount.nickname,
      fromAccountBalance: selectedAccount.availableBalance,
      toName,
      toAccountNumber: toAccNum,
      toBankName: toBank,
      toIfsc,
      amount: enteredAmount.toFixed(2),
      mode: activeTab === 'DEPOSIT' ? 'Direct Deposit' : activeTab === 'WITHDRAW' ? 'Cash Withdrawal' : transferMode,
      description: description.trim(),
      idempotencyKey: generateIdempotencyKey(),
    };

    setReviewData(reviewPayload);
    setReviewOpen(true);
  };

  // Execute Confirmed Transaction
  const handleConfirmTransaction = async () => {
    if (!reviewData || !selectedAccount) return;
    setIsSubmitting(true);
    setError(null);

    try {
      let resultTxn: TransactionDto;

      if (reviewData.type === 'DEPOSIT') {
        resultTxn = await transferService.deposit(
          {
            accountId: selectedAccount.id,
            amount: reviewData.amount,
            description: reviewData.description,
          },
          reviewData.idempotencyKey
        );
      } else if (reviewData.type === 'WITHDRAW') {
        resultTxn = await transferService.withdraw(
          {
            accountId: selectedAccount.id,
            amount: reviewData.amount,
            description: reviewData.description,
          },
          reviewData.idempotencyKey
        );
      } else if (reviewData.type === 'BENEFICIARY') {
        resultTxn = await transferService.transfer(
          {
            fromAccountId: selectedAccount.id,
            transferType: 'BENEFICIARY',
            beneficiaryId: selectedBeneficiaryId,
            transferMode,
            amount: reviewData.amount,
            description: reviewData.description,
          },
          reviewData.idempotencyKey
        );
      } else {
        // SELF transfer
        resultTxn = await transferService.transfer(
          {
            fromAccountId: selectedAccount.id,
            transferType: 'DIRECT_ACCOUNT',
            destinationAccountNumber: destinationAccountNumber.trim(),
            transferMode: 'INTERNAL',
            amount: reviewData.amount,
            description: reviewData.description,
          },
          reviewData.idempotencyKey
        );
      }

      setReviewOpen(false);
      setConfirmedTransaction(resultTxn);
      // Refresh accounts silently to reflect newly updated balances
      loadData(true);
    } catch (err: unknown) {
      const appError = err as { userMessage?: string };
      setError(
        appError.userMessage ||
          (err instanceof Error ? err.message : 'Transaction could not be completed. Please retry.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Studio for another transaction
  const handleResetStudio = () => {
    setConfirmedTransaction(null);
    setAmountInput('');
    setDescription('');
    setSelectedBeneficiaryId('');
    setDestinationAccountNumber('');
    setError(null);
  };

  const handleReviewOpenChange = (open: boolean) => {
    setReviewOpen(open);
    if (!open && !isSubmitting) setError(null);
  };

  if (isLoading) {
    return (
      <div className="transfer-page transfer-page--loading" aria-busy="true">
        <div className="h-10 w-48 bg-surface-subtle animate-pulse rounded-xl" />
        <div className="h-64 bg-surface-subtle animate-pulse rounded-3xl" />
      </div>
    );
  }

  // Render Post-Execution Celebratory Success Receipt
  if (confirmedTransaction?.status === 'COMPLETED') {
    return (
      <div className="transfer-page transfer-page--receipt">
        <TransferSuccessReceipt
          transaction={confirmedTransaction}
          onReset={handleResetStudio}
          onViewPassbook={() => navigate('/app/transactions')}
          onPrintReceipt={(id) => {
            setReceiptTxnId(id);
            setReceiptModalOpen(true);
          }}
        />

        {receiptTxnId && (
          <TransactionReceiptModal
            open={receiptModalOpen}
            onOpenChange={setReceiptModalOpen}
            transactionId={receiptTxnId}
          />
        )}
      </div>
    );
  }

  if (confirmedTransaction) {
    const statusTitle =
      confirmedTransaction.status === 'PENDING'
        ? 'Transfer pending'
        : confirmedTransaction.status === 'FAILED'
          ? 'Transfer failed'
          : 'Transaction reversed';
    const statusMessage =
      confirmedTransaction.failureReason ||
      (confirmedTransaction.status === 'PENDING'
        ? 'FinServ has not confirmed completion yet. Check your transaction history for updates.'
        : 'The transaction was not completed. Review the status before trying again.');

    return (
      <div className="transfer-page p-6 md:p-10 max-w-4xl mx-auto">
        <section className="transfer-outcome-card" aria-live="polite">
          <AlertCircle size={28} aria-hidden="true" />
          <h1>{statusTitle}</h1>
          <p>{statusMessage}</p>
          <dl>
            <div>
              <dt>Amount</dt>
              <dd>{formatINR(confirmedTransaction.amount)}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd>{confirmedTransaction.transactionReference}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{confirmedTransaction.status}</dd>
            </div>
          </dl>
          <div className="transfer-outcome-actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/app/transactions')}>
              View transactions
            </Button>
            {confirmedTransaction.status !== 'PENDING' && (
              <Button type="button" onClick={handleResetStudio}>
                Start another transfer
              </Button>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (error && accounts.length === 0 && beneficiaries.length === 0) {
    return (
      <div className="transfer-page transfer-page--error">
        <div className="transfer-load-error" role="alert">
          <AlertCircle size={20} aria-hidden="true" />
          <div>
            <h1>Banking data could not be loaded</h1>
            <p>{error}</p>
            <Button type="button" onClick={() => void loadData(false)} isLoading={isLoading}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transfer-page">
      {/* Header Bar */}
      <div className="transfer-header">
        <div>
          <div className="transfer-eyebrow">
            <Sparkles size={14} />
            <span>Core Financial Movement Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight mt-1">
            Fund Transfers & Payments
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Move funds between your accounts or send money to verified payees.
          </p>
        </div>

        <div className="transfer-header-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Sync Balance</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate('/app/beneficiaries')}
            className="flex items-center gap-1.5"
          >
            <Users size={14} />
            <span>Manage Payees</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="transfer-alert" role="alert">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Studio Card */}
      <div className="transfer-studio">
        {/* Segmented Mode Selector Bar */}
        <div className="transfer-mode-selector" role="group" aria-label="Transaction type">
          <button
            type="button"
            aria-pressed={activeTab === 'BENEFICIARY'}
            onClick={() => {
              setActiveTab('BENEFICIARY');
              setAmountInput('');
            }}
            className={`transfer-mode-button ${
              activeTab === 'BENEFICIARY'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
          >
            <Send size={15} />
            <span>To Beneficiary</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'SELF'}
            onClick={() => {
              setActiveTab('SELF');
              setAmountInput('');
            }}
            className={`transfer-mode-button ${
              activeTab === 'SELF'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
          >
            <ArrowLeftRight size={15} />
            <span>Own Account / Direct</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'DEPOSIT'}
            onClick={() => {
              setActiveTab('DEPOSIT');
              setAmountInput('');
            }}
            className={`transfer-mode-button ${
              activeTab === 'DEPOSIT'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
          >
            <ArrowDownLeft size={15} />
            <span>Add Funds (Deposit)</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'WITHDRAW'}
            onClick={() => {
              setActiveTab('WITHDRAW');
              setAmountInput('');
            }}
            className={`transfer-mode-button ${
              activeTab === 'WITHDRAW'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
          >
            <ArrowUpRight size={15} />
            <span>Withdraw Cash</span>
          </button>
        </div>

        {/* Studio Form Body */}
        <div className="transfer-form-body">
          {/* 1. Source Account Selector */}
          <div className="transfer-section">
            <div className="transfer-form-heading">
              <label className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                {activeTab === 'DEPOSIT' ? 'Destination Account (Credit)' : 'Source Account (Debit)'}
              </label>
              {selectedAccount && (
                <span className="text-xs text-text-muted">
                  Available Balance:{' '}
                  <strong className="text-emerald-500 font-mono">
                    {formatINR(selectedAccount.availableBalance)}
                  </strong>
                </span>
              )}
            </div>

            {accounts.length === 0 ? (
              <div className="transfer-empty-state">
                <p className="text-sm text-text-muted">You do not have any active accounts to transact from.</p>
                <Button size="sm" onClick={() => navigate('/app/accounts')}>
                  Open an Account
                </Button>
              </div>
            ) : (
              <div className="transfer-account-grid">
                {accounts.map((acc) => {
                  const isSelected = acc.id === selectedAccountId;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`transfer-option ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                          : 'border-border/50 bg-surface-subtle hover:border-border hover:bg-surface-raised'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-surface text-text-muted border border-border/60'
                          }`}
                        >
                          <Wallet size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-text-primary">
                            {acc.nickname || 'FinServ Core Account'}
                          </div>
                          <div className="text-xs font-mono text-text-muted">
                            •••• {acc.accountNumber.slice(-4)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-text-muted">Available</div>
                        <div className="text-sm font-bold font-mono text-text-primary">
                          {formatINR(acc.availableBalance)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Destination / Recipient Selection */}
          {activeTab === 'BENEFICIARY' && (
            <div className="transfer-section transfer-section--divided">
              <div className="transfer-form-heading">
                <label className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                  Select Verified Payee
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/app/beneficiaries')}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <PlusCircle size={13} />
                  <span>Add New Payee</span>
                </button>
              </div>

              {verifiedBeneficiaries.length === 0 ? (
                <div className="transfer-empty-state">
                  <p className="text-sm text-text-muted">No verified payees found.</p>
                  <Button size="sm" onClick={() => navigate('/app/beneficiaries')}>
                    Add & Verify Payee
                  </Button>
                </div>
              ) : (
                <div className="transfer-beneficiary-grid">
                  {verifiedBeneficiaries.map((b) => {
                    const isSelected = b.id === selectedBeneficiaryId;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedBeneficiaryId(b.id)}
                        className={`transfer-option ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                            : 'border-border/50 bg-surface-subtle hover:border-border hover:bg-surface-raised'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center font-bold text-xs text-primary border border-border/40">
                            {b.beneficiaryName.slice(0, 2).toUpperCase()}
                          </div>
                          {isSelected && <CheckCircle2 size={16} className="text-primary" />}
                        </div>
                        <div className="font-semibold text-sm text-text-primary mt-2 truncate">
                          {b.beneficiaryName}
                        </div>
                        <div className="text-xs font-mono text-text-muted truncate">
                          •••• {b.accountNumber.slice(-4)} • {b.bankName}
                        </div>
                        {b.dailyTransferLimit && (
                          <div className="text-[11px] text-text-muted mt-1 font-mono">
                            Limit: {formatINR(b.dailyTransferLimit)}/day
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'SELF' && (
            <div className="transfer-section transfer-section--divided">
              <label className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                Destination FinServ Account
              </label>

              {otherAccounts.length > 0 ? (
                <div className="transfer-destination-grid">
                  {otherAccounts.map((acc) => {
                    const isSelected = acc.accountNumber === destinationAccountNumber;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setDestinationAccountNumber(acc.accountNumber)}
                        className={`transfer-option ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                            : 'border-border/50 bg-surface-subtle hover:border-border hover:bg-surface-raised'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center text-text-muted">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-text-primary">
                              {acc.nickname || 'Secondary Account'}
                            </div>
                            <div className="text-xs font-mono text-text-muted">
                              {acc.accountNumber}
                            </div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={16} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={destinationAccountNumber}
                    onChange={(e) => setDestinationAccountNumber(e.target.value)}
                    placeholder="Enter 14-digit FinServ Account Number"
                    maxLength={14}
                    inputMode="numeric"
                    aria-label="Destination FinServ account number"
                    className="transfer-text-input"
                  />
                  <p className="text-xs text-text-muted">
                    Enter the account number exactly as provided by the recipient.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. Transfer Mode (for Beneficiary transfers) */}
          {activeTab === 'BENEFICIARY' && (
            <div className="transfer-section">
              <label htmlFor="transfer-amount" className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                Payment Network / Rail
              </label>
              <div className="transfer-rail-options">
                <button
                  type="button"
                  aria-pressed={transferMode === 'IMPS'}
                  onClick={() => setTransferMode('IMPS')}
                  className={`transfer-rail-button ${
                    transferMode === 'IMPS'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border/60 bg-surface-subtle text-text-muted hover:border-border'
                  }`}
                >
                  IMPS
                </button>
                <button
                  type="button"
                  aria-pressed={transferMode === 'NEFT'}
                  onClick={() => setTransferMode('NEFT')}
                  className={`transfer-rail-button ${
                    transferMode === 'NEFT'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border/60 bg-surface-subtle text-text-muted hover:border-border'
                  }`}
                >
                  NEFT
                </button>
              </div>
            </div>
          )}

          {/* 4. Amount Input Studio & Quick Chips */}
          <div className="transfer-amount-section">
            <div className="transfer-form-heading">
              <label className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                {activeTab === 'DEPOSIT'
                  ? 'Deposit Amount (INR)'
                  : activeTab === 'WITHDRAW'
                    ? 'Withdrawal Amount (INR)'
                    : 'Transfer Amount (INR)'}
              </label>
              {activeTab !== 'DEPOSIT' && (
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="transfer-inline-action"
                >
                  Use Max Available
                </button>
              )}
            </div>

            {/* Large Tabular Amount Input */}
            <div className="transfer-amount-field">
              <div className="transfer-amount-currency" aria-hidden="true">
                ₹
              </div>
              <input
                id="transfer-amount"
                type="number"
                step="0.01"
                min="1.00"
                aria-invalid={isInsufficientBalance || hasInvalidAmountPrecision}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="transfer-amount-input"
              />
            </div>

            {/* Real-time Inline Balance Guard Warning */}
            {isInsufficientBalance && (
              <div className="transfer-field-warning" role="alert">
                <AlertCircle size={14} />
                <span>
                  Insufficient balance! Your available balance is {formatINR(availableBalance)}.
                </span>
              </div>
            )}
            {amountInput && enteredAmount.lt(1) && (
              <div className="transfer-field-warning" role="alert">
                <AlertCircle size={14} aria-hidden="true" />
                <span>The minimum transaction amount is ₹1.00.</span>
              </div>
            )}
            {amountInput && hasInvalidAmountPrecision && (
              <div className="transfer-field-warning" role="alert">
                <AlertCircle size={14} aria-hidden="true" />
                <span>Enter an amount with no more than two decimal places.</span>
              </div>
            )}

            {/* Quick Amount Chips */}
            <div className="transfer-quick-amounts">
              <span className="text-xs text-text-muted mr-1">Quick Add:</span>
              <button
                type="button"
                onClick={() => handleQuickAmount(500)}
                className="transfer-quick-amount"
              >
                +₹500
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(2000)}
                className="transfer-quick-amount"
              >
                +₹2,000
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(10000)}
                className="transfer-quick-amount"
              >
                +₹10,000
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(25000)}
                className="transfer-quick-amount"
              >
                +₹25,000
              </button>
            </div>
          </div>

          {/* 5. Remarks / Narration */}
          <div className="transfer-section transfer-remarks">
            <label className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              Remarks / Narration (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly rent, Client consultation, Account funding"
              maxLength={150}
              className="transfer-text-input"
            />
          </div>

          {/* 6. Execution CTA */}
          <div className="transfer-actions">
            <div className="text-xs text-text-muted">
              Review the details carefully before confirming your transfer.
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleInitiateReview}
              disabled={
                !isValidAmount ||
                (activeTab === 'BENEFICIARY' && !selectedBeneficiaryId) ||
                (activeTab === 'SELF' && !destinationAccountNumber)
              }
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold"
            >
              Review transfer
            </Button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <TransferReviewModal
        open={reviewOpen}
        onOpenChange={handleReviewOpenChange}
        data={reviewData}
        onConfirm={handleConfirmTransaction}
        isSubmitting={isSubmitting}
        error={error}
      />

      {/* Receipt Modal (if requested) */}
      {receiptTxnId && (
        <TransactionReceiptModal
          open={receiptModalOpen}
          onOpenChange={setReceiptModalOpen}
          transactionId={receiptTxnId}
        />
      )}
    </div>
  );
};
