/**
 * Route-level loading fallback component
 */

import React from 'react';
import { Spinner } from '@/components/ui/Spinner';

export const LoadingFallback: React.FC<{ message?: string }> = ({
  message = 'Loading banking interface...',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-16) var(--spacing-4)',
        gap: 'var(--spacing-4)',
        color: 'var(--text-secondary)',
      }}
    >
      <Spinner size={32} style={{ color: 'var(--brand-primary)' }} />
      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
        {message}
      </span>
    </div>
  );
};
