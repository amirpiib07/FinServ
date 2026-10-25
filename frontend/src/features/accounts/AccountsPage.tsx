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
import { addMoney } from '@/lib/money';
import {
  Plus,
  Wallet,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export const AccountsPage: React.FC = () => {
  const { id: routeAccountId } = useParams<{ id?: string }>();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [applications, setApplications] = useState<AccountApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [openModalOpen, setOpenModalOpen] = useState<boolean>(false);
  const [selectedForControls, setSelectedForControls] = useState<BankAccount | null>(null);
  const [selectedForDetails, setSelectedForDetails] = useState<BankAccount | null>(null);
  const [directLoadedAccount, setDirectLoadedAccount] = useState<BankAccount | null>(null);
  const [closedRouteModal, setClosedRouteModal] = useState<boolean>(false);

  const activeDetailsAccount =
    selectedForDetails ||
    (!closedRouteModal && routeAccountId
      ? accounts.find((a) => a.id === routeAccountId) ||
        (directLoadedAccount?.id === routeAccountId ? directLoadedAccount : null)
      : null);

  const loadData = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setError(null);
    try {
      const [accs, apps] = await Promise.all([
        accountService.getMyAccounts(),
        accountService.getMyApplications(),
      ]);
      if (!isActive()) return;
      const directAccount =
        routeAccountId && !accs.some((account) => account.id === routeAccountId)
          ? await accountService.getAccountById(routeAccountId)
          : null;
      if (!isActive()) return;
      setAccounts(accs);
      setApplications(apps);
      setDirectLoadedAccount(directAccount);
    } catch (err: unknown) {
      if (!isActive()) return;
      const appErr = err as { userMessage?: string };
      setError(appErr.userMessage || 'Failed to load customer accounts.');
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [routeAccountId]);

  useEffect(() => {
    let mounted = true;
    void Promise.resolve().then(() => {
      if (mounted) void loadData(() => mounted);
    });

    return () => {
      mounted = false;
    };
  }, [loadData]);

  // Aggregate total balance
  const totalAvailable = accounts.reduce((acc, curr) => {
    return addMoney(acc, String(curr.availableBalance));
  }, '0.00');

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
            View your account balances, account details, and available controls.
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

      {/* Hero Relationship Summary Ribbon */}
      {!loading && !error && accounts.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--spacing-4)',
          }}
        >
          {/* Main Total Relationship Balance Tile */}
          <div
            style={{
              gridColumn: 'span 2',
              background: 'linear-gradient(135deg, #0A192F 0%, #0F2342 60%, #172554 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-6)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              overflow: 'hidden',
              color: '#FFFFFF',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: '-30px',
                top: '-30px',
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(46, 196, 182, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-2)',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--brand-accent)',
                    fontWeight: 700,
                  }}
                >
                  Consolidated Net Available Funds
                </span>
              </div>

              <div style={{ margin: 'var(--spacing-2) 0', color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                <AmountDisplay amount={totalAvailable} size="xl" />
              </div>

              <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.7)' }}>
                Across {accounts.length} account(s)
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-3)',
                marginTop: 'var(--spacing-5)',
                paddingTop: 'var(--spacing-4)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                flexWrap: 'wrap',
              }}
            >
              <Link to="/app/transfers?tab=DEPOSIT" style={{ textDecoration: 'none' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34D399',
                    borderColor: 'rgba(52, 211, 153, 0.35)',
                    fontWeight: 600,
                  }}
                >
                  <ArrowDownLeft size={14} /> Deposit Money
                </Button>
              </Link>
              <Link to="/app/transfers?tab=WITHDRAW" style={{ textDecoration: 'none' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#FBBF24',
                    borderColor: 'rgba(251, 191, 36, 0.35)',
                    fontWeight: 600,
                  }}
                >
                  <ArrowUpRight size={14} /> Withdraw Cash
                </Button>
              </Link>
              <Link to="/app/transfers" style={{ textDecoration: 'none' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.18)',
                  }}
                >
                  Quick Transfer <ArrowUpRight size={14} />
                </Button>
              </Link>
              <Link to="/app/beneficiaries" style={{ textDecoration: 'none' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.18)',
                  }}
                >
                  Manage Beneficiaries <ArrowUpRight size={14} />
                </Button>
              </Link>
            </div>
          </div>

          {/* Relationship Metrics & Quick Actions */}
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 'var(--spacing-2)',
                }}
              >
                Account Portfolio
              </span>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {accounts.length}{' '}
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Active {accounts.length === 1 ? 'Account' : 'Accounts'}
                </span>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {accounts.filter((a) => a.productType === 'SAVINGS' || a.productName?.toLowerCase().includes('savings')).length} Savings •{' '}
                {accounts.filter((a) => a.productType === 'CURRENT' || a.productName?.toLowerCase().includes('current')).length} Current
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenModalOpen(true)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Plus size={14} /> Add Another Account
              </Button>
              <Link to="/app/statements" style={{ textDecoration: 'none' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ width: '100%', justifyContent: 'center', color: 'var(--text-secondary)' }}
                >
                  Download Statements
                </Button>
              </Link>
            </div>
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
          {accounts.map((acc, index) => (
            <div key={acc.id} className={`stagger-${(index % 4) + 1}`}>
              <AccountCard
                account={acc}
                onEditControls={(account) => setSelectedForControls(account)}
                onViewDetails={(account) => setSelectedForDetails(account)}
              />
            </div>
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
        account={activeDetailsAccount}
        isOpen={!!activeDetailsAccount}
        onClose={() => {
          setSelectedForDetails(null);
          setClosedRouteModal(true);
        }}
      />
    </div>
  );
};
