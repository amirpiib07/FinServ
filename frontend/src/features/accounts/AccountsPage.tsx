import React, { useState, useEffect, useCallback } from 'react';
import type { BankAccount, AccountApplication } from '@/types/account';
import { accountService } from './accountService';
import { AccountCard } from './components/AccountCard';
import { OpenAccountModal } from './components/OpenAccountModal';
import { AccountControlsModal } from './components/AccountControlsModal';
import { AccountDetailsModal } from './components/AccountDetailsModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  Plus,
  Wallet,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [applications, setApplications] = useState<AccountApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [openModalOpen, setOpenModalOpen] = useState<boolean>(false);
  const [selectedForControls, setSelectedForControls] = useState<BankAccount | null>(null);
  const [selectedForDetails, setSelectedForDetails] = useState<BankAccount | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [accs, apps] = await Promise.all([
        accountService.getMyAccounts(),
        accountService.getMyApplications().catch(() => [] as AccountApplication[]),
      ]);
      setAccounts(accs);
      setApplications(apps);
    } catch (err: unknown) {
      const appErr = err as { userMessage?: string };
      setError(appErr.userMessage || 'Failed to load customer accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [accs, apps] = await Promise.all([
          accountService.getMyAccounts(),
          accountService.getMyApplications().catch(() => [] as AccountApplication[]),
        ]);
        if (!mounted) return;
        setAccounts(accs);
        setApplications(apps);
      } catch (err: unknown) {
        if (!mounted) return;
        const appErr = err as { userMessage?: string };
        setError(appErr.userMessage || 'Failed to load customer accounts.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Aggregate total balance
  const totalAvailable = accounts.reduce((acc, curr) => {
    return acc + (Number(curr.availableBalance) || 0);
  }, 0);

  const pendingApps = applications.filter(
    (a) => a.applicationStatus === 'SUBMITTED' || a.applicationStatus === 'UNDER_REVIEW'
  );
  const firstPending = pendingApps[0];

  return (
    <div className="accounts-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-4)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, margin: '0 0 var(--spacing-1) 0', color: 'var(--text-primary)' }}>
            Bank Accounts
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Real-time deposit balances, ISO 7064 account numbers, and account controls.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          <Button
            variant="primary"
            onClick={() => setOpenModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
          >
            <Plus size={18} />
            Open New Account
          </Button>
        </div>
      </div>

      {/* Hero Balance Summary Banner */}
      {!loading && !error && accounts.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-6)',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--spacing-4)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary-300)', fontWeight: 600 }}>
              Consolidated Net Available Funds
            </div>
            <div style={{ margin: 'var(--spacing-2) 0' }}>
              <AmountDisplay amount={totalAvailable} size="xl" />
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              Across {accounts.length} active retail & checking account(s) • Fully insured up to ₹5,00,000 under DICGC
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <Link to="/app/beneficiaries" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Manage Beneficiaries <ArrowUpRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Pending Account Applications Alert */}
      {firstPending && (
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid var(--color-warning-500)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
          }}
        >
          <Clock size={20} color="var(--color-warning-400)" />
          <div style={{ flex: 1, fontSize: 'var(--font-size-sm)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Account Application in Review:
            </span>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              Application <strong>{firstPending.applicationNumber}</strong> for{' '}
              {firstPending.productName || 'Account'} is undergoing compliance verification.
            </span>
          </div>
          <Badge variant="warning">{firstPending.applicationStatus}</Badge>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--spacing-6)',
          }}
        >
          <Skeleton style={{ height: '260px', borderRadius: 'var(--radius-xl)' }} />
          <Skeleton style={{ height: '260px', borderRadius: 'var(--radius-xl)' }} />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not retrieve accounts"
          message={error}
          onRetry={loadData}
        />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<Wallet size={48} />}
          title="No bank accounts opened yet"
          description="Open your first FINServ High-Yield Savings or Commercial Current account with instant digital verification."
          action={
            <Button
              variant="primary"
              onClick={() => setOpenModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
            >
              <Sparkles size={16} />
              Open Your First Account
            </Button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 'var(--spacing-6)',
          }}
        >
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onEditControls={(account) => setSelectedForControls(account)}
              onViewDetails={(account) => setSelectedForDetails(account)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <OpenAccountModal
        isOpen={openModalOpen}
        onClose={() => setOpenModalOpen(false)}
        onSuccess={loadData}
      />

      <AccountControlsModal
        account={selectedForControls}
        isOpen={!!selectedForControls}
        onClose={() => setSelectedForControls(null)}
        onSuccess={(updated) => {
          setAccounts((prev) =>
            prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
          );
        }}
      />

      <AccountDetailsModal
        account={selectedForDetails}
        isOpen={!!selectedForDetails}
        onClose={() => setSelectedForDetails(null)}
      />
    </div>
  );
};
