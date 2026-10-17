import React, { useState } from 'react';
import type { BankAccount } from '@/types/account';
import { accountService } from '../accountService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';

interface AccountControlsModalProps {
  account: BankAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: BankAccount) => void;
}

export const AccountControlsModal: React.FC<AccountControlsModalProps> = ({
  account,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [prevAccount, setPrevAccount] = useState<BankAccount | null>(account);
  const [nickname, setNickname] = useState<string>(account?.nickname || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  if (account !== prevAccount) {
    setPrevAccount(account);
    setNickname(account?.nickname || '');
    setError(null);
  }

  if (!account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updated = await accountService.updateAccountControls(account.id, {
        nickname: nickname.trim() || undefined,
      });
      toast.success('Account preferences updated successfully');
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const appErr = err as { userMessage?: string; message?: string };
      setError(appErr.userMessage || appErr.message || 'Failed to update account preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
      title="Account Preferences"
      description={`Manage customer preferences for account ending in ${account.accountNumber.slice(-4)}.`}
      maxWidth="480px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-error-500)',
              color: 'var(--color-error-400)',
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="accNicknameInput"
            style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--spacing-1)', color: 'var(--text-primary)' }}
          >
            Account Nickname
          </label>
          <Input
            id="accNicknameInput"
            type="text"
            maxLength={60}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Primary Salary, Emergency Fund"
          />
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
            Nicknames help you distinguish accounts in quick transfers and statements.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-2)' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={saving}
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </Modal>
  );
};
