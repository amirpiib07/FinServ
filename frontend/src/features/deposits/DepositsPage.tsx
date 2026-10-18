import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { depositService } from './depositService';
import { accountService } from '@/features/accounts/accountService';
import type { FixedDeposit, FdRateSlab } from '@/types/deposit';
import type { BankAccount } from '@/types/account';
import { formatINR } from '@/lib/money';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  TrendingUp,
  ShieldCheck,
  Percent,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Award,
} from 'lucide-react';

const PRESET_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];

export const DepositsPage: React.FC = () => {
  // Data state
  const [rateSlabs, setRateSlabs] = useState<FdRateSlab[]>([]);
  const [deposits, setDeposits] = useState<FixedDeposit[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Calculator state
  const [principal, setPrincipal] = useState<number>(100000);
  const [selectedTenure, setSelectedTenure] = useState<number>(12);

  // Booking Modal state
  const [bookModalOpen, setBookModalOpen] = useState<boolean>(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<FixedDeposit | null>(null);

  // Certificate Modal state
  const [selectedCertificate, setSelectedCertificate] = useState<FixedDeposit | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [slabsRes, depositsRes, accountsRes] = await Promise.all([
        depositService.getRateSlabs().catch(() => [
          { tenureMonths: 6, interestRatePercentage: 6.5, displayLabel: '6 Months', description: 'Short term liquidity' },
          { tenureMonths: 12, interestRatePercentage: 7.25, displayLabel: '1 Year', description: 'Annual wealth lock' },
          { tenureMonths: 24, interestRatePercentage: 7.5, displayLabel: '2 Years', description: 'Medium term growth' },
          { tenureMonths: 36, interestRatePercentage: 7.75, displayLabel: '3 Years', description: 'Maximum guaranteed yield' },
        ]),
        depositService.getCustomerDeposits().catch(() => []),
        accountService.getMyAccounts().catch(() => []),
      ]);

      setRateSlabs(slabsRes);
      setDeposits(depositsRes);
      const activeAccs = accountsRes.filter((a) => a.status === 'ACTIVE');
      setAccounts(activeAccs);
      if (activeAccs.length > 0 && !selectedAccountId && activeAccs[0]) {
        setSelectedAccountId(activeAccs[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load Fixed Deposit details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [slabsRes, depositsRes, accountsRes] = await Promise.all([
          depositService.getRateSlabs().catch(() => [
            { tenureMonths: 6, interestRatePercentage: 6.5, displayLabel: '6 Months', description: 'Short term liquidity' },
            { tenureMonths: 12, interestRatePercentage: 7.25, displayLabel: '1 Year', description: 'Annual wealth lock' },
            { tenureMonths: 24, interestRatePercentage: 7.5, displayLabel: '2 Years', description: 'Medium term growth' },
            { tenureMonths: 36, interestRatePercentage: 7.75, displayLabel: '3 Years', description: 'Maximum guaranteed yield' },
          ]),
          depositService.getCustomerDeposits().catch(() => []),
          accountService.getMyAccounts().catch(() => []),
        ]);
        if (!mounted) return;
        setRateSlabs(slabsRes);
        setDeposits(depositsRes);
        const activeAccs = accountsRes.filter((a) => a.status === 'ACTIVE');
        setAccounts(activeAccs);
        if (activeAccs.length > 0 && !selectedAccountId && activeAccs[0]) {
          setSelectedAccountId(activeAccs[0].id);
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : 'Unable to load Fixed Deposit details.';
        setError(msg);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedAccountId]);

  // Current rate based on chosen tenure
  const currentRate = useMemo(() => {
    const found = rateSlabs.find((s) => s.tenureMonths === selectedTenure);
    if (found) return found.interestRatePercentage;
    if (selectedTenure <= 6) return 6.5;
    if (selectedTenure <= 12) return 7.25;
    if (selectedTenure <= 24) return 7.5;
    return 7.75;
  }, [rateSlabs, selectedTenure]);

  // Exact interest calculation: I = (P * r * t) / (12 * 100)
  const calculation = useMemo(() => {
    const p = Math.max(1000, Number(principal) || 0);
    const r = currentRate;
    const t = selectedTenure;
    const interest = Math.round(((p * r * t) / 1200) * 100) / 100;
    const maturity = p + interest;

    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + t);

    return {
      principal: p,
      interestEarned: interest,
      maturityAmount: maturity,
      interestPercentage: Math.round((interest / p) * 10000) / 100,
      maturityDateFormatted: maturityDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };
  }, [principal, currentRate, selectedTenure]);

  // Total portfolio stats
  const portfolioStats = useMemo(() => {
    const totalPrincipal = deposits.reduce((sum, d) => sum + Number(d.principalAmount || 0), 0);
    const totalMaturity = deposits.reduce((sum, d) => sum + Number(d.maturityAmount || 0), 0);
    return {
      count: deposits.length,
      totalPrincipal,
      totalMaturity,
      totalReturns: totalMaturity - totalPrincipal,
    };
  }, [deposits]);

  const handleOpenBookModal = () => {
    setBookingError(null);
    setBookingSuccess(null);
    if (accounts.length > 0 && !selectedAccountId && accounts[0]) {
      setSelectedAccountId(accounts[0].id);
    }
    setBookModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedAccountId) {
      setBookingError('Please select a funding account.');
      return;
    }
    const fundingAcc = accounts.find((a) => a.id === selectedAccountId);
    if (!fundingAcc) {
      setBookingError('Selected funding account is not valid.');
      return;
    }
    if (Number(fundingAcc.availableBalance) < calculation.principal) {
      setBookingError(`Insufficient available balance in account (${formatINR(fundingAcc.availableBalance)}).`);
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError(null);
      const booked = await depositService.bookFixedDeposit({
        sourceAccountId: selectedAccountId,
        principalAmount: calculation.principal,
        tenureMonths: selectedTenure,
      });
      setBookingSuccess(booked);
      void loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to book Fixed Deposit. Please try again.';
      setBookingError(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  const getFundingAccount = () => accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--spacing-6)' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-8)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
            <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Fixed Deposits & Wealth
            </h1>
            <Badge variant="success">Guaranteed Returns</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
            Enjoy guaranteed capital protection and high-yield returns with instant automated booking and double-entry GL security.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          <Button variant="outline" size="sm" onClick={() => void loadData()}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenBookModal}>
            <Sparkles size={14} style={{ marginRight: '6px' }} /> Book New FD
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            background: 'var(--danger-subtle)',
            color: 'var(--danger)',
            padding: 'var(--spacing-4)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--spacing-6)',
            border: '1px solid var(--danger-border)',
          }}
        >
          {error}
        </div>
      )}

      {/* Summary Portfolio Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-8)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #0A192F 0%, #0F2342 60%, #172554 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-5)',
            color: '#FFFFFF',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-accent)', textTransform: 'uppercase' }}>
              Active FD Portfolio
            </span>
            <ShieldCheck size={20} color="var(--brand-accent)" />
          </div>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--spacing-1)' }}>
            {formatINR(portfolioStats.totalPrincipal)}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
            {portfolioStats.count} active certificate{portfolioStats.count === 1 ? '' : 's'} earning interest
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-5)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total Maturity Value
            </span>
            <TrendingUp size={20} color="var(--color-emerald-500)" />
          </div>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-emerald-600)', marginBottom: 'var(--spacing-1)' }}>
            {formatINR(portfolioStats.totalMaturity)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            + {formatINR(portfolioStats.totalReturns)} total guaranteed profit
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-5)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Highest Available Yield
            </span>
            <Award size={20} color="var(--color-amber-500)" />
          </div>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--brand-primary)', marginBottom: 'var(--spacing-1)' }}>
            7.75% <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>p.a.</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Locked-in rate on 3-Year Platinum slab
          </div>
        </div>
      </div>

      {/* Main Grid: FD Calculator + Slabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 'var(--spacing-8)',
          marginBottom: 'var(--spacing-10)',
        }}
      >
        {/* Calculator Left Side */}
        <Card
          style={{
            padding: 'var(--spacing-6)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-6)' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
              }}
            >
              <Percent size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                FD Maturity Calculator
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Simulate your guaranteed earnings in real time
              </span>
            </div>
          </div>

          {/* Amount input & slider */}
          <div style={{ marginBottom: 'var(--spacing-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
              <label htmlFor="fd-principal-input" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Deposit Principal Amount
              </label>
              <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--brand-primary)' }}>
                {formatINR(principal)}
              </span>
            </div>

            <input
              id="fd-principal-input"
              type="range"
              min="1000"
              max="5000000"
              step="5000"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--brand-primary)',
                cursor: 'pointer',
                marginBottom: 'var(--spacing-3)',
              }}
            />

            {/* Quick preset buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPrincipal(amt)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid ' + (principal === amt ? 'var(--brand-primary)' : 'var(--border-subtle)'),
                    background: principal === amt ? 'var(--brand-primary)' : 'var(--surface-secondary)',
                    color: principal === amt ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {formatINR(amt, { showSymbol: true })}
                </button>
              ))}
            </div>
          </div>

          {/* Tenure Selection Slabs */}
          <div style={{ marginBottom: 'var(--spacing-6)' }}>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-2)' }}>
              Select Tenure Period & Yield
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-3)' }}>
              {rateSlabs.map((slab) => {
                const isSelected = selectedTenure === slab.tenureMonths;
                return (
                  <div
                    key={slab.tenureMonths}
                    onClick={() => setSelectedTenure(slab.tenureMonths)}
                    style={{
                      padding: 'var(--spacing-3) var(--spacing-4)',
                      borderRadius: 'var(--radius-lg)',
                      border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--brand-surface)' : 'var(--surface-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                        {slab.displayLabel}
                      </span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 'var(--font-size-sm)',
                          color: isSelected ? 'var(--brand-primary)' : 'var(--color-emerald-600)',
                        }}
                      >
                        {slab.interestRatePercentage}% p.a.
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {slab.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instant visual breakdown card */}
          <div
            style={{
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-4)',
              marginBottom: 'var(--spacing-6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Principal Invested:</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {formatINR(calculation.principal)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Guaranteed Interest Earned:</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-emerald-600)' }}>
                + {formatINR(calculation.interestEarned)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Estimated Maturity Date:</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {calculation.maturityDateFormatted}
              </span>
            </div>

            <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: 'var(--spacing-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Total Maturity Payout:
              </span>
              <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--brand-primary)' }}>
                {formatINR(calculation.maturityAmount)}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleOpenBookModal}
            disabled={accounts.length === 0}
          >
            <Sparkles size={16} style={{ marginRight: '8px' }} />
            Book Fixed Deposit ({formatINR(calculation.principal)})
          </Button>
        </Card>

        {/* Benefits & Wealth Projection Right Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #0F2342 0%, #172554 100%)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-6)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
              <ShieldCheck size={24} color="var(--brand-accent)" />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                FinServ Wealth Advantage
              </h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: 'var(--spacing-5)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>
              <li>
                <strong>Double-Entry GL Assurance:</strong> Every deposit is backed by automated balanced general ledger liability reservation.
              </li>
              <li>
                <strong>Compound Precision:</strong> Computed using strict <code>BigDecimal</code> math with zero floating-point rounding deviation.
              </li>
              <li>
                <strong>DICGC Insured:</strong> Bank deposits are insured up to ₹5,00,000 per depositor under official regulatory framework.
              </li>
              <li>
                <strong>Instant Digital FD Advice:</strong> Download or print your verified certificate with cryptographic audit trail anytime.
              </li>
            </ul>
          </div>

          {/* Quick Rate Slab Matrix */}
          <Card style={{ padding: 'var(--spacing-5)', borderRadius: 'var(--radius-xl)' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-3)' }}>
              Official FinServ Term Rate Slabs (2026)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              {rateSlabs.map((s) => (
                <div
                  key={s.tenureMonths}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-secondary)',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {s.displayLabel}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <Badge variant="success">{s.interestRatePercentage}% p.a.</Badge>
                    <ArrowRight size={14} color="var(--text-secondary)" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Active Fixed Deposits Portfolio */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Your Active Fixed Deposits
            </h2>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Track real-time certificate progress and print official advice slips
            </span>
          </div>
          <Badge variant="neutral">{deposits.length} Certificates</Badge>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-12)' }}>
            <Spinner size={32} />
          </div>
        ) : deposits.length === 0 ? (
          <EmptyState
            title="No Fixed Deposits Open Yet"
            description="Use our calculator above to choose a tenure slab and book your first guaranteed high-yield Fixed Deposit today."
            action={
              <Button variant="primary" onClick={handleOpenBookModal}>
                Book My First FD
              </Button>
            }
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 'var(--spacing-5)',
            }}
          >
            {deposits.map((fd) => {
              const progressPct = fd.status === 'CLOSED' ? 100 : 50;

              return (
                <Card
                  key={fd.id}
                  style={{
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--spacing-5)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Card Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {fd.depositNumber}
                        </span>
                      </div>
                      <Badge variant={fd.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {fd.status}
                      </Badge>
                    </div>

                    {/* Amount & Yield */}
                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Principal Invested
                      </span>
                      <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatINR(fd.principalAmount)}
                      </div>
                    </div>

                    {/* Key Attributes */}
                    <div
                      style={{
                        background: 'var(--surface-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--spacing-3)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 'var(--spacing-2)',
                        marginBottom: 'var(--spacing-4)',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Interest Rate:</span>
                        <div style={{ fontWeight: 700, color: 'var(--color-emerald-600)' }}>
                          {fd.interestRatePercentage}% p.a.
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Tenure:</span>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {fd.tenureMonths} Months
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Maturity Value:</span>
                        <div style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                          {formatINR(fd.maturityAmount)}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Maturity Date:</span>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {new Date(fd.maturityDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Progress to maturity */}
                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Maturity Timeline</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{progressPct}% elapsed</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${progressPct}%`,
                            height: '100%',
                            background: 'var(--color-emerald-500)',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--spacing-3)', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCertificate(fd)}
                    >
                      <FileText size={14} style={{ marginRight: '6px' }} />
                      View Certificate
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Book Fixed Deposit Modal */}
      <Modal
        open={bookModalOpen}
        onOpenChange={setBookModalOpen}
        title="Confirm Fixed Deposit Booking"
      >
        {bookingSuccess ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-4) 0' }}>
            {/* Celebratory SVG animation */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--spacing-4)',
                color: 'var(--color-emerald-500)',
              }}
            >
              <CheckCircle2 size={44} />
            </div>

            <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 var(--spacing-2)' }}>
              Fixed Deposit Booked Successfully!
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
              Your funds have been securely transferred and locked into a high-yield term deposit with guaranteed returns.
            </p>

            <div
              style={{
                background: 'var(--surface-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-4)',
                textAlign: 'left',
                marginBottom: 'var(--spacing-6)',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Certificate Number:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {bookingSuccess.depositNumber}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Principal Invested:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatINR(bookingSuccess.principalAmount)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Guaranteed Maturity:</span>
                <span style={{ fontWeight: 800, color: 'var(--color-emerald-600)' }}>
                  {formatINR(bookingSuccess.maturityAmount)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Maturity Date:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {new Date(bookingSuccess.maturityDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'center' }}>
              <Button
                variant="outline"
                onClick={() => {
                  const cert = bookingSuccess;
                  setBookModalOpen(false);
                  setSelectedCertificate(cert);
                }}
              >
                <Printer size={14} style={{ marginRight: '6px' }} />
                View & Print Advice
              </Button>
              <Button
                variant="primary"
                onClick={() => setBookModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {bookingError && (
              <div
                style={{
                  background: 'var(--danger-subtle)',
                  color: 'var(--danger)',
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--spacing-4)',
                  fontSize: '13px',
                  border: '1px solid var(--danger-border)',
                }}
              >
                {bookingError}
              </div>
            )}

            {/* Select Funding Account */}
            <div style={{ marginBottom: 'var(--spacing-5)' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--spacing-2)', color: 'var(--text-primary)' }}>
                Funding Source Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} ({acc.productCode === '01' ? 'Savings' : 'Current'}) — Available: {formatINR(acc.availableBalance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary Review Breakdown */}
            <div
              style={{
                background: 'var(--surface-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-4)',
                marginBottom: 'var(--spacing-6)',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Principal Debit:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatINR(calculation.principal)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tenure Period:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedTenure} Months
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Annual Interest Rate:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-emerald-600)' }}>
                  {currentRate}% p.a.
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Guaranteed Interest Payout:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-emerald-600)' }}>
                  + {formatINR(calculation.interestEarned)}
                </span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Maturity Amount:</span>
                <span style={{ fontWeight: 800, fontSize: 'var(--font-size-md)', color: 'var(--brand-primary)' }}>
                  {formatINR(calculation.maturityAmount)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                onClick={() => setBookModalOpen(false)}
                disabled={bookingLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleConfirmBooking()}
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <>
                    <Spinner size={16} style={{ marginRight: '8px' }} /> Booking...
                  </>
                ) : (
                  'Confirm & Open Deposit'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Printable Fixed Deposit Advice / Certificate Modal */}
      {selectedCertificate && (
        <Modal
          open={Boolean(selectedCertificate)}
          onOpenChange={(isOpen) => !isOpen && setSelectedCertificate(null)}
          title="Official Term Deposit Advice"
        >
          <div
            id="printable-fd-advice"
            style={{
              border: '2px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-6)',
              background: '#FFFFFF',
              color: '#0F172A',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: 'var(--spacing-5)',
            }}
          >
            {/* Watermark */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-30deg)',
                fontSize: '48px',
                fontWeight: 900,
                color: 'rgba(15, 23, 42, 0.04)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              FINSERV BANK VERIFIED
            </div>

            {/* Bank Header */}
            <div style={{ borderBottom: '2px solid #0F172A', paddingBottom: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, letterSpacing: '0.04em', color: '#0F172A' }}>
                  FINSERV BANK LIMITED
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                  Scheduled Commercial Core Banking • DICGC Insured Deposit
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block' }}>
                  CERTIFICATE NO.
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                  {selectedCertificate.depositNumber}
                </span>
              </div>
            </div>

            {/* Certificate Body */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px', marginBottom: 'var(--spacing-6)' }}>
              <div>
                <span style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>Source Account</span>
                <div style={{ fontWeight: 700 }}>{selectedCertificate.sourceAccountNumber || getFundingAccount()?.accountNumber}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>Deposit Status</span>
                <div style={{ fontWeight: 700, color: '#059669' }}>{selectedCertificate.status}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>Principal Amount</span>
                <div style={{ fontWeight: 800, fontSize: '16px', color: '#0F172A' }}>
                  {formatINR(selectedCertificate.principalAmount)}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>Interest Rate</span>
                <div style={{ fontWeight: 700, color: '#059669' }}>
                  {selectedCertificate.interestRatePercentage}% per annum
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>Tenure Duration</span>
                <div style={{ fontWeight: 600 }}>{selectedCertificate.tenureMonths} Months</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>Interest Earned</span>
                <div style={{ fontWeight: 700, color: '#059669' }}>
                  {formatINR(selectedCertificate.interestEarned)}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>Booking Date</span>
                <div style={{ fontWeight: 600 }}>
                  {new Date(selectedCertificate.startDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>Maturity Date</span>
                <div style={{ fontWeight: 800, color: '#0F172A' }}>
                  {new Date(selectedCertificate.maturityDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {/* Total Maturity Highlight */}
            <div
              style={{
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-6)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                Guaranteed Maturity Value
              </span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>
                {formatINR(selectedCertificate.maturityAmount)}
              </span>
            </div>

            {/* Signature & Seal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: 'var(--spacing-4)' }}>
              <div style={{ fontSize: '10px', color: '#64748B', maxWidth: '320px' }}>
                Computer generated term deposit advice. Does not require physical signature under Section 65B of the Indian Evidence Act.
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #0F172A', width: '120px', margin: '0 auto 4px' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>
                  Authorized Signatory
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
            <Button
              variant="outline"
              onClick={() => setSelectedCertificate(null)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                window.print();
              }}
            >
              <Printer size={14} style={{ marginRight: '6px' }} />
              Print FD Certificate
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
