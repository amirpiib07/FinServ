/**
 * FINServ Customer Executive Home Dashboard (`/app/dashboard`)
 * - Net Worth & Cashflow Hero Banner with 30-day Money In vs Money Out
 * - 3D Metallic Card Preview with reveal toggle & copyable account/IFSC details
 * - Quick Transfer Beneficiary Avatar Strip
 * - Recent Activity Feed (latest 5 transactions + Receipt Drawer)
 * - Complete Light & Dark theme support, zero developer jargon
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  PlusCircle,
  FileDown,
  Eye,
  EyeOff,
  Copy,
  Check,
  Wifi,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { dashboardService } from './dashboardService';
import type { CustomerDashboardOverview } from '@/types/dashboard';
import { formatINR } from '@/lib/money';
import { formatDateTimeIST } from '@/lib/dates';
import { maskAccountNumber } from '@/lib/masking';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { TransactionReceiptModal } from '@/features/transactions/components/TransactionReceiptModal';

export const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<CustomerDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Balance visibility toggle
  const [showBalance, setShowBalance] = useState(true);
  const [copiedField, setCopiedField] = useState<'account' | 'ifsc' | null>(null);

  // Transaction Receipt Modal
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    dashboardService
      .getCustomerDashboard()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.userMessage || err?.message || 'Failed to load executive dashboard overview.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = (text: string, field: 'account' | 'ifsc') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Skeleton width="220px" height="32px" />
            <Skeleton width="340px" height="18px" style={{ marginTop: '8px' }} />
          </div>
          <Skeleton width="140px" height="40px" />
        </div>
        <Skeleton width="100%" height="240px" style={{ borderRadius: 'var(--radius-xl)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-6)' }}>
          <Skeleton width="100%" height="220px" style={{ borderRadius: 'var(--radius-lg)' }} />
          <Skeleton width="100%" height="220px" style={{ borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
        <Card style={{ maxWidth: '520px', margin: '0 auto', padding: 'var(--spacing-8)' }}>
          <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--spacing-4)' }}>
            <AlertTriangle size={48} style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--spacing-2)' }}>
            Dashboard Overview Unavailable
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-6)' }}>
            {error || 'Unable to load real-time account balances. Please check your network connection.'}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  const primary = data.primaryAccount;
  const moneyIn = data.monthlyCredits || 0;
  const moneyOut = data.monthlyDebits || 0;
  const totalFlow = moneyIn + moneyOut;
  const inPercent = totalFlow > 0 ? Math.round((moneyIn / totalFlow) * 100) : 50;
  const outPercent = totalFlow > 0 ? 100 - inPercent : 50;

  return (
    <div className="page-transition-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', paddingBottom: 'var(--spacing-10)' }}>
      {/* 1. Header & Welcome Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Executive Banking Portfolio
            </h1>
            <Badge variant="success">
              <ShieldCheck size={12} style={{ marginRight: '4px' }} />
              RBI Verified
            </Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Real-time relationship net worth, multi-account ledger balances, and cashflow intelligence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/statements')}
            leftIcon={<FileDown size={15} />}
          >
            e-Statement
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/app/transfers')}
            leftIcon={<ArrowUpRight size={15} />}
          >
            Transfer Funds
          </Button>
        </div>
      </div>

      {/* Pending KYC / Account Alerts */}
      {data.pendingAlerts && data.pendingAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          {data.pendingAlerts.map((alert, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-3) var(--spacing-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor:
                  alert.severity === 'ALERT'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : alert.severity === 'WARNING'
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(59, 130, 246, 0.12)',
                border: `1px solid ${
                  alert.severity === 'ALERT'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : alert.severity === 'WARNING'
                    ? 'rgba(245, 158, 11, 0.3)'
                    : 'rgba(59, 130, 246, 0.3)'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                {alert.severity === 'ALERT' ? (
                  <AlertTriangle size={18} color="var(--color-danger)" />
                ) : (
                  <Info size={18} color="var(--color-primary)" />
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    {alert.message}
                  </div>
                </div>
              </div>
              {alert.actionUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(alert.actionUrl!)}
                >
                  Review
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 2. Hero Wealth & Cashflow Banner */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-2xl)',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 50%, #000000 100%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          color: '#FFFFFF',
          padding: 'var(--spacing-8)',
        }}
      >
        {/* Ambient background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-8)' }}>
          {/* Left Column: Net Worth & Balance Reveal */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#D4AF37', textTransform: 'uppercase' }}>
                TOTAL RELATIONSHIP NET WORTH
              </div>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                aria-label={showBalance ? 'Hide portfolio balance' : 'Reveal portfolio balance'}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 500,
                  transition: 'background 0.2s',
                }}
              >
                {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showBalance ? 'Hide' : 'Reveal'}</span>
              </button>
            </div>

            <div
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '2.5rem',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: '#FFFFFF',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)',
              }}
            >
              {showBalance ? formatINR(data.totalNetWorth) : '₹ ••••••••'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.7)' }}>
                Active Accounts: <strong style={{ color: '#FFFFFF' }}>{data.activeAccountsCount}</strong>
              </div>
              <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.7)' }}>
                Verified Payees: <strong style={{ color: '#FFFFFF' }}>{data.verifiedBeneficiariesCount}</strong>
              </div>
            </div>

            {/* Quick Action Launchers Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--spacing-2)',
                marginTop: 'var(--spacing-6)',
              }}
            >
              <button
                type="button"
                onClick={() => navigate('/app/transfers')}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'background 0.2s',
                }}
              >
                <ArrowUpRight size={14} color="#34D399" />
                Send Money
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/transfers?mode=deposit')}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'background 0.2s',
                }}
              >
                <ArrowDownLeft size={14} color="#60A5FA" />
                Add Funds
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/beneficiaries')}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'background 0.2s',
                }}
              >
                <Users size={14} color="#FBBF24" />
                Add Beneficiary
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/accounts')}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'background 0.2s',
                }}
              >
                <PlusCircle size={14} color="#A78BFA" />
                Open Account
              </button>
            </div>
          </div>

          {/* Right Column: 30-day Cashflow Ratio & Bar */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase' }}>
                  30-DAY CASHFLOW INTEL
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: data.netCashflow30d >= 0 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                    color: data.netCashflow30d >= 0 ? '#34D399' : '#F87171',
                  }}
                >
                  Net: {data.netCashflow30d >= 0 ? '+' : ''}{formatINR(data.netCashflow30d)}
                </span>
              </div>

              {/* Visual Split Bar */}
              <div style={{ height: '10px', width: '100%', borderRadius: '5px', backgroundColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden', display: 'flex' }}>
                <div
                  style={{
                    width: `${inPercent}%`,
                    backgroundColor: '#10B981',
                    transition: 'width 0.4s ease',
                  }}
                  title={`Money In: ${inPercent}%`}
                />
                <div
                  style={{
                    width: `${outPercent}%`,
                    backgroundColor: '#EF4444',
                    transition: 'width 0.4s ease',
                  }}
                  title={`Money Out: ${outPercent}%`}
                />
              </div>

              {/* Numbers Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    Money In (Credits)
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.15rem', fontWeight: 700, color: '#34D399', marginTop: '4px' }}>
                    +{formatINR(moneyIn)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                    Money Out (Debits)
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.15rem', fontWeight: 700, color: '#F87171', marginTop: '4px' }}>
                    -{formatINR(moneyOut)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', marginTop: 'var(--spacing-4)' }}>
              Includes verified internal transfers, NEFT/RTGS, and direct cash settlements.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Account Metallic 3D Showcase & Quick Payees Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--spacing-6)' }}>
        {/* Left: 3D Metallic Account Card */}
        <Card style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Primary Banking Account
                </h2>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                  {primary?.productName || 'Savings Account'} • {primary?.branchName || 'FinServ Mumbai'}
                </div>
              </div>
              <Badge variant={primary?.status === 'ACTIVE' ? 'success' : 'warning'}>
                {primary?.status || 'ACTIVE'}
              </Badge>
            </div>

            {/* Stylized Metallic Card Graphic */}
            <div
              style={{
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.35)',
                padding: 'var(--spacing-5)',
                color: '#FFFFFF',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="emv-chip">
                    <div className="emv-chip-line-horizontal" />
                    <div className="emv-chip-line-vertical" />
                    <div className="emv-chip-center" />
                  </div>
                  <Wifi size={14} color="rgba(255, 255, 255, 0.7)" style={{ transform: 'rotate(90deg)' }} />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#F59E0B' }}>
                  FINSERV PRIVILEGE
                </div>
              </div>

              {/* Account Number display */}
              <div style={{ marginBottom: 'var(--spacing-3)' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.55)' }}>
                  Account Number
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '1.25rem',
                    letterSpacing: '0.12em',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {primary ? primary.accountNumber : 'No Active Account'}
                  {primary && (
                    <button
                      type="button"
                      onClick={() => handleCopy(primary.accountNumber, 'account')}
                      title="Copy Account Number"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedField === 'account' ? '#34D399' : 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      {copiedField === 'account' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.55)' }}>
                    IFSC Code
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '11px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {primary?.ifscCode || 'FINS0000101'}
                    <button
                      type="button"
                      onClick={() => handleCopy(primary?.ifscCode || 'FINS0000101', 'ifsc')}
                      title="Copy IFSC Code"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedField === 'ifsc' ? '#34D399' : 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      {copiedField === 'ifsc' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.55)' }}>
                    Available Balance
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.15rem', fontWeight: 700, color: '#34D399' }}>
                    {primary ? (showBalance ? formatINR(primary.availableBalance) : '₹ ••••••') : '₹0.00'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'var(--spacing-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Need to view all multi-currency accounts?
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/accounts')}
            >
              Account Directory
            </Button>
          </div>
        </Card>

        {/* Right: Quick Payees & Beneficiary Strip */}
        <Card style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Quick Transfer Payees
                </h2>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                  Instant zero-friction fund transfers to verified payees
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/beneficiaries')}
                leftIcon={<PlusCircle size={14} />}
              >
                Add New
              </Button>
            </div>

            {data.topBeneficiaries && data.topBeneficiaries.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                {data.topBeneficiaries.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/app/transfers?beneficiaryId=${b.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--spacing-3) var(--spacing-4)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--surface-sunken)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.borderColor = 'var(--brand-accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--brand-accent) 0%, #1D4ED8 100%)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 'var(--font-size-sm)',
                        }}
                      >
                        {b.beneficiaryName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                          {b.beneficiaryName}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                          {b.bankName} • {maskAccountNumber(b.accountNumber)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                      <Badge variant="neutral">
                        {b.transferType}
                      </Badge>
                      <ChevronRight size={16} color="var(--text-tertiary)" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: 'var(--spacing-8)',
                  textAlign: 'center',
                  backgroundColor: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-subtle)',
                }}
              >
                <Users size={32} color="var(--text-tertiary)" style={{ margin: '0 auto var(--spacing-2)' }} />
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                  No Beneficiaries Added Yet
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 'var(--spacing-4)' }}>
                  Add verified payees to initiate instant NEFT, RTGS, or intra-bank transfers.
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/app/beneficiaries')}
                >
                  Add Your First Payee
                </Button>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'var(--spacing-4)', textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => navigate('/app/transfers')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-accent)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Open Transfer Terminal <ChevronRight size={14} />
            </button>
          </div>
        </Card>
      </div>

      {/* 4. Recent Activity Feed */}
      <Card style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Recent Account Activity
            </h2>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              Latest ledger postings and electronic transactions
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/transactions')}
          >
            View Complete Passbook
          </Button>
        </div>

        {data.recentTransactions && data.recentTransactions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            {data.recentTransactions.map((tx) => {
              const isCredit = tx.transactionType === 'DEPOSIT';
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTxnId(tx.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--surface-sunken)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-card)';
                    e.currentTarget.style.borderColor = 'var(--border-interactive)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-sunken)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isCredit
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)',
                        color: isCredit ? 'var(--color-success)' : 'var(--color-danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                        {tx.narrative || tx.transactionType.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span>{formatDateTimeIST(tx.initiatedAt)}</span>
                        <span>•</span>
                        <span style={{ fontFamily: 'var(--font-family-mono)' }}>{tx.transactionReference}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 700,
                        color: isCredit ? 'var(--color-success)' : 'var(--color-danger)',
                      }}
                    >
                      {isCredit ? '+' : '-'}{formatINR(tx.amount)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      Bal: {formatINR(tx.balanceAfter)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No recent transactions posted yet.
          </div>
        )}
      </Card>

      {/* 5. Transaction Receipt Modal click-through */}
      <TransactionReceiptModal
        open={Boolean(selectedTxnId)}
        transactionId={selectedTxnId}
        onOpenChange={(open) => !open && setSelectedTxnId(null)}
      />
    </div>
  );
};
