/**
 * FINServ Admin Accounts & Status Governance (`/admin/accounts`)
 * - Tab 1: Account Directory with Search, Balance Inspection, and Freeze/Unfreeze Controls
 * - Tab 2: Pending Account Applications Approval Queue
 * - Mandatory officer audit remarks on every freeze, unfreeze, and application decision
 */

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Search,
  Lock,
  Unlock,
  ShieldAlert,
  X,
} from 'lucide-react';
import { adminService } from './adminService';
import type { AdminAccountSummaryDto, AdminAccountApplicationDto } from '@/types/admin';
import { formatINR } from '@/lib/money';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';

export const AdminAccountsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'APPLICATIONS'>('DIRECTORY');

  // --- Accounts Directory State ---
  const [accounts, setAccounts] = useState<AdminAccountSummaryDto[]>([]);
  const [accLoading, setAccLoading] = useState(true);
  const [accStatusFilter, setAccStatusFilter] = useState<string>('ALL');
  const [accSearch, setAccSearch] = useState<string>('');
  const [accPage, setAccPage] = useState<number>(0);
  const [totalAccounts, setTotalAccounts] = useState<number>(0);

  // Freeze / Unfreeze Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAcc, setSelectedAcc] = useState<AdminAccountSummaryDto | null>(null);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'FROZEN'>('FROZEN');
  const [statusReason, setStatusReason] = useState<string>('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // --- Pending Account Applications State ---
  const [applications, setApplications] = useState<AdminAccountApplicationDto[]>([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appStatusFilter] = useState<string>('SUBMITTED');
  const [appDecisionModalOpen, setAppDecisionModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AdminAccountApplicationDto | null>(null);
  const [appDecision, setAppDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [appRemarks, setAppRemarks] = useState('');
  const [appSubmitting, setAppSubmitting] = useState(false);

  // Toast / feedback message
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [accRefreshKey, setAccRefreshKey] = useState(0);
  const [appRefreshKey, setAppRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    if (activeTab === 'DIRECTORY') {
      adminService
        .getAccounts({
          status: accStatusFilter === 'ALL' ? undefined : accStatusFilter,
          search: accSearch,
          page: accPage,
          size: 20,
        })
        .then((res) => {
          if (!ignore) {
            setAccounts(res.items);
            setTotalAccounts(res.totalElements);
            setAccLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (!ignore) {
            const msg = (err as { userMessage?: string })?.userMessage || 'Failed to load accounts';
            setFeedback({ message: msg, type: 'error' });
            setAccLoading(false);
          }
        });
    } else {
      adminService
        .getAccountApplications({
          status: appStatusFilter,
          page: 0,
          size: 20,
        })
        .then((res) => {
          if (!ignore) {
            setApplications(res.items);
            setAppLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (!ignore) {
            const msg = (err as { userMessage?: string })?.userMessage || 'Failed to load account applications';
            setFeedback({ message: msg, type: 'error' });
            setAppLoading(false);
          }
        });
    }
    return () => {
      ignore = true;
    };
  }, [activeTab, accStatusFilter, accSearch, accPage, appStatusFilter, accRefreshKey, appRefreshKey]);

  const handleOpenStatusModal = (acc: AdminAccountSummaryDto) => {
    setSelectedAcc(acc);
    const newStatus = acc.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
    setTargetStatus(newStatus);
    setStatusReason(
      newStatus === 'FROZEN'
        ? 'Suspicious transaction velocity flagged by AML monitoring system.'
        : 'Customer verification complete and compliance review cleared.'
    );
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedAcc) return;
    if (!statusReason.trim()) {
      alert('Officer justification is mandatory for account status modifications.');
      return;
    }

    setStatusSubmitting(true);
    try {
      await adminService.updateAccountStatus(selectedAcc.accountId, {
        status: targetStatus,
        reason: statusReason.trim(),
      });

      setFeedback({
        message: `Account ${selectedAcc.accountNumber} has been updated to ${targetStatus}.`,
        type: 'success',
      });
      setStatusModalOpen(false);
      setSelectedAcc(null);
      setAccLoading(true);
      setAccRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = (err as { userMessage?: string; message?: string })?.userMessage ||
        (err as Error)?.message ||
        'Failed to update account status.';
      alert(msg);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleOpenAppDecision = (app: AdminAccountApplicationDto, decision: 'APPROVE' | 'REJECT') => {
    setSelectedApp(app);
    setAppDecision(decision);
    setAppRemarks(
      decision === 'APPROVE'
        ? 'Customer KYC verified; generated official core-banking deposit account.'
        : 'Initial deposit requirement or documentation criteria not satisfied.'
    );
    setAppDecisionModalOpen(true);
  };

  const handleConfirmAppDecision = async () => {
    if (!selectedApp) return;
    if (!appRemarks.trim()) {
      alert('Remarks are required.');
      return;
    }

    setAppSubmitting(true);
    try {
      await adminService.decideAccountApplication(selectedApp.id, {
        decision: appDecision,
        remarks: appRemarks.trim(),
      });

      setFeedback({
        message: `Application ${selectedApp.applicationNumber} has been ${appDecision}D.`,
        type: 'success',
      });
      setAppDecisionModalOpen(false);
      setSelectedApp(null);
      setAppLoading(true);
      setAppRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = (err as { userMessage?: string; message?: string })?.userMessage ||
        (err as Error)?.message ||
        'Failed to submit application decision.';
      alert(msg);
    } finally {
      setAppSubmitting(false);
    }
  };

  return (
    <div className="page-transition-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Accounts & Freeze Control
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Enterprise directory of customer deposit accounts, AML freeze governance, and new account approvals.
          </p>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-sunken)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('DIRECTORY')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'DIRECTORY' ? 600 : 500,
              backgroundColor: activeTab === 'DIRECTORY' ? 'var(--surface-card)' : 'transparent',
              color: activeTab === 'DIRECTORY' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              boxShadow: activeTab === 'DIRECTORY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Accounts Directory ({totalAccounts})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('APPLICATIONS')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'APPLICATIONS' ? 600 : 500,
              backgroundColor: activeTab === 'APPLICATIONS' ? 'var(--surface-card)' : 'transparent',
              color: activeTab === 'APPLICATIONS' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              boxShadow: activeTab === 'APPLICATIONS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Pending Account Openings
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: feedback.type === 'success' ? '#10B981' : '#EF4444',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. TAB 1: ACCOUNTS DIRECTORY */}
      {activeTab === 'DIRECTORY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {/* Search & Filters */}
          <Card style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'ACTIVE', 'FROZEN'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setAccStatusFilter(status);
                      setAccPage(0);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '12px',
                      fontWeight: accStatusFilter === status ? 600 : 500,
                      backgroundColor: accStatusFilter === status ? 'var(--brand-accent)' : 'var(--surface-sunken)',
                      color: accStatusFilter === status ? '#FFFFFF' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAccPage(0);
                  setAccLoading(true);
                  setAccRefreshKey((k) => k + 1);
                }}
                style={{ display: 'flex', gap: '8px' }}
              >
                <Input
                  placeholder="Search account #, CIF, customer..."
                  value={accSearch}
                  onChange={(e) => setAccSearch(e.target.value)}
                  prefixIcon={<Search size={15} color="var(--text-tertiary)" />}
                />
                <Button type="submit" variant="secondary" size="sm">
                  Search
                </Button>
              </form>
            </div>
          </Card>

          {/* Table */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-sunken)' }}>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Account Number</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer / CIF</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Product & Branch</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Available Balance</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Governance</th>
                  </tr>
                </thead>
                <tbody>
                  {accLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td colSpan={6} style={{ padding: '16px' }}><Skeleton width="100%" height="24px" /></td>
                      </tr>
                    ))
                  ) : accounts.length > 0 ? (
                    accounts.map((acc) => (
                      <tr key={acc.accountId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {acc.accountNumber}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{acc.customerName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>CIF: {acc.customerNumber}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ color: 'var(--text-primary)' }}>{acc.productName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{acc.branchName} • {acc.ifscCode}</div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-family-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatINR(acc.availableBalance)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant={acc.status === 'ACTIVE' ? 'success' : acc.status === 'FROZEN' ? 'danger' : 'neutral'}>
                            {acc.status}
                          </Badge>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenStatusModal(acc)}
                            leftIcon={acc.status === 'FROZEN' ? <Unlock size={14} /> : <Lock size={14} />}
                            style={{
                              color: acc.status === 'FROZEN' ? '#10B981' : 'var(--color-danger)',
                              borderColor: acc.status === 'FROZEN' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                            }}
                          >
                            {acc.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        No accounts match the query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 3. TAB 2: PENDING ACCOUNT OPENING APPLICATIONS */}
      {activeTab === 'APPLICATIONS' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-sunken)' }}>
                  <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Application #</th>
                  <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer / CIF</th>
                  <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Product Requested</th>
                  <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Branch</th>
                  <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Initial Deposit</th>
                  <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                  <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {appLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td colSpan={7} style={{ padding: '16px' }}><Skeleton width="100%" height="24px" /></td>
                    </tr>
                  ))
                ) : applications.length > 0 ? (
                  applications.map((app) => (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {app.applicationNumber}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.customerName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>CIF: {app.customerNumber}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                        {app.productName}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {app.branchName}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-family-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatINR(app.initialDepositAmount)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={app.status === 'APPROVED' ? 'success' : app.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {app.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {app.status === 'SUBMITTED' ? (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleOpenAppDecision(app, 'APPROVE')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAppDecision(app, 'REJECT')}
                              style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                      No pending account applications in queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Freeze / Unfreeze Action Modal */}
      <Dialog.Root open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 70, backdropFilter: 'blur(4px)' }} />
          <Dialog.Content
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(460px, 90vw)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-6)',
              zIndex: 71,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-3)' }}>
              {targetStatus === 'FROZEN' ? <ShieldAlert size={22} color="var(--color-danger)" /> : <Unlock size={22} color="#10B981" />}
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {targetStatus === 'FROZEN' ? 'Freeze Bank Account' : 'Lift Account Freeze'}
              </h2>
            </div>

            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
              {targetStatus === 'FROZEN'
                ? `Freezing account ${selectedAcc?.accountNumber} will immediately block all electronic fund transfers, ATM withdrawals, and outgoing debits.`
                : `Lifting the freeze will restore full transactional privileges for account ${selectedAcc?.accountNumber}.`}
            </p>

            <div style={{ marginBottom: 'var(--spacing-4)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Mandatory Audit Justification <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <Textarea
                rows={3}
                placeholder="Enter specific regulatory, AML or risk reasoning..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
              <Button variant="outline" onClick={() => setStatusModalOpen(false)} disabled={statusSubmitting}>
                Cancel
              </Button>
              <Button
                variant={targetStatus === 'FROZEN' ? 'danger' : 'primary'}
                onClick={handleConfirmStatusChange}
                isLoading={statusSubmitting}
              >
                Confirm {targetStatus === 'FROZEN' ? 'Account Freeze' : 'Unfreeze'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Account Application Decision Modal */}
      <Dialog.Root open={appDecisionModalOpen} onOpenChange={setAppDecisionModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 70, backdropFilter: 'blur(4px)' }} />
          <Dialog.Content
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(460px, 90vw)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-6)',
              zIndex: 71,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            }}
          >
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {appDecision === 'APPROVE' ? 'Approve Account Application' : 'Reject Account Application'}
            </h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 'var(--spacing-4)' }}>
              {appDecision === 'APPROVE'
                ? `Approval will generate the official FinServ account number and post the opening ledger entry.`
                : `Rejection will notify the customer with your specified remarks.`}
            </p>

            <div style={{ marginBottom: 'var(--spacing-4)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Officer Remarks <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <Textarea
                rows={3}
                placeholder="Enter remarks..."
                value={appRemarks}
                onChange={(e) => setAppRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
              <Button variant="outline" onClick={() => setAppDecisionModalOpen(false)} disabled={appSubmitting}>
                Cancel
              </Button>
              <Button
                variant={appDecision === 'APPROVE' ? 'primary' : 'danger'}
                onClick={handleConfirmAppDecision}
                isLoading={appSubmitting}
              >
                Confirm {appDecision === 'APPROVE' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
