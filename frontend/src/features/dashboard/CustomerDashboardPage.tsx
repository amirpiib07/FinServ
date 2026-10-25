/**
 * FINServ Customer Executive Home Dashboard (`/app/dashboard`)
 * - Net Worth & Cashflow Hero Banner with 30-day Money In vs Money Out
 * - 3D Metallic Card Preview with reveal toggle & copyable account/IFSC details
 * - Quick Transfer Beneficiary Avatar Strip
 * - Recent Activity Feed (latest 5 transactions + Receipt Drawer)
 * - Complete Light & Dark theme support, zero developer jargon
 */

import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';
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
import { getAsiaKolkataGreeting, getUserDisplayName } from '@/lib/user-identity';

export const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const displayName = getUserDisplayName(authContext?.user);
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
            {error || 'Unable to load account balances. Please check your network connection.'}
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
      <div className="stagger-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <div className="dashboard-eyebrow">Your FINServ portfolio</div>
          <h1 className="dashboard-greeting">
            {getAsiaKolkataGreeting()}, {displayName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Your account balances and recent activity, thoughtfully organized.
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
        <div className="dashboard-stagger-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
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
                    ? 'var(--color-danger-subtle)'
                    : alert.severity === 'WARNING'
                    ? 'var(--color-warning-subtle)'
                    : 'var(--color-info-subtle)',
                border: `1px solid ${
                  alert.severity === 'ALERT'
                    ? 'var(--color-danger-border)'
                    : alert.severity === 'WARNING'
                    ? 'var(--color-warning-border)'
                    : 'var(--color-info-border)'
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
        className="dashboard-wealth-card stagger-2"
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-2xl)',
          overflow: 'hidden',
          background: 'var(--card-gradient-savings)',
          border: '1px solid color-mix(in srgb, var(--neutral-0) 15%, transparent)',
          boxShadow: 'var(--shadow-xl)',
          color: 'var(--neutral-0)',
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
            background: 'radial-gradient(circle, color-mix(in srgb, var(--gold-400) 22%, transparent) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 'var(--spacing-8)' }}>
          {/* Left Column: Net Worth & Balance Reveal */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--brand-gold)', textTransform: 'uppercase' }}>
                TOTAL RELATIONSHIP NET WORTH
              </div>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                aria-label={showBalance ? 'Hide portfolio balance' : 'Reveal portfolio balance'}
                title={showBalance ? 'Hide portfolio balance' : 'Reveal portfolio balance'}
                style={{
                  background: 'color-mix(in srgb, var(--neutral-0) 12%, transparent)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--neutral-0)',
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
                color: 'var(--neutral-0)',
              }}
            >
              {showBalance ? formatINR(data.totalNetWorth) : '₹ ••••••••'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'color-mix(in srgb, var(--neutral-0) 70%, transparent)' }}>
                Active Accounts: <strong style={{ color: 'var(--neutral-0)' }}>{data.activeAccountsCount}</strong>
              </div>
              <div style={{ width: '1px', height: '14px', backgroundColor: 'color-mix(in srgb, var(--neutral-0) 20%, transparent)' }} />
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'color-mix(in srgb, var(--neutral-0) 70%, transparent)' }}>
                Verified Payees: <strong style={{ color: 'var(--neutral-0)' }}>{data.verifiedBeneficiariesCount}</strong>
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
                  background: 'color-mix(in srgb, var(--neutral-0) 15%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--neutral-0) 25%, transparent)',
                  color: 'var(--neutral-0)',
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
                <ArrowUpRight size={14} color="var(--teal-300)" />
                Send Money
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/transfers?mode=deposit')}
                style={{
                  background: 'color-mix(in srgb, var(--neutral-0) 15%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--neutral-0) 25%, transparent)',
                  color: 'var(--neutral-0)',
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
                <ArrowDownLeft size={14} color="var(--color-info)" />
                Add Funds (Deposit)
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/transfers?mode=withdraw')}
                style={{
                  background: 'color-mix(in srgb, var(--neutral-0) 15%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--neutral-0) 25%, transparent)',
                  color: 'var(--neutral-0)',
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
                <ArrowUpRight size={14} color="#FBBF24" />
                Withdraw Cash
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/beneficiaries')}
                style={{
                  background: 'color-mix(in srgb, var(--neutral-0) 15%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--neutral-0) 25%, transparent)',
                  color: 'var(--neutral-0)',
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
                <Users size={14} color="var(--brand-gold)" />
                Add Beneficiary
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/accounts')}
                style={{
                  background: 'color-mix(in srgb, var(--neutral-0) 15%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--neutral-0) 25%, transparent)',
                  color: 'var(--neutral-0)',
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
                <PlusCircle size={14} color="var(--brand-accent)" />
                Open Account
              </button>
            </div>
          </div>

          {/* Right Column: 30-day Cashflow Ratio & Bar */}
          <div
            style={{
              background: 'color-mix(in srgb, var(--navy-950) 65%, transparent)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-5)',
              border: '1px solid color-mix(in srgb, var(--neutral-0) 12%, transparent)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'color-mix(in srgb, var(--neutral-0) 75%, transparent)', textTransform: 'uppercase' }}>
                  30-DAY CASHFLOW INTEL
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: data.netCashflow30d >= 0
                      ? 'color-mix(in srgb, var(--teal-400) 20%, transparent)'
                      : 'color-mix(in srgb, var(--danger-400) 20%, transparent)',
                    color: data.netCashflow30d >= 0 ? 'var(--teal-300)' : 'var(--danger-400)',
                  }}
                >
                  Net: {data.netCashflow30d >= 0 ? '+' : ''}{formatINR(data.netCashflow30d)}
                </span>
              </div>

              {/* Visual Split Bar */}
              <div style={{ height: '10px', width: '100%', borderRadius: '5px', backgroundColor: 'color-mix(in srgb, var(--neutral-0) 10%, transparent)', overflow: 'hidden', display: 'flex' }}>
                <div
                    className="cashflow-bar"
                    style={{
                      width: `${inPercent}%`,
                      backgroundColor: 'var(--teal-400)',
                  }}
                  title={`Money In: ${inPercent}%`}
                />
                <div
                    className="cashflow-bar"
                    style={{
                      width: `${outPercent}%`,
                      backgroundColor: 'var(--danger-400)',
                  }}
                  title={`Money Out: ${outPercent}%`}
                />
              </div>

              {/* Numbers Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'color-mix(in srgb, var(--neutral-0) 72%, transparent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--teal-400)' }} />
                    Money In (Credits)
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--teal-300)', marginTop: '4px' }}>
                    +{formatINR(moneyIn)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'color-mix(in srgb, var(--neutral-0) 72%, transparent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger-400)' }} />
                    Money Out (Debits)
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--danger-400)', marginTop: '4px' }}>
                    -{formatINR(moneyOut)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'color-mix(in srgb, var(--neutral-0) 70%, transparent)', marginTop: 'var(--spacing-4)' }}>
              Totals are calculated from the accounts returned for your profile.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Account Metallic 3D Showcase & Quick Payees Strip */}
      <div className="dashboard-feature-grid stagger-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 'var(--spacing-6)' }}>
        {/* Left: 3D Metallic Account Card */}
        <Card className="dashboard-feature-card" style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Primary Banking Account
                </h2>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                  {primary
                    ? `${primary.productName}${primary.branchName ? ` • ${primary.branchName}` : ''}`
                    : 'No primary account is linked yet.'}
                </div>
              </div>
              {primary && (
                <Badge variant={primary.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {primary.status}
                </Badge>
              )}
            </div>

            {/* Stylized Metallic Card Graphic */}
            <div
              style={{
                borderRadius: 'var(--radius-xl)',
                background: 'var(--card-gradient-current)',
                border: '1px solid color-mix(in srgb, var(--neutral-0) 15%, transparent)',
                boxShadow: 'var(--shadow-lg)',
                padding: 'var(--spacing-5)',
                color: 'var(--neutral-0)',
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
                  <Wifi size={14} color="color-mix(in srgb, var(--neutral-0) 72%, transparent)" style={{ transform: 'rotate(90deg)' }} />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--brand-gold)' }}>
                  FINSERV PRIVILEGE
                </div>
              </div>

              {/* Account Number display */}
              <div style={{ marginBottom: 'var(--spacing-3)' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'color-mix(in srgb, var(--neutral-0) 72%, transparent)' }}>
                  Account Number
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '1.25rem',
                    letterSpacing: '0.12em',
                    color: 'var(--neutral-0)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {primary ? maskAccountNumber(primary.accountNumber) : 'No active account'}
                  {primary && (
                    <button
                      type="button"
                      className="btn btn-icon btn-icon-sm btn-ghost dashboard-copy-button"
                      onClick={() => handleCopy(primary.accountNumber, 'account')}
                      aria-label="Copy account number"
                      title="Copy Account Number"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedField === 'account' ? 'var(--teal-300)' : 'color-mix(in srgb, var(--neutral-0) 72%, transparent)',
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
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--neutral-0) 72%, transparent)' }}>
                    IFSC Code
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '11px', color: 'var(--neutral-0)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {primary?.ifscCode || '—'}
                    {primary?.ifscCode && (
                    <button
                      type="button"
                      className="btn btn-icon btn-icon-sm btn-ghost dashboard-copy-button"
                      onClick={() => {
                        if (primary.ifscCode) handleCopy(primary.ifscCode, 'ifsc');
                      }}
                      aria-label="Copy IFSC code"
                      title="Copy IFSC Code"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedField === 'ifsc' ? 'var(--teal-300)' : 'color-mix(in srgb, var(--neutral-0) 72%, transparent)',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      {copiedField === 'ifsc' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--neutral-0) 72%, transparent)' }}>
                    Available Balance
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--teal-300)' }}>
                    {primary ? (showBalance ? formatINR(primary.availableBalance) : '₹ ••••••') : '—'}
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
                  Start a transfer to one of your saved payees.
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
              <div className="dashboard-stagger-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                {data.topBeneficiaries.map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    className="dashboard-list-action"
                    onClick={() => navigate(`/app/transfers?beneficiaryId=${b.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'linear-gradient(145deg, var(--teal-400), var(--navy-800))',
                          color: 'var(--neutral-0)',
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
                  </button>
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
                  Add and verify a payee before starting a transfer.
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
      <Card className="stagger-4" style={{ padding: 'var(--spacing-6)' }}>
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
          <div className="dashboard-stagger-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            {data.recentTransactions.map((tx) => {
              const isCredit = (tx as any).direction === 'CREDIT' || tx.transactionType === 'DEPOSIT';
              return (
                <button
                  type="button"
                  key={tx.id}
                  className="dashboard-list-action"
                  onClick={() => setSelectedTxnId(tx.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isCredit
                          ? 'var(--color-success-subtle)'
                          : 'var(--color-danger-subtle)',
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
                        {(tx as any).description || tx.narrative || tx.transactionType.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span>{formatDateTimeIST((tx as any).createdAt || tx.initiatedAt || (tx as any).completedAt)}</span>
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
                      Bal: {formatINR(tx.balanceAfter ?? (tx as any).runningBalance ?? (tx as any).fromAccountBalanceAfter ?? (tx as any).toAccountBalanceAfter ?? 0)}
                    </div>
                  </div>
                </button>
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
