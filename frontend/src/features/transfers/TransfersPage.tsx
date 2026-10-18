/**
 * FINServ Interactive Luxury Transfer Studio
 * Hub for Beneficiary Transfers, Self Transfers, Instant Account Funding, and Cash Withdrawals.
 * Features live balance validation, quick chips, review confirmation modal, and success animations.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Data state
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [activeTab, setActiveTab] = useState<TransferTab>('BENEFICIARY');
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

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [accs, bens] = await Promise.all([
        accountService.getMyAccounts(),
        beneficiaryService.getBeneficiaries().catch(() => [] as Beneficiary[]),
      ]);
      setAccounts(accs);
      setBeneficiaries(bens);

      // Default selected source account if not set
      if (!selectedAccountId && accs.length > 0) {
        const active = accs.find((a) => a.status === 'ACTIVE') || accs[0];
        if (active) setSelectedAccountId(active.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load banking data';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [accs, bens] = await Promise.all([
          accountService.getMyAccounts(),
          beneficiaryService.getBeneficiaries().catch(() => [] as Beneficiary[]),
        ]);
        if (!ignore) {
          setAccounts(accs);
          setBeneficiaries(bens);
          if (accs.length > 0) {
            const active = accs.find((a) => a.status === 'ACTIVE') || accs[0];
            if (active) setSelectedAccountId(active.id);
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to load banking data';
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void init();
    return () => {
      ignore = true;
    };
  }, []);

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

  const isValidAmount = enteredAmount.gt(0) && !isInsufficientBalance;

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
      const msg = err instanceof Error ? err.message : 'Transaction could not be completed';
      setError(msg);
      setReviewOpen(false);
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

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-surface-subtle animate-pulse rounded-xl" />
        <div className="h-64 bg-surface-subtle animate-pulse rounded-3xl" />
      </div>
    );
  }

  // Render Post-Execution Celebratory Success Receipt
  if (confirmedTransaction) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
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

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles size={14} />
            <span>Core Financial Movement Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight mt-1">
            Fund Transfers & Payments
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Real-time inter-bank clearing, instant internal routing, and account deposits.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-3 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Studio Card */}
      <div className="rounded-3xl bg-surface border border-border/60 shadow-xl overflow-hidden">
        {/* Segmented Mode Selector Bar */}
        <div className="p-2 border-b border-border/40 bg-surface-raised flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('BENEFICIARY');
              setAmountInput('');
            }}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
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
            onClick={() => {
              setActiveTab('SELF');
              setAmountInput('');
            }}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
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
            onClick={() => {
              setActiveTab('DEPOSIT');
              setAmountInput('');
            }}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
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
            onClick={() => {
              setActiveTab('WITHDRAW');
              setAmountInput('');
            }}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
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
        <div className="p-6 md:p-8 space-y-8">
          {/* 1. Source Account Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
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
              <div className="p-6 rounded-2xl bg-surface-subtle border border-dashed border-border text-center space-y-2">
                <p className="text-sm text-text-muted">You do not have any active accounts to transact from.</p>
                <Button size="sm" onClick={() => navigate('/app/accounts')}>
                  Open an Account
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {accounts.map((acc) => {
                  const isSelected = acc.id === selectedAccountId;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
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
            <div className="space-y-3 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between">
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
                <div className="p-6 rounded-2xl bg-surface-subtle border border-dashed border-border text-center space-y-2">
                  <p className="text-sm text-text-muted">No verified payees found.</p>
                  <Button size="sm" onClick={() => navigate('/app/beneficiaries')}>
                    Add & Verify Payee
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {verifiedBeneficiaries.map((b) => {
                    const isSelected = b.id === selectedBeneficiaryId;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBeneficiaryId(b.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
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
            <div className="space-y-3 pt-4 border-t border-border/40">
              <label className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                Destination FinServ Account
              </label>

              {otherAccounts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {otherAccounts.map((acc) => {
                    const isSelected = acc.accountNumber === destinationAccountNumber;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setDestinationAccountNumber(acc.accountNumber)}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
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
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-text-muted">
                    Transfer instantly to any other verified FinServ customer account.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. Transfer Mode (for Beneficiary transfers) */}
          {activeTab === 'BENEFICIARY' && (
            <div className="space-y-2 pt-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                Payment Network / Rail
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTransferMode('IMPS')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    transferMode === 'IMPS'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border/60 bg-surface-subtle text-text-muted hover:border-border'
                  }`}
                >
                  ⚡ IMPS — Real-Time 24x7 Settlement
                </button>
                <button
                  type="button"
                  onClick={() => setTransferMode('NEFT')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    transferMode === 'NEFT'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border/60 bg-surface-subtle text-text-muted hover:border-border'
                  }`}
                >
                  🏦 NEFT — National Clearing Batch
                </button>
              </div>
            </div>
          )}

          {/* 4. Amount Input Studio & Quick Chips */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between">
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
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Use Max Available
                </button>
              )}
            </div>

            {/* Large Tabular Amount Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-2xl font-bold text-text-muted">
                ₹
              </div>
              <input
                type="number"
                step="0.01"
                min="1.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-12 pr-6 py-4 rounded-2xl border text-3xl font-extrabold font-mono tracking-tight bg-surface focus:outline-none transition-all ${
                  isInsufficientBalance
                    ? 'border-rose-500 ring-2 ring-rose-500/20 text-rose-500'
                    : 'border-border focus:ring-2 focus:ring-primary/20 text-text-primary'
                }`}
              />
            </div>

            {/* Real-time Inline Balance Guard Warning */}
            {isInsufficientBalance && (
              <div className="flex items-center gap-2 text-xs font-medium text-rose-500 animate-shake">
                <AlertCircle size={14} />
                <span>
                  Insufficient balance! Your available balance is {formatINR(availableBalance)}.
                </span>
              </div>
            )}

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-text-muted mr-1">Quick Add:</span>
              <button
                type="button"
                onClick={() => handleQuickAmount(500)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-surface-subtle border border-border/60 hover:bg-surface-raised hover:border-border text-text-primary transition-colors"
              >
                +₹500
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(2000)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-surface-subtle border border-border/60 hover:bg-surface-raised hover:border-border text-text-primary transition-colors"
              >
                +₹2,000
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(10000)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-surface-subtle border border-border/60 hover:bg-surface-raised hover:border-border text-text-primary transition-colors"
              >
                +₹10,000
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(25000)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-surface-subtle border border-border/60 hover:bg-surface-raised hover:border-border text-text-primary transition-colors"
              >
                +₹25,000
              </button>
            </div>
          </div>

          {/* 5. Remarks / Narration */}
          <div className="space-y-2 pt-2">
            <label className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              Remarks / Narration (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly rent, Client consultation, Account funding"
              maxLength={150}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* 6. Execution CTA */}
          <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-text-muted">
              Zero transaction fees • Instant ledger confirmation
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
              Review & Authorize
            </Button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <TransferReviewModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        data={reviewData}
        onConfirm={handleConfirmTransaction}
        isSubmitting={isSubmitting}
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
