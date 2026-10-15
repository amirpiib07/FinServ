/**
 * FINServ Toast Container Component
 * Renders active toast notifications with accessible dismiss buttons
 */

import React from 'react';
import { useToast, ToastItem } from '@/hooks/useToast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastIcon: React.FC<{ type: ToastItem['type'] }> = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 size={18} color="var(--color-success)" aria-hidden="true" />;
    case 'error':
      return <AlertCircle size={18} color="var(--color-danger)" aria-hidden="true" />;
    case 'warning':
      return <AlertTriangle size={18} color="var(--color-warning)" aria-hidden="true" />;
    case 'info':
    default:
      return <Info size={18} color="var(--color-info)" aria-hidden="true" />;
  }
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-viewport"
      role="region"
      aria-label="Notification alerts"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type}`}
          role="status"
        >
          <ToastIcon type={toast.type} />
          <div className="toast-content">
            {toast.title && <div className="toast-title">{toast.title}</div>}
            <div className="toast-message">{toast.message}</div>
          </div>
          <button
            type="button"
            className="btn-icon btn-ghost"
            style={{ width: 24, height: 24 }}
            aria-label="Dismiss notification"
            onClick={() => dismissToast(toast.id)}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};
