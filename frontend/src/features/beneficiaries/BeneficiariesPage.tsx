import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Beneficiary } from '@/types/beneficiary';
import { beneficiaryService } from './beneficiaryService';
import { BeneficiaryCard } from './components/BeneficiaryCard';
import { AddBeneficiaryModal } from './components/AddBeneficiaryModal';
import { VerifyBeneficiaryModal } from './components/VerifyBeneficiaryModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/hooks/useToast';
import {
  UserPlus,
  Users,
  Search,
} from 'lucide-react';

type FilterTab = 'ALL' | 'INTRA_BANK' | 'INTER_BANK' | 'PENDING';

export const BeneficiariesPage: React.FC = () => {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [selectedForVerify, setSelectedForVerify] = useState<Beneficiary | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Beneficiary | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const toast = useToast();

  const loadBeneficiaries = useCallback(async () => {
    try {
      const data = await beneficiaryService.getBeneficiaries();
      setBeneficiaries(data);
    } catch (err: unknown) {
      const appErr = err as { userMessage?: string };
      setError(appErr.userMessage || 'Failed to load beneficiaries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const data = await beneficiaryService.getBeneficiaries();
        if (!mounted) return;
        setBeneficiaries(data);
      } catch (err: unknown) {
        if (!mounted) return;
        const appErr = err as { userMessage?: string };
        setError(appErr.userMessage || 'Failed to load beneficiaries.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Filtered beneficiaries
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) => {
      // Tab filter
      if (activeTab === 'INTRA_BANK' && b.payeeType !== 'INTRA_BANK') return false;
      if (activeTab === 'INTER_BANK' && b.payeeType !== 'INTER_BANK') return false;
      if (activeTab === 'PENDING' && b.verificationStatus === 'VERIFIED') return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = b.beneficiaryName.toLowerCase().includes(q);
        const matchesNick = b.nickname.toLowerCase().includes(q);
        const matchesAcc = b.accountNumber.toLowerCase().includes(q);
        const matchesIfsc = b.ifscCode.toLowerCase().includes(q);
        const matchesBank = b.bankName.toLowerCase().includes(q);
        return matchesName || matchesNick || matchesAcc || matchesIfsc || matchesBank;
      }

      return true;
    });
  }, [beneficiaries, activeTab, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!selectedForDelete) return;

    setDeleting(true);
    try {
      await beneficiaryService.deleteBeneficiary(selectedForDelete.id);
      toast.success(`Beneficiary "${selectedForDelete.nickname}" deleted.`);
      setBeneficiaries((prev) => prev.filter((b) => b.id !== selectedForDelete.id));
      setSelectedForDelete(null);
    } catch (err: unknown) {
      const appErr = err as { userMessage?: string };
      toast.error(appErr.userMessage || 'Failed to remove beneficiary.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="beneficiaries-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* Header */}
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
            Beneficiary Management
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Manage intra-bank FinServ payees and external NEFT / RTGS accounts with cooling-off safeguards.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setAddModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
        >
          <UserPlus size={18} />
          Add Beneficiary
        </Button>
      </div>

      {/* Search and Category Filters */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-4)',
          backgroundColor: '#FFFFFF',
          padding: 'var(--spacing-4) var(--spacing-5)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 320px', position: 'relative' }}>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by payee name, nickname, IFSC, or account..."
            prefixIcon={<Search size={16} color="var(--text-tertiary)" />}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
          {(
            [
              { id: 'ALL', label: 'All Payees' },
              { id: 'INTRA_BANK', label: 'Within FinServ' },
              { id: 'INTER_BANK', label: 'Other Banks' },
              { id: 'PENDING', label: 'Pending OTP' },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isActive ? '#0B2545' : 'var(--surface-subtle)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? '#0B2545' : 'var(--border-default)'}`,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(11, 37, 69, 0.2)' : 'none',
                  transition: 'all var(--duration-fast) var(--ease-default)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--spacing-5)',
          }}
        >
          <Skeleton style={{ height: '220px', borderRadius: 'var(--radius-xl)' }} />
          <Skeleton style={{ height: '220px', borderRadius: 'var(--radius-xl)' }} />
          <Skeleton style={{ height: '220px', borderRadius: 'var(--radius-xl)' }} />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load beneficiaries"
          message={error}
          onRetry={loadBeneficiaries}
        />
      ) : filteredBeneficiaries.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title={searchQuery ? 'No matching beneficiaries found' : 'No beneficiaries added yet'}
          description={
            searchQuery
              ? 'Try adjusting your search criteria or filter tabs.'
              : 'Add your first payee to initiate instant transfers across FinServ and other Indian banks.'
          }
          action={
            !searchQuery ? (
              <Button
                variant="primary"
                onClick={() => setAddModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
              >
                <UserPlus size={16} />
                Add Your First Beneficiary
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 'var(--spacing-5)',
          }}
        >
          {filteredBeneficiaries.map((b) => (
            <BeneficiaryCard
              key={b.id}
              beneficiary={b}
              onVerify={(beneficiary) => setSelectedForVerify(beneficiary)}
              onDelete={(beneficiary) => setSelectedForDelete(beneficiary)}
            />
          ))}
        </div>
      )}

      {/* Add Beneficiary Modal */}
      <AddBeneficiaryModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={(newBeneficiary) => {
          setBeneficiaries((prev) => [newBeneficiary, ...prev]);
        }}
      />

      {/* Direct Verify Modal */}
      <VerifyBeneficiaryModal
        beneficiary={selectedForVerify}
        isOpen={!!selectedForVerify}
        onClose={() => setSelectedForVerify(null)}
        onSuccess={(verified) => {
          setBeneficiaries((prev) =>
            prev.map((b) => (b.id === verified.id ? verified : b))
          );
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!selectedForDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setSelectedForDelete(null);
        }}
        title="Remove Beneficiary"
        description={`Are you sure you want to deactivate "${selectedForDelete?.nickname}" (${selectedForDelete?.accountNumber.slice(-4)})? Any recurring scheduled transfers will be stopped.`}
        confirmLabel="Deactivate Payee"
        cancelLabel="Keep Payee"
        confirmVariant="danger"
        isLoading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
