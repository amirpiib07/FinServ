/**
 * FINServ Super Admin Branch & Staff Provisioning (`/admin/branches-staff`)
 * - Super Admin exclusive screen
 * - Branch creation with strict IFSC code validation (FINS0XXXXXX)
 * - Bank Officer & Admin user onboarding and branch assignment
 */

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  UserPlus,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { adminService } from './adminService';
import type { BranchDto, StaffDto, CreateBranchRequest, CreateStaffRequest } from '@/types/admin';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

export const BranchesStaffPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BRANCHES' | 'STAFF'>('BRANCHES');

  // Branches State
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState<CreateBranchRequest>({
    branchCode: '',
    branchName: '',
    ifscCode: '',
    micrCode: '',
    addressLine1: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400051',
    phone: '+912211223344',
  });

  // Staff State
  const [staffList, setStaffList] = useState<StaffDto[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState<CreateStaffRequest>({
    username: '',
    email: '',
    phoneNumber: '+91',
    password: '',
    role: 'EMPLOYEE',
    branchId: '',
    department: 'Operations',
    designation: 'Credit & Verification Officer',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [branchRefreshKey, setBranchRefreshKey] = useState(0);
  const [staffRefreshKey, setStaffRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    adminService
      .getBranches()
      .then((data) => {
        if (!ignore) {
          setBranches(data);
          setBranchesLoading(false);
          if (data[0] && !staffForm.branchId) {
            setStaffForm((prev) => ({ ...prev, branchId: data[0]?.id || '' }));
          }
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = (err as { userMessage?: string })?.userMessage || 'Failed to load branches';
          setFeedback({ message: msg, type: 'error' });
          setBranchesLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [branchRefreshKey, staffForm.branchId]);

  useEffect(() => {
    let ignore = false;
    if (activeTab === 'STAFF') {
      adminService
        .getStaff()
        .then((data) => {
          if (!ignore) {
            setStaffList(data);
            setStaffLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (!ignore) {
            const msg = (err as { userMessage?: string })?.userMessage || 'Failed to load staff members';
            setFeedback({ message: msg, type: 'error' });
            setStaffLoading(false);
          }
        });
    }
    return () => {
      ignore = true;
    };
  }, [activeTab, staffRefreshKey]);

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.branchCode || !branchForm.branchName || !branchForm.ifscCode) {
      alert('Branch Code, Name, and IFSC are mandatory.');
      return;
    }

    if (!/^FINS0[0-9A-Z]{6}$/.test(branchForm.ifscCode)) {
      alert('IFSC Code must follow RBI pattern FINS0XXXXXX (e.g., FINS0100201).');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await adminService.createBranch(branchForm);
      setFeedback({
        message: `Branch ${created.branchName} (${created.ifscCode}) created successfully!`,
        type: 'success',
      });
      setBranchModalOpen(false);
      setBranchesLoading(true);
      setBranchRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = (err as { userMessage?: string; message?: string })?.userMessage ||
        (err as Error)?.message ||
        'Failed to create branch';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.username || !staffForm.email || !staffForm.password || !staffForm.branchId) {
      alert('Username, Email, Password, and Branch are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await adminService.createStaff(staffForm);
      setFeedback({
        message: `Bank Officer ${created.username} provisioned with role ${created.role}!`,
        type: 'success',
      });
      setStaffModalOpen(false);
      setStaffLoading(true);
      setStaffRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = (err as { userMessage?: string; message?: string })?.userMessage ||
        (err as Error)?.message ||
        'Failed to onboard staff member';
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
              Branch Network & Staff Administration
            </h1>
            <Badge variant="neutral" style={{ borderColor: '#D4AF37', color: '#D4AF37' }}>
              <Sparkles size={12} style={{ marginRight: '4px' }} />
              Super Admin Exclusive
            </Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Provision core-banking branches with verified IFSC codes and onboard bank officers into the security hierarchy.
          </p>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-sunken)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('BRANCHES')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'BRANCHES' ? 600 : 500,
              backgroundColor: activeTab === 'BRANCHES' ? 'var(--surface-card)' : 'transparent',
              color: activeTab === 'BRANCHES' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              boxShadow: activeTab === 'BRANCHES' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Branch Directory ({branches.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('STAFF')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'STAFF' ? 600 : 500,
              backgroundColor: activeTab === 'STAFF' ? 'var(--surface-card)' : 'transparent',
              color: activeTab === 'STAFF' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              boxShadow: activeTab === 'STAFF' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Bank Officers & Admins ({staffList.length})
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

      {/* 2. TAB 1: BRANCHES */}
      {activeTab === 'BRANCHES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const nextCode = String(1000 + branches.length + 1);
                setBranchForm({
                  branchCode: nextCode,
                  branchName: `FinServ Branch ${nextCode}`,
                  ifscCode: `FINS0${nextCode}01`,
                  micrCode: `400${nextCode}`,
                  addressLine1: 'Financial District, Level 4',
                  city: 'Bengaluru',
                  state: 'Karnataka',
                  postalCode: '560001',
                  phone: '+918011223344',
                });
                setBranchModalOpen(true);
              }}
              leftIcon={<Plus size={16} />}
            >
              Add New Bank Branch
            </Button>
          </div>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-sunken)' }}>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Branch Code</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Branch Name</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>IFSC Code</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Location</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {branchesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td colSpan={5} style={{ padding: '16px' }}><Skeleton width="100%" height="24px" /></td>
                      </tr>
                    ))
                  ) : (
                    branches.map((b) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {b.branchCode}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {b.branchName}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-mono)', color: 'var(--brand-accent)' }}>
                          {b.ifscCode}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {b.city}, {b.state}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant={b.status === 'ACTIVE' ? 'success' : 'neutral'}>{b.status}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 3. TAB 2: STAFF */}
      {activeTab === 'STAFF' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const rnd = Math.floor(1000 + Math.random() * 9000);
                setStaffForm({
                  username: `officer_${rnd}`,
                  email: `officer_${rnd}@finserv.local`,
                  phoneNumber: '+9198765' + rnd,
                  password: 'OfficerSecureP@ss1!',
                  role: 'EMPLOYEE',
                  branchId: branches[0]?.id || '',
                  department: 'Risk Operations',
                  designation: 'Senior KYC Officer',
                });
                setStaffModalOpen(true);
              }}
              leftIcon={<UserPlus size={16} />}
            >
              Provision Bank Officer / Admin
            </Button>
          </div>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-sunken)' }}>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Username</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email & Contact</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Security Role</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Branch & Department</th>
                    <th scope="col" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Designation</th>
                  </tr>
                </thead>
                <tbody>
                  {staffLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td colSpan={5} style={{ padding: '16px' }}><Skeleton width="100%" height="24px" /></td>
                      </tr>
                    ))
                  ) : staffList.length > 0 ? (
                    staffList.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {s.username}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ color: 'var(--text-primary)' }}>{s.email}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{s.phoneNumber || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant={s.role.includes('ADMIN') ? 'warning' : 'neutral'}>{s.role}</Badge>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ color: 'var(--text-primary)' }}>{s.branchName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{s.department || 'Operations'}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {s.designation || 'Bank Officer'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        No provisioned officers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Create Branch */}
      <Dialog.Root open={branchModalOpen} onOpenChange={setBranchModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 70, backdropFilter: 'blur(4px)' }} />
          <Dialog.Content
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(500px, 92vw)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-6)',
              zIndex: 71,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-4)' }}>
              Create New Bank Branch
            </h2>

            <form onSubmit={handleBranchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Branch Code (4 Digits)
                </label>
                <Input
                  value={branchForm.branchCode}
                  onChange={(e) => setBranchForm({ ...branchForm, branchCode: e.target.value })}
                  placeholder="e.g. 1002"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Branch Name
                </label>
                <Input
                  value={branchForm.branchName}
                  onChange={(e) => setBranchForm({ ...branchForm, branchName: e.target.value })}
                  placeholder="e.g. FinServ Bengaluru Central"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  IFSC Code (FINS0XXXXXX)
                </label>
                <Input
                  value={branchForm.ifscCode}
                  onChange={(e) => setBranchForm({ ...branchForm, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. FINS0100201"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>City</label>
                  <Input value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>State</label>
                  <Input value={branchForm.state} onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                <Button variant="outline" type="button" onClick={() => setBranchModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" isLoading={isSubmitting}>Provision Branch</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal: Provision Staff */}
      <Dialog.Root open={staffModalOpen} onOpenChange={setStaffModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 70, backdropFilter: 'blur(4px)' }} />
          <Dialog.Content
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(500px, 92vw)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-6)',
              zIndex: 71,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-4)' }}>
              Provision Bank Officer / Admin
            </h2>

            <form onSubmit={handleStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Username</label>
                <Input value={staffForm.username} onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Email</label>
                  <Input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Phone</label>
                  <Input value={staffForm.phoneNumber} onChange={(e) => setStaffForm({ ...staffForm, phoneNumber: e.target.value })} required />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Temporary Password</label>
                <Input type="password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Security Role</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as 'EMPLOYEE' | 'ADMIN' })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--surface-sunken)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="EMPLOYEE">EMPLOYEE (Bank Officer)</option>
                    <option value="ADMIN">ADMIN (Full Admin)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Assigned Branch</label>
                  <select
                    value={staffForm.branchId}
                    onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--surface-sunken)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branchName} ({b.branchCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                <Button variant="outline" type="button" onClick={() => setStaffModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" isLoading={isSubmitting}>Provision User</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
