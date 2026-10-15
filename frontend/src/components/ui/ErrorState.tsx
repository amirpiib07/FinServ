/**
 * FINServ ErrorState Component
 * Displays user-friendly error details and actionable correlation ID for support
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  correlationId?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected banking error occurred. Please try again or contact customer care.',
  correlationId,
  onRetry,
  className = '',
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyCorrelationId = () => {
    if (!correlationId) return;
    navigator.clipboard?.writeText(correlationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`state-box error-state ${className}`.trim()} role="alert">
      <div className="state-icon-wrapper" aria-hidden="true">
        <AlertTriangle size={28} />
      </div>
      <h4 className="state-title">{title}</h4>
      <p className="state-description">{message}</p>

      {correlationId && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            backgroundColor: 'var(--surface-sunken)',
            padding: 'var(--spacing-1) var(--spacing-3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-xs)',
            fontFamily: 'var(--font-family-mono)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          <span>Ref: {correlationId}</span>
          <button
            type="button"
            className="btn-icon btn-ghost"
            style={{ width: 22, height: 22 }}
            aria-label="Copy reference ID"
            onClick={copyCorrelationId}
          >
            {copied ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
          </button>
        </div>
      )}

      {onRetry && (
        <div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={onRetry}
          >
            Retry Action
          </Button>
        </div>
      )}
    </div>
  );
};
