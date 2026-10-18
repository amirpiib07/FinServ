/**
 * FINServ KYC & Onboarding Review Workbench (`/admin/kyc`)
 * - Searchable, filterable queue of customer onboarding applications
 * - Slide-over inspection drawer displaying applicant profile, declarations, address, and masked KYC documents
 * - Maker-Checker KYC Approve & Reject actions with mandatory audit remarks
 */

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Search,
  CheckCircle2,
  Eye,
  X,
  FileText,
} from 'lucide-react';
import { adminService } from './adminService';
import type { AdminKycApplicationDto } from '@/types/admin';
import { formatDateTimeIST, formatDateIST } from '@/lib/dates';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';

export const KycReviewPage: React.FC = () => {
  const [applications, setApplications] = useState<AdminKycApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('SUBMITTED');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Selected application for slide-over drawer
  const [selectedApp, setSelectedApp] = useState<AdminKycApplicationDto | null>(null);

  // Decision Modal State
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    adminService
      .getKycApplications({
        status: statusFilter,
        search: searchQuery,
        page,
        size: 20,
      })
      .then((res) => {
        if (!ignore) {
          const items = Array.isArray(res) ? res : (res?.items ?? []);
          setApplications(items);
          setTotalElements(Array.isArray(res) ? res.length : (res?.totalElements ?? items.length));
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = (err as { userMessage?: string; message?: string })?.userMessage ||
            (err as Error)?.message ||
            'Failed to load KYC applications';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter, searchQuery, page, refreshKey]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setRefreshKey((k) => k + 1);
  };

  const handleOpenDecision = (app: AdminKycApplicationDto, type: 'APPROVE' | 'REJECT') => {
    setSelectedApp(app);
    setDecisionType(type);
    setRemarks(
      type === 'APPROVE'
        ? 'Verified all customer identity documents, address proof, and regulatory declarations as per AML/CFT standards.'
        : ''
    );
    setDecisionModalOpen(true);
  };

  const handleConfirmDecision = async () => {
    if (!selectedApp) return;
    if (!remarks.trim()) {
      alert('Officer remarks are mandatory for audit compliance.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.decideKycApplication(selectedApp.applicationId, {
        decision: decisionType,
        remarks: remarks.trim(),
      });

      setSuccessBanner(
        `Application ${selectedApp.applicationReference} has been successfully ${
          decisionType === 'APPROVE' ? 'APPROVED' : 'REJECTED'
        }.`
      );
      setDecisionModalOpen(false);
      setSelectedApp(null);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = (err as { userMessage?: string; message?: string })?.userMessage ||
        (err as Error)?.message ||
        'Failed to submit decision.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-transition-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* 1. Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              KYC & Onboarding Review Workbench
            </h1>
            <Badge variant="neutral">
              Dual Control • {totalElements} Total
            </Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Verify customer identity credentials, PAN numbers, address proofs, and FATCA declarations.
          </p>
          {error && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-main)', borderRadius: '6px', fontSize: '13px' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Success notification banner */}
      {successBanner && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10B981',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
            <CheckCircle2 size={18} />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. Filter & Search Controls */}
      <Card style={{ padding: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-sunken)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
            {[
              { id: 'SUBMITTED', label: 'Pending Review' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'REJECTED', label: 'Rejected' },
              { id: 'ALL', label: 'All Applications' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(0);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: statusFilter === tab.id ? 600 : 500,
                  backgroundColor: statusFilter === tab.id ? 'var(--surface-card)' : 'transparent',
                  color: statusFilter === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: statusFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', minWidth: '280px' }}>
            <Input
              placeholder="Search reference, name, CIF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefixIcon={<Search size={15} color="var(--text-tertiary)" />}
            />
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>
        </div>
      </Card>

      {/* 3. Applications Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-sunken)' }}>
                <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', width: '160px' }}>
                  Application Ref
                </th>
                <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Customer Details
                </th>
                <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  PAN & IDs
                </th>
                <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Submitted At
                </th>
                <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td colSpan={6} style={{ padding: '16px' }}>
                      <Skeleton width="100%" height="24px" />
                    </td>
                  </tr>
                ))
              ) : Array.isArray(applications) && applications.length > 0 ? (
                applications.map((app) => (
                  <tr
                    key={app.applicationId}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {/* Application Ref */}
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {app.applicationReference}
                    </td>

                    {/* Customer Info */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {app.fullName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        CIF: {app.customerNumber} • {app.email}
                      </div>
                    </td>

                    {/* PAN & IDs */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                        PAN: {app.panNumberMasked || '••••••••••'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {app.kycDocuments.length} KYC Document(s)
                      </div>
                    </td>

                    {/* Submitted At */}
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {app.submittedAt ? formatDateTimeIST(app.submittedAt) : 'Draft'}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <Badge
                        variant={
                          app.status === 'APPROVED'
                            ? 'success'
                            : app.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {app.status}
                      </Badge>
                    </td>

                    {/* Action buttons */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedApp(app)}
                          leftIcon={<Eye size={14} />}
                        >
                          Inspect
                        </Button>
                        {app.status === 'SUBMITTED' && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleOpenDecision(app, 'APPROVE')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDecision(app, 'REJECT')}
                              style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No onboarding applications match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. Slide-Over Drawer for Application Inspection */}
      <Dialog.Root open={Boolean(selectedApp && !decisionModalOpen)} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 60,
              backdropFilter: 'blur(4px)',
            }}
          />
          <Dialog.Content
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(540px, 92vw)',
              backgroundColor: 'var(--surface-card)',
              zIndex: 61,
              padding: 'var(--spacing-6)',
              overflowY: 'auto',
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {selectedApp && (
              <div>
                {/* Drawer Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--spacing-4)' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand-accent)', textTransform: 'uppercase' }}>
                      KYC DOSSIER INSPECTION
                    </span>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedApp.fullName}
                    </h2>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: 'var(--text-tertiary)' }}>
                      Ref: {selectedApp.applicationReference} • CIF: {selectedApp.customerNumber}
                    </div>
                  </div>
                  <Dialog.Close asChild>
                    <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Status & Declarations Row */}
                <div style={{ display: 'flex', gap: '8px', margin: 'var(--spacing-4) 0', flexWrap: 'wrap' }}>
                  <Badge variant={selectedApp.status === 'APPROVED' ? 'success' : selectedApp.status === 'REJECTED' ? 'danger' : 'warning'}>
                    Status: {selectedApp.status}
                  </Badge>
                  <Badge variant="neutral">
                    FATCA: {selectedApp.fatcaDeclared ? 'Declared Tax Resident of India' : 'Pending'}
                  </Badge>
                  <Badge variant="neutral">
                    PEP: {selectedApp.pepDeclared ? 'Politically Exposed' : 'Non-PEP Clean'}
                  </Badge>
                </div>

                {/* Personal Information */}
                <div style={{ marginBottom: 'var(--spacing-5)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-2)' }}>
                    Personal Credentials
                  </h3>
                  <div style={{ backgroundColor: 'var(--surface-sunken)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)', fontSize: '12px' }}>
                    <div>
                      <div style={{ color: 'var(--text-tertiary)' }}>Permanent Account Number (PAN)</div>
                      <div style={{ fontWeight: 600, fontFamily: 'var(--font-family-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                        {selectedApp.panNumberMasked || '••••••••••'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-tertiary)' }}>Date of Birth / Gender</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {selectedApp.dateOfBirth ? formatDateIST(selectedApp.dateOfBirth, 'short') : 'N/A'} ({selectedApp.gender || 'Not specified'})
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-tertiary)' }}>Contact Email</div>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {selectedApp.email}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-tertiary)' }}>Contact Mobile</div>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {selectedApp.phoneNumber}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Residential Address */}
                <div style={{ marginBottom: 'var(--spacing-5)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-2)' }}>
                    Permanent / Residential Address
                  </h3>
                  <div style={{ backgroundColor: 'var(--surface-sunken)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', fontSize: '12px', color: 'var(--text-primary)' }}>
                    {selectedApp.residentialAddress ? (
                      <>
                        <div>{selectedApp.residentialAddress.line1}</div>
                        {selectedApp.residentialAddress.line2 && <div>{selectedApp.residentialAddress.line2}</div>}
                        <div>
                          {selectedApp.residentialAddress.city}, {selectedApp.residentialAddress.state} - {selectedApp.residentialAddress.postalCode}
                        </div>
                        <div>{selectedApp.residentialAddress.country || 'India'}</div>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>Address recorded via e-KYC validation.</span>
                    )}
                  </div>
                </div>

                {/* KYC Documents Attached */}
                <div style={{ marginBottom: 'var(--spacing-5)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-2)' }}>
                    Attached KYC Documents
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                    {selectedApp.kycDocuments && selectedApp.kycDocuments.length > 0 ? (
                      selectedApp.kycDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--surface-sunken)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={16} color="var(--brand-accent)" />
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {doc.documentType.replace(/_/g, ' ')}
                              </div>
                              <div style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                                ID Number: {doc.documentNumberMasked}
                              </div>
                            </div>
                          </div>
                          <Badge variant={doc.verificationStatus === 'VERIFIED' ? 'success' : 'neutral'}>
                            {doc.verificationStatus}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        No physical document uploads required for instant digital KYC.
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection reason if already rejected */}
                {selectedApp.rejectionReason && (
                  <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: 'var(--spacing-4)', fontSize: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-danger)' }}>Previous Officer Remarks:</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedApp.rejectionReason}</div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action Footer */}
            {selectedApp && selectedApp.status === 'SUBMITTED' && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-3)' }}>
                <Button
                  fullWidth
                  variant="primary"
                  onClick={() => handleOpenDecision(selectedApp, 'APPROVE')}
                >
                  Approve KYC Application
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => handleOpenDecision(selectedApp, 'REJECT')}
                  style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                >
                  Reject with Remarks
                </Button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 5. Decision Remarks Modal */}
      <Dialog.Root open={decisionModalOpen} onOpenChange={setDecisionModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 70,
              backdropFilter: 'blur(4px)',
            }}
          />
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
              {decisionType === 'APPROVE' ? 'Approve Customer KYC' : 'Reject KYC Application'}
            </h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 'var(--spacing-4)' }}>
              This action will be cryptographically recorded in the SHA-256 tamper-evident bank audit trail under your officer identity.
            </p>

            <div style={{ marginBottom: 'var(--spacing-4)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Officer Audit Remarks <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <Textarea
                rows={4}
                placeholder={
                  decisionType === 'APPROVE'
                    ? 'Enter verification confirmation details...'
                    : 'Specify reason for rejection (e.g. illegible address proof, name mismatch)...'
                }
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
              <Button
                variant="outline"
                onClick={() => setDecisionModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant={decisionType === 'APPROVE' ? 'primary' : 'danger'}
                onClick={handleConfirmDecision}
                isLoading={isSubmitting}
              >
                Confirm {decisionType === 'APPROVE' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
