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
import { SuccessAnimation } from '@/components/common/SuccessAnimation';
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
  const [initialDeposit, setInitialDeposit] = useState<string>('5000.00');
  const [nickname, setNickname] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [loadingReferenceData, setLoadingReferenceData] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    applicationNumber: string;
    status: string;
  } | null>(null);

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

    const depositAmount = initialDeposit && Number(initialDeposit) > 0 ? initialDeposit.trim() : '5000.00';
    const payload: CreateAccountApplicationPayload = {
      productId: selectedProductId,
      branchId: selectedBranchId,
      initialDepositAmount: depositAmount,
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
      setSuccessData({
        applicationNumber: application.applicationNumber,
        status: application.applicationStatus,
      });
      onSuccess();
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
        if (!open && !submitting) {
          setSuccessData(null);
          onClose();
        }
      }}
      title="Open New Bank Account"
      description="Select from our high-yield savings and commercial accounts with instant 14-digit ISO 7064 account opening."
      maxWidth="680px"
    >
      {successData ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-6) var(--spacing-4)' }}>
          <SuccessAnimation
            message="Account Opened Successfully"
            subMessage={
              successData.status === 'APPROVED'
                ? `Account application ${successData.applicationNumber} has been approved and activated with instant 14-digit ISO 7064 numbering.`
                : `Account application ${successData.applicationNumber} has been submitted for verification.`
            }
            size={88}
          />
          <div style={{ marginTop: 'var(--spacing-6)' }}>
            <Button
              variant="primary"
              onClick={() => {
                setSuccessData(null);
                onClose();
              }}
              style={{ minWidth: '160px' }}
            >
              View Accounts
            </Button>
          </div>
        </div>
      ) : loadingReferenceData ? (
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
              1. Choose Account Product Tier
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 'var(--spacing-4)',
              }}
            >
              {products.map((p) => {
                const isSelected = p.id === selectedProductId;
                const isSavings = p.productType === 'SAVINGS';
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    style={{
                      cursor: 'pointer',
                      padding: 'var(--spacing-5)',
                      borderRadius: 'var(--radius-xl)',
                      border: isSelected
                        ? '2px solid var(--brand-accent)'
                        : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected
                        ? 'rgba(46, 196, 182, 0.05)'
                        : 'var(--surface-card)',
                      boxShadow: isSelected
                        ? '0 0 0 1px var(--brand-accent), 0 8px 20px -4px rgba(46, 196, 182, 0.2)'
                        : 'var(--shadow-card)',
                      transition: 'all var(--duration-fast) var(--ease-default)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: isSavings ? 'rgba(5, 150, 105, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                            color: isSavings ? '#059669' : '#2563EB',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {p.productType}
                        </span>
                        {isSelected && <CheckCircle2 size={18} color="var(--brand-accent)" />}
                      </div>

                      <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 'var(--spacing-1)' }}>
                        {p.productName}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-3)' }}>
                        Code: {p.productCode}
                      </div>

                      {/* Pricing / Rates ribbon */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 'var(--spacing-2)',
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          backgroundColor: 'var(--surface-subtle)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: 'var(--spacing-3)',
                        }}
                      >
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                          {p.interestRatePercentage}%
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                          p.a. interest
                        </span>
                        <span
                          style={{
                            marginLeft: 'auto',
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          Min: <AmountDisplay amount={p.minBalance} size="sm" />
                        </span>
                      </div>

                      {/* Key Perks Checklist */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={13} color="#059669" />
                          <span>Instant 14-digit ISO 7064 account</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={13} color="#059669" />
                          <span>Zero fee NEFT / RTGS transfers</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={13} color="#059669" />
                          <span>24x7 Core-banking lock & controls</span>
                        </div>
                      </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-1)' }}>
                <label
                  htmlFor="initialDepositInput"
                  style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  Initial Deposit Amount (₹)
                </label>
                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                  ₹5,000 Welcome Balance
                </span>
              </div>
              <Input
                id="initialDepositInput"
                type="number"
                step="0.01"
                min="0"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(e.target.value)}
                placeholder="5000.00"
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {['5000.00', '10000.00', '25000.00', '50000.00'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInitialDeposit(amt)}
                    style={{
                      background: initialDeposit === amt ? 'var(--brand-accent, #2EC4B6)' : 'rgba(255,255,255,0.08)',
                      color: initialDeposit === amt ? '#FFFFFF' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: initialDeposit === amt ? 700 : 500,
                    }}
                  >
                    ₹{Number(amt).toLocaleString('en-IN')}{amt === '5000.00' ? ' (Default)' : ''}
                  </button>
                ))}
              </div>
              {selectedProduct && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                  Min balance requirement: ₹{selectedProduct.minBalance} (covered by initial ₹5,000 credit)
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
          <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
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
