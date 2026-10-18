/**
 * FINServ Passbook & Transaction Statements
 * - Live double-entry ledger activity with running balances
 * - KPI summary cards: Inflow (Credits), Outflow (Debits), Net Cashflow, Transaction Count
 * - Search by UTR, counterparty, or narration
 * - Filter by Account, Transaction Type (All, Credits, Debits), Date Range
 * - Detailed modal receipt view with native print / PDF export
 * - Executive luxury fintech aesthetics with Light and Obsidian Dark mode
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  RefreshCw,
  Printer,
  ChevronLeft,
  ChevronRight,
  Receipt,
  AlertCircle,
  PlusCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { formatINR } from '@/lib/money';
import { formatDateIST, formatTimeIST } from '@/lib/dates';
import { maskAccountNumber } from '@/lib/masking';
import { transferService } from '@/features/transfers/services/transferService';
import { accountService } from '@/features/accounts/accountService';
import type {
  TransactionDto,
  TransactionReceiptDto,
  TransactionSummaryDto,
  TransactionFilterParams,
} from '@/features/transfers/types/transferTypes';
import type { BankAccount } from '@/types/account';
import { TransactionReceiptModal } from './components/TransactionReceiptModal';

export const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Accounts state
  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  // Transactions state
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [summary, setSummary] = useState<TransactionSummaryDto>({
    totalCredits: '0.00',
    totalDebits: '0.00',
    netCashflow: '0.00',
    transactionCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const pageSize = 15;

  // Filter state
  const [selectedAccount, setSelectedAccount] = useState<string>(
    searchParams.get('accountId') || ''
  );
  const [filterType, setFilterType] = useState<string>(searchParams.get('type') || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('query') || '');
  const [startDate, setStartDate] = useState<string>(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState<string>(searchParams.get('endDate') || '');

  // Receipt Modal state
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionReceiptDto | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Fetch Accounts
  useEffect(() => {
    let mounted = true;
    async function loadAccounts() {
      try {
        const data = await accountService.getMyAccounts();
        if (mounted) setAccounts(data);
      } catch (err) {
        console.error('Failed to load accounts for filter:', err);
      }
    }
    loadAccounts();
    return () => {
      mounted = false;
    };
  }, []);

  // Standalone pagination & refresh fetcher
  const fetchTransactions = async (pageToLoad = 0) => {
    try {
      setLoading(true);
      setError(null);

      const params: TransactionFilterParams = {
        accountId: selectedAccount || undefined,
        type: filterType !== 'ALL' ? filterType : undefined,
        query: searchQuery.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: pageToLoad,
        size: pageSize,
      };

      const response = selectedAccount
        ? await transferService.getAccountTransactions(selectedAccount, params)
        : await transferService.getTransactions(params);

      setTransactions(response.items || []);
      if (response.summary) {
        setSummary(response.summary);
      }
      setCurrentPage(response.page || 0);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Unable to retrieve transaction statements. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const params: TransactionFilterParams = {
          accountId: selectedAccount || undefined,
          type: filterType !== 'ALL' ? filterType : undefined,
          query: searchQuery.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: 0,
          size: pageSize,
        };

        const response = selectedAccount
          ? await transferService.getAccountTransactions(selectedAccount, params)
          : await transferService.getTransactions(params);

        if (!ignore) {
          setTransactions(response.items || []);
          if (response.summary) {
            setSummary(response.summary);
          }
          setCurrentPage(response.page || 0);
          setTotalPages(response.totalPages || 1);
          setTotalElements(response.totalElements || 0);
        }
      } catch (err) {
        if (!ignore) {
          const errorMsg =
            err instanceof Error
              ? err.message
              : 'Unable to retrieve transaction statements. Please try again.';
          setError(errorMsg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadInitial();
    return () => {
      ignore = true;
    };
  }, [selectedAccount, filterType, searchQuery, startDate, endDate]);

  // Open Receipt Modal
  const handleViewReceipt = async (transaction: TransactionDto) => {
    try {
      const receiptData = await transferService.getTransactionReceipt(transaction.id);
      setSelectedReceipt(receiptData);
      setIsReceiptModalOpen(true);
    } catch {
      // Fallback: build receipt from transaction DTO
      setSelectedReceipt({
        id: transaction.id,
        transactionReference: transaction.transactionReference,
        status: transaction.status,
        transactionType: transaction.transactionType,
        transferMode: transaction.transferMode,
        amount: transaction.amount,
        feeAmount: transaction.feeAmount,
        currency: transaction.currency,
        fromAccountId: transaction.fromAccountId,
        fromAccountNumber: transaction.fromAccountNumber,
        toAccountId: transaction.toAccountId,
        toAccountNumber: transaction.toAccountNumber,
        counterpartyName: transaction.counterpartyName,
        runningBalance: transaction.runningBalance,
        description: transaction.description,
        channel: transaction.channel,
        createdAt: transaction.createdAt,
      } as TransactionReceiptDto);
      setIsReceiptModalOpen(true);
    }
  };

  const handleResetFilters = () => {
    setSelectedAccount('');
    setFilterType('ALL');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSearchParams({});
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams: Record<string, string> = {};
    if (selectedAccount) newParams.accountId = selectedAccount;
    if (filterType !== 'ALL') newParams.type = filterType;
    if (searchQuery) newParams.query = searchQuery;
    if (startDate) newParams.startDate = startDate;
    if (endDate) newParams.endDate = endDate;
    setSearchParams(newParams);
    fetchTransactions(0);
  };

  const netCashflowNum = typeof summary.netCashflow === 'string'
    ? parseFloat(summary.netCashflow)
    : Number(summary.netCashflow);
  const isNetPositive = netCashflowNum >= 0;

  return (
    <div className="transfers-container">
      {/* Top Header & Actions */}
      <div className="section-header print:hidden">
        <div>
          <h1 className="section-title">Passbook & Statements</h1>
          <p className="section-subtitle">
            Live double-entry ledger activity, cashflow analytics, and official transaction receipts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.print()}
            title="Print Current Statement View"
          >
            <Printer size={16} />
            <span>Print Passbook</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/app/transfers?tab=deposit')}
          >
            <PlusCircle size={16} />
            <span>Add Funds</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/app/transfers')}
          >
            <ArrowLeftRight size={16} />
            <span>Send Money</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-6)',
        }}
      >
        {/* Total Inflow (Credits) */}
        <div
          className="luxury-card"
          style={{
            padding: 'var(--spacing-4) var(--spacing-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-2)',
            borderLeft: '4px solid #10B981',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Money In (Credits)
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={18} />
            </div>
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-family-mono)',
              color: 'var(--color-success)',
              letterSpacing: '-0.02em',
            }}
          >
            +{formatINR(summary.totalCredits, { showSymbol: true })}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Total deposits & incoming transfers
          </span>
        </div>

        {/* Total Outflow (Debits) */}
        <div
          className="luxury-card"
          style={{
            padding: 'var(--spacing-4) var(--spacing-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-2)',
            borderLeft: '4px solid #F43F5E',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Money Out (Debits)
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                color: '#F43F5E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingDown size={18} />
            </div>
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-family-mono)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            -{formatINR(summary.totalDebits, { showSymbol: true })}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Total withdrawals & payments
          </span>
        </div>

        {/* Net Cashflow */}
        <div
          className="luxury-card"
          style={{
            padding: 'var(--spacing-4) var(--spacing-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-2)',
            borderLeft: isNetPositive ? '4px solid #10B981' : '4px solid #F59E0B',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Net Period Cashflow
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isNetPositive
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)',
                color: isNetPositive ? 'var(--color-success)' : 'var(--color-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeftRight size={18} />
            </div>
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-family-mono)',
              color: isNetPositive ? 'var(--color-success)' : 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            {isNetPositive ? '+' : ''}
            {formatINR(summary.netCashflow, { showSymbol: true })}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Net liquidity variance
          </span>
        </div>

        {/* Total Count */}
        <div
          className="luxury-card"
          style={{
            padding: 'var(--spacing-4) var(--spacing-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Total Records
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--brand-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt size={18} />
            </div>
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-family-mono)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            {totalElements}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Verified ledger postings
          </span>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div
        className="luxury-card print:hidden"
        style={{
          padding: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-6)',
        }}
      >
        <form
          onSubmit={handleApplyFilter}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
          }}
        >
          {/* Account Selector */}
          <div style={{ flex: '1 1 200px' }}>
            <label
              htmlFor="filter-account"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}
            >
              Account
            </label>
            <select
              id="filter-account"
              className="form-input"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              style={{ height: '38px', fontSize: '13px' }}
            >
              <option value="">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.productName || acc.productCode || 'FinServ Account'} •{' '}
                  {maskAccountNumber(acc.accountNumber)} ({formatINR(acc.availableBalance)})
                </option>
              ))}
            </select>
          </div>

          {/* Type Segmented Buttons */}
          <div style={{ flex: '0 0 auto' }}>
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}
            >
              Type
            </span>
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--surface-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '2px',
                border: '1px solid var(--border-subtle)',
                height: '38px',
              }}
            >
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Money In (+)', value: 'CREDIT' },
                { label: 'Money Out (-)', value: 'DEBIT' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilterType(opt.value)}
                  style={{
                    padding: '0 var(--spacing-3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: filterType === opt.value ? 600 : 500,
                    color:
                      filterType === opt.value
                        ? 'var(--text-primary)'
                        : 'var(--text-tertiary)',
                    backgroundColor:
                      filterType === opt.value ? 'var(--surface-card)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: filterType === opt.value ? 'var(--shadow-xs)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range: Start */}
          <div style={{ flex: '0 1 140px' }}>
            <label
              htmlFor="filter-start"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}
            >
              From Date
            </label>
            <input
              id="filter-start"
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ height: '38px', fontSize: '12px' }}
            />
          </div>

          {/* Date Range: End */}
          <div style={{ flex: '0 1 140px' }}>
            <label
              htmlFor="filter-end"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}
            >
              To Date
            </label>
            <input
              id="filter-end"
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ height: '38px', fontSize: '12px' }}
            />
          </div>

          {/* Search Query */}
          <div style={{ flex: '2 1 200px' }}>
            <label
              htmlFor="filter-search"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}
            >
              Search Narration / UTR
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                color="var(--text-tertiary)"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                id="filter-search"
                type="text"
                className="form-input"
                placeholder="Search by UTR, counterparty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ height: '38px', paddingLeft: '32px', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'auto' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ height: '38px', padding: '0 var(--spacing-4)', fontSize: '13px' }}
            >
              Filter
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
              style={{ height: '38px', padding: '0 var(--spacing-3)', fontSize: '13px' }}
              title="Reset all filters"
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={() => fetchTransactions(currentPage)}
              style={{ height: '38px', width: '38px' }}
              title="Refresh ledger"
              aria-label="Refresh ledger"
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="luxury-card"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
            color: 'var(--color-danger)',
          }}
        >
          <AlertCircle size={20} />
          <span style={{ fontSize: 'var(--font-size-sm)' }}>{error}</span>
        </div>
      )}

      {/* Passbook Statements Table */}
      <div className="luxury-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--surface-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <th
                  style={{
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    width: '50px',
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Date & Time
                </th>
                <th
                  style={{
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Narration & Counterparty
                </th>
                <th
                  style={{
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Mode
                </th>
                <th
                  style={{
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'right',
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'right',
                  }}
                >
                  Balance After
                </th>
                <th
                  style={{
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    width: '90px',
                  }}
                  className="print:hidden"
                >
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && transactions.length === 0 ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr
                    key={`skeleton-${i}`}
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      <div
                        className="skeleton"
                        style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                      />
                    </td>
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      <div
                        className="skeleton"
                        style={{ width: '90px', height: '14px', marginBottom: '4px' }}
                      />
                      <div className="skeleton" style={{ width: '60px', height: '10px' }} />
                    </td>
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      <div
                        className="skeleton"
                        style={{ width: '160px', height: '14px', marginBottom: '4px' }}
                      />
                      <div className="skeleton" style={{ width: '100px', height: '10px' }} />
                    </td>
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      <div
                        className="skeleton"
                        style={{ width: '60px', height: '20px', borderRadius: '12px' }}
                      />
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'right' }}>
                      <div
                        className="skeleton"
                        style={{ width: '80px', height: '16px', marginLeft: 'auto' }}
                      />
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'right' }}>
                      <div
                        className="skeleton"
                        style={{ width: '80px', height: '16px', marginLeft: 'auto' }}
                      />
                    </td>
                    <td style={{ padding: 'var(--spacing-4)' }} className="print:hidden">
                      <div
                        className="skeleton"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-md)',
                          margin: '0 auto',
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={7} style={{ padding: 'var(--spacing-12) var(--spacing-4)', textAlign: 'center' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--surface-subtle)',
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-4) auto',
                      }}
                    >
                      <Receipt size={28} />
                    </div>
                    <h3
                      style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--spacing-1)',
                      }}
                    >
                      No Transactions Found
                    </h3>
                    <p
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)',
                        maxWidth: '380px',
                        margin: '0 auto var(--spacing-5) auto',
                      }}
                    >
                      There are no ledger entries matching your current filters. Make a deposit or
                      transfer to view your passbook activity.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="btn btn-secondary"
                      >
                        Reset Filters
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/app/transfers?tab=deposit')}
                        className="btn btn-primary"
                      >
                        Deposit Funds
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isWithdrawal = tx.transactionType === 'WITHDRAWAL';
                  const isCredit = tx.direction === 'CREDIT';

                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="table-row-hover"
                    >
                      {/* Icon */}
                      <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: isCredit
                              ? 'rgba(16, 185, 129, 0.12)'
                              : isWithdrawal
                                ? 'rgba(244, 63, 94, 0.12)'
                                : 'rgba(59, 130, 246, 0.12)',
                            color: isCredit
                              ? 'var(--color-success)'
                              : isWithdrawal
                                ? 'var(--color-danger)'
                                : 'var(--brand-accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isCredit ? (
                            <ArrowDownLeft size={17} />
                          ) : isWithdrawal ? (
                            <ArrowUpRight size={17} />
                          ) : (
                            <ArrowLeftRight size={17} />
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', whiteSpace: 'nowrap' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                          }}
                        >
                          {formatDateIST(tx.createdAt, 'medium')}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            fontFamily: 'var(--font-family-mono)',
                          }}
                        >
                          {formatTimeIST(tx.createdAt)} IST
                        </div>
                      </td>

                      {/* Narration & Counterparty */}
                      <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            marginBottom: '2px',
                          }}
                        >
                          {tx.counterpartyName || tx.description || 'Electronic Payment'}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-2)',
                          }}
                        >
                          <span style={{ fontFamily: 'var(--font-family-mono)' }}>
                            UTR: {tx.transactionReference}
                          </span>
                          {tx.fromAccountNumber && tx.toAccountNumber && (
                            <span>
                              •{' '}
                              {isCredit
                                ? `From: ${maskAccountNumber(tx.fromAccountNumber)}`
                                : `To: ${maskAccountNumber(tx.toAccountNumber)}`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Mode Badge */}
                      <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            backgroundColor: 'var(--surface-subtle)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {tx.transferMode || tx.transactionType}
                        </span>
                      </td>

                      {/* Amount */}
                      <td
                        style={{
                          padding: 'var(--spacing-3) var(--spacing-4)',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-family-mono)',
                            fontWeight: 700,
                            fontSize: '14px',
                            color: isCredit ? 'var(--color-success)' : 'var(--text-primary)',
                          }}
                        >
                          {isCredit ? '+' : '-'}
                          {formatINR(tx.amount, { showSymbol: true })}
                        </div>
                      </td>

                      {/* Running Balance */}
                      <td
                        style={{
                          padding: 'var(--spacing-3) var(--spacing-4)',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-family-mono)',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                          }}
                        >
                          {tx.runningBalance !== null && tx.runningBalance !== undefined
                            ? formatINR(tx.runningBalance)
                            : '—'}
                        </div>
                      </td>

                      {/* Action: Receipt */}
                      <td
                        style={{
                          padding: 'var(--spacing-3) var(--spacing-4)',
                          textAlign: 'center',
                        }}
                        className="print:hidden"
                      >
                        <button
                          type="button"
                          className="btn-icon btn-ghost"
                          onClick={() => handleViewReceipt(tx)}
                          title="View Official Receipt"
                          aria-label={`View receipt for transaction ${tx.transactionReference}`}
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Receipt size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div
            className="print:hidden"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-3) var(--spacing-4)',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--surface-subtle)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Showing {transactions.length} of {totalElements} transactions
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                disabled={currentPage === 0 || loading}
                onClick={() => fetchTransactions(currentPage - 1)}
                aria-label="Previous Page"
                style={{ width: '32px', height: '32px', padding: 0 }}
              >
                <ChevronLeft size={16} />
              </button>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  padding: '0 var(--spacing-2)',
                }}
              >
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                disabled={currentPage >= totalPages - 1 || loading}
                onClick={() => fetchTransactions(currentPage + 1)}
                aria-label="Next Page"
                style={{ width: '32px', height: '32px', padding: 0 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
};
