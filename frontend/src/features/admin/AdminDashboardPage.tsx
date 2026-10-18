/**
 * FINServ Admin & Super Admin Command Center Dashboard (`/admin/dashboard`)
 * - System KPI Cards (Total Customers, Pending KYC, Pending Accounts, Active Accounts, Customer Deposits, Daily Volume)
 * - Double-Entry General Ledger Balance Integrity Live Indicator
 * - Quick Action Review Launchers for Pending Queues
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  CreditCard,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Landmark,
  Scale,
} from 'lucide-react';
import { adminService } from './adminService';
import type { AdminOverviewDto } from '@/types/admin';
import { formatINR } from '@/lib/money';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AdminOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    adminService
      .getOverview()
      .then((res) => {
        if (isMounted) {
          setOverview(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.userMessage || err?.message || 'Failed to load system executive overview.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        <div>
          <Skeleton width="280px" height="32px" />
          <Skeleton width="400px" height="18px" style={{ marginTop: '8px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-4)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="130px" style={{ borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
        <Skeleton width="100%" height="260px" style={{ borderRadius: 'var(--radius-xl)' }} />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <Card style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
        <AlertTriangle size={48} color="var(--color-danger)" style={{ margin: '0 auto var(--spacing-4)' }} />
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Command Overview Offline</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 'var(--spacing-4)' }}>
          {error || 'Unable to retrieve core banking metrics.'}
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="page-transition-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Operations Command Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Enterprise core-banking metrics, regulatory compliance queues, and double-entry ledger health.
          </p>
        </div>

        {/* GL Integrity Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: overview.glIntegrityBalanced
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${
              overview.glIntegrityBalanced
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(239, 68, 68, 0.3)'
            }`,
          }}
        >
          <Scale size={16} color={overview.glIntegrityBalanced ? '#10B981' : '#EF4444'} />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: overview.glIntegrityBalanced ? '#10B981' : '#EF4444',
            }}
          >
            GL TRIAL BALANCE: {overview.glTrialBalanceStatus}
          </span>
        </div>
      </div>

      {/* 2. System KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-4)' }}>
        {/* Total Customers */}
        <Card style={{ padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Customers
            </span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--brand-accent)' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-mono)', color: 'var(--text-primary)', marginTop: 'var(--spacing-2)' }}>
            {overview.totalCustomers}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Registered CIF records
          </div>
        </Card>

        {/* Pending KYC Reviews */}
        <Card
          style={{
            padding: 'var(--spacing-5)',
            borderLeft: overview.pendingKycReviews > 0 ? '4px solid var(--color-warning)' : '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending KYC Reviews
            </span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-mono)', color: overview.pendingKycReviews > 0 ? '#F59E0B' : 'var(--text-primary)', marginTop: 'var(--spacing-2)' }}>
            {overview.pendingKycReviews}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Awaiting verification</span>
            {overview.pendingKycReviews > 0 && (
              <button
                type="button"
                onClick={() => navigate('/admin/kyc')}
                style={{ background: 'none', border: 'none', color: 'var(--brand-accent)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                Review →
              </button>
            )}
          </div>
        </Card>

        {/* Total Bank Deposits */}
        <Card style={{ padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Customer Deposits
            </span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
              <Landmark size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-mono)', color: 'var(--text-primary)', marginTop: 'var(--spacing-2)' }}>
            {formatINR(overview.totalCustomerDeposits)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Across {overview.totalActiveAccounts} active accounts
          </div>
        </Card>

        {/* Today's Volume */}
        <Card style={{ padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Today's Volume
            </span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-mono)', color: 'var(--text-primary)', marginTop: 'var(--spacing-2)' }}>
            {formatINR(overview.todayTransactionVolume)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Settled via Double-Entry GL
          </div>
        </Card>
      </div>

      {/* 3. Action Queues & Quick Launchers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--spacing-6)' }}>
        {/* KYC Onboarding Review Banner */}
        <Card style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Customer KYC Review Queue
                </h2>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                  Maker-checker verification of PAN, Aadhaar, and FATCA declarations
                </div>
              </div>
            </div>

            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
              {overview.pendingKycReviews > 0
                ? `There are ${overview.pendingKycReviews} customer applications submitted and awaiting identity review.`
                : 'All submitted customer onboarding applications have been verified and processed.'}
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/admin/kyc')}
            leftIcon={<ArrowUpRight size={16} />}
          >
            Open KYC Workbench ({overview.pendingKycReviews} Pending)
          </Button>
        </Card>

        {/* Account Applications & Freeze Control Banner */}
        <Card style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Accounts & Freeze Governance
                </h2>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                  Account opening decisions and AML risk freeze/unfreeze controls
                </div>
              </div>
            </div>

            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
              {overview.pendingAccountApplications > 0
                ? `${overview.pendingAccountApplications} new deposit account opening requests pending authorization.`
                : 'All account opening requests have been processed. Account status controls active.'}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate('/admin/accounts')}
            leftIcon={<ArrowUpRight size={16} />}
          >
            Manage Accounts ({overview.pendingAccountApplications} Applications)
          </Button>
        </Card>
      </div>

      {/* 4. General Ledger & SHA-256 Audit Trail Card */}
      <Card style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={20} color="var(--brand-accent)" />
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Double-Entry General Ledger & SHA-256 Immutable Audit Trail
              </h2>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Continuous real-time verification of chart of accounts (Total Debits == Total Credits) and cryptographic block hashes.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/audit-ledger')}
          >
            View GL Trial Balance & Audit Trail
          </Button>
        </div>
      </Card>
    </div>
  );
};
