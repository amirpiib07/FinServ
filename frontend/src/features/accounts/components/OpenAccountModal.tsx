import React, { useState, useEffect } from 'react';
import type { AccountProduct, Branch, CreateAccountApplicationPayload } from '@/types/account';
import { accountService } from '../accountService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/hooks/useToast';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface OpenAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OpenAccountModal: React.FC<OpenAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [products, setProducts] = useState<AccountProduct[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [initialDeposit, setInitialDeposit] = useState<string>('1000.00');
  const [nickname, setNickname] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [loadingReferenceData, setLoadingReferenceData] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    void (async () => {
      try {
        const [prods, brs] = await Promise.all([
          accountService.getAccountProducts(),
          accountService.getBranches(),
        ]);
        if (!mounted) return;
        setProducts(prods);
        setBranches(brs);
        if (prods.length > 0) {
          setSelectedProductId((prev) => prev || prods[0]?.id || '');
        }
        if (brs.length > 0) {
          setSelectedBranchId((prev) => prev || brs[0]?.id || '');
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const appErr = err as { userMessage?: string };
        setErrorMessage(appErr.userMessage || 'Failed to load banking products and branches.');
      } finally {
        if (mounted) setLoadingReferenceData(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedBranchId) {
      setErrorMessage('Please select an account product and a branch.');
      return;
    }
    if (!acceptedTerms) {
      setErrorMessage('Please accept the banking terms & conditions.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const payload: CreateAccountApplicationPayload = {
      productId: selectedProductId,
      branchId: selectedBranchId,
      initialDepositAmount: initialDeposit ? parseFloat(initialDeposit) : 0,
      nickname: nickname.trim() || undefined,
      autoActivate: true,
    };

    try {
      const application = await accountService.applyForAccount(payload);
      toast.success(
        application.applicationStatus === 'APPROVED'
          ? 'Account opened and activated successfully!'
          : `Account application ${application.applicationNumber} submitted for verification.`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const appErr = err as { userMessage?: string; message?: string };
      setErrorMessage(appErr.userMessage || appErr.message || 'Failed to submit account application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !submitting) onClose();
      }}
      title="Open New Bank Account"
      description="Select from our high-yield savings and commercial accounts with instant 14-digit ISO 7064 account opening."
      maxWidth="680px"
    >
      {loadingReferenceData ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-8)' }}>
          <Spinner size={32} />
          <p style={{ marginTop: 'var(--spacing-3)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Loading account products and branch directory...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
          {errorMessage && (
            <div
              role="alert"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--color-error-500)',
                color: 'var(--color-error-400)',
                padding: 'var(--spacing-3) var(--spacing-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Product Comparison Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--spacing-2)', color: 'var(--text-primary)' }}>
              1. Choose Account Product
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--spacing-3)',
              }}
            >
              {products.map((p) => {
                const isSelected = p.id === selectedProductId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    style={{
                      cursor: 'pointer',
                      padding: 'var(--spacing-4)',
                      borderRadius: 'var(--radius-lg)',
                      border: `2px solid ${isSelected ? 'var(--color-primary-500)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--color-surface)',
                      transition: 'border-color 0.15s, background-color 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-1)' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                        {p.productName}
                      </span>
                      {isSelected && <CheckCircle2 size={16} color="var(--color-primary-500)" />}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-2)' }}>
                      Code: {p.productCode} • {p.productType}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--color-success-400)', fontWeight: 500 }}>
                        {p.interestRatePercentage}% p.a. interest
                      </span>
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        Min Balance: <AmountDisplay amount={p.minBalance} size="sm" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branch Selector */}
          <div>
            <label
              htmlFor="branchSelect"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--spacing-2)', color: 'var(--text-primary)' }}
            >
              2. Select Bank Branch
            </label>
            <Select
              id="branchSelect"
              value={selectedBranchId}
              onValueChange={(val) => setSelectedBranchId(val)}
              options={branches.map((b) => ({
                value: b.id,
                label: `${b.branchName} (${b.branchCode}) - IFSC: ${b.ifscCode}`,
              }))}
            />
          </div>

          {/* Initial Deposit & Nickname Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
            <div>
              <label
                htmlFor="initialDepositInput"
                style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--spacing-1)', color: 'var(--text-primary)' }}
              >
                Initial Deposit Amount (₹)
              </label>
              <Input
                id="initialDepositInput"
                type="number"
                step="0.01"
                min="0"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(e.target.value)}
                placeholder="e.g. 1000.00"
              />
              {selectedProduct && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                  Recommended min: ₹{selectedProduct.minBalance}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="nicknameInput"
                style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--spacing-1)', color: 'var(--text-primary)' }}
              >
                Account Nickname (Optional)
              </label>
              <Input
                id="nicknameInput"
                type="text"
                maxLength={60}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Household Bills, Rainy Day"
              />
            </div>
          </div>

          {/* Terms Agreement */}
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <Checkbox
              id="termsCheckbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              label="I agree to the FINServ Account Terms, Schedule of Charges, and understand that standard Reserve Bank of India retail banking regulations apply."
            />
          </div>

          {/* Modal Footer / Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-2)' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              disabled={!acceptedTerms}
              leftIcon={<Sparkles size={16} />}
            >
              Open Account Now
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
