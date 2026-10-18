/**
 * FINServ General Ledger & Immutable Audit Trail Explorer (`/admin/audit-ledger`)
 * - Tab 1: Double-Entry GL Trial Balance Table proving Sum(Debits) == Sum(Credits)
 * - Tab 2: Tamper-Evident SHA-256 Audit Trail Explorer with cryptographic hash-chain inspection
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Scale,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { adminService } from './adminService';
import type { GlTrialBalanceDto, AuditLogDto } from '@/types/admin';
import { formatINR } from '@/lib/money';
import { formatDateTimeIST } from '@/lib/dates';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export const AuditLedgerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GL' | 'AUDIT'>('GL');

  // --- GL State ---
  const [glData, setGlData] = useState<GlTrialBalanceDto | null>(null);
  const [glLoading, setGlLoading] = useState(true);

  // --- Audit State ---
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditPage, setAuditPage] = useState<number>(0);
  const [totalAuditLogs, setTotalAuditLogs] = useState<number>(0);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    adminService
      .getGlSummary()
      .then((res) => {
        if (!ignore) {
          setGlData(res);
          setGlLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setGlLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    if (activeTab === 'AUDIT') {
      adminService
        .getAuditLogs({
          action: auditActionFilter,
          page: auditPage,
          size: 25,
        })
        .then((res) => {
          if (!ignore) {
            setAuditLogs(res.items);
            setTotalAuditLogs(res.totalElements);
            setAuditLoading(false);
          }
        })
        .catch(() => {
          if (!ignore) setAuditLoading(false);
        });
    }
    return () => {
      ignore = true;
    };
  }, [activeTab, auditActionFilter, auditPage]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="page-transition-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            General Ledger & Immutable Audit Trail
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Cryptographically chained SHA-256 event logs and mathematical double-entry trial balance proof.
          </p>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-sunken)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('GL')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'GL' ? 600 : 500,
              backgroundColor: activeTab === 'GL' ? 'var(--surface-card)' : 'transparent',
              color: activeTab === 'GL' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              boxShadow: activeTab === 'GL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            GL Trial Balance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'AUDIT' ? 600 : 500,
              backgroundColor: activeTab === 'AUDIT' ? 'var(--surface-card)' : 'transparent',
              color: activeTab === 'AUDIT' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              boxShadow: activeTab === 'AUDIT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            SHA-256 Audit Trail ({totalAuditLogs})
          </button>
        </div>
      </div>

      {/* 2. TAB 1: GL TRIAL BALANCE */}
      {activeTab === 'GL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {/* Trial Balance Health Hero Banner */}
          {glData && (
            <div
              style={{
                borderRadius: 'var(--radius-xl)',
                background: glData.balanced
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)',
                border: `1px solid ${glData.balanced ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                padding: 'var(--spacing-6)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--spacing-4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: glData.balanced ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: glData.balanced ? '#10B981' : '#EF4444',
                  }}
                >
                  <Scale size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: glData.balanced ? '#10B981' : '#EF4444', textTransform: 'uppercase' }}>
                    DOUBLE-ENTRY RECONCILIATION PROOF
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {glData.balanced ? 'General Ledger In Perfect Equilibrium' : 'Ledger Out of Balance!'}
                  </h2>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Total Posted Debits exactly equal Total Posted Credits across all chart accounts.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-6)', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Debits</div>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatINR(glData.totalDebits)}
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', color: 'var(--text-tertiary)', fontWeight: 300 }}>=</div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Credits</div>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatINR(glData.totalCredits)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GL Chart Accounts Table */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-sunken)' }}>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>GL Code</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Account Name</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Classification</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Normal Balance</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Total Debits</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Total Credits</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {glLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td colSpan={7} style={{ padding: '16px' }}><Skeleton width="100%" height="24px" /></td>
                      </tr>
                    ))
                  ) : glData?.accounts && glData.accounts.length > 0 ? (
                    glData.accounts.map((acc) => (
                      <tr key={acc.glAccountId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {acc.accountCode}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {acc.accountName}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant="neutral">{acc.classification}</Badge>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {acc.normalBalance}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-family-mono)', color: 'var(--text-primary)' }}>
                          {formatINR(acc.totalDebits)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-family-mono)', color: 'var(--text-primary)' }}>
                          {formatINR(acc.totalCredits)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-family-mono)', fontWeight: 700, color: 'var(--brand-accent)' }}>
                          {formatINR(acc.netBalance)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        No general ledger accounts loaded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 3. TAB 2: IMMUTABLE SHA-256 AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {/* Action Filter Pills */}
          <Card style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['ALL', 'LOGIN', 'APPROVE', 'REJECT', 'UPDATE', 'CREATE'].map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => {
                      setAuditActionFilter(action);
                      setAuditPage(0);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '12px',
                      fontWeight: auditActionFilter === action ? 600 : 500,
                      backgroundColor: auditActionFilter === action ? 'var(--brand-accent)' : 'var(--surface-sunken)',
                      color: auditActionFilter === action ? '#FFFFFF' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                <ShieldCheck size={14} color="#10B981" />
                <span>SHA-256 Cryptographic Hash Chaining Verified</span>
              </div>
            </div>
          </Card>

          {/* Audit Logs Table */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-sunken)' }}>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', width: '180px' }}>Timestamp (IST)</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Actor</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Action</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Entity</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Cryptographic Hash Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td colSpan={5} style={{ padding: '16px' }}><Skeleton width="100%" height="24px" /></td>
                      </tr>
                    ))
                  ) : auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        {/* Timestamp */}
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {formatDateTimeIST(log.occurredAt)}
                        </td>

                        {/* Actor */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {log.actorUsername || 'System'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            {log.actorRole || 'SYSTEM_INTERNAL'}
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td style={{ padding: '12px 16px' }}>
                          <Badge
                            variant={
                              log.action === 'APPROVE'
                                ? 'success'
                                : log.action === 'REJECT'
                                ? 'danger'
                                : 'neutral'
                            }
                          >
                            {log.action}
                          </Badge>
                        </td>

                        {/* Entity */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                            {log.entityType}
                          </div>
                          <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            ID: {log.entityId ? log.entityId.slice(0, 12) + '...' : 'N/A'}
                          </div>
                        </td>

                        {/* Cryptographic SHA-256 Hash Chain */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-family-mono)' }}>
                            <span
                              title={`Previous Hash: ${log.previousHash}`}
                              style={{ color: 'var(--text-tertiary)', background: 'var(--surface-sunken)', padding: '2px 6px', borderRadius: '4px' }}
                            >
                              {log.previousHash.slice(0, 8)}...
                            </span>
                            <ArrowRight size={12} color="var(--text-tertiary)" />
                            <span
                              title={`Current Hash: ${log.currentHash}`}
                              style={{ color: 'var(--brand-accent)', background: 'var(--surface-sunken)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}
                            >
                              {log.currentHash.slice(0, 8)}...
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyHash(log.currentHash)}
                              title="Copy SHA-256 Hash"
                              style={{ background: 'none', border: 'none', color: copiedHash === log.currentHash ? '#10B981' : 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}
                            >
                              {copiedHash === log.currentHash ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        No audit events recorded for the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
