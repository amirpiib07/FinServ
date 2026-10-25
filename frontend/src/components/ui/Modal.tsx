/**
 * FINServ Modal Component
 * Built on accessible Radix UI Dialog primitive
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number | string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth,
  className = '',
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className={`dialog-content ${className}`.trim()}
          style={maxWidth ? { maxWidth } : undefined}
          aria-describedby={description ? undefined : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
            <Dialog.Title className="dialog-title">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="btn-icon btn-ghost"
                aria-label="Close dialog"
                title="Close dialog"
                style={{ width: 32, height: 32 }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          {description && (
            <Dialog.Description className="dialog-description">
              {description}
            </Dialog.Description>
          )}

          <div className="dialog-body">{children}</div>

          {footer && <div className="dialog-actions">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
