/**
 * FINServ Backend Connectivity & Health Widget
 * Displays live Spring Boot Actuator probe status
 */

import React from 'react';
import { useBackendHealth } from './useBackendHealth';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { RefreshCw, Server, AlertCircle } from 'lucide-react';
import { formatTimeIST } from '@/lib/dates';

export const HealthWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useBackendHealth();

  if (compact) {
    if (isLoading) {
      return (
        <Badge variant="neutral">
          <Spinner size={12} />
          <span>Connecting...</span>
        </Badge>
      );
    }

    if (isError || !data || data.status !== 'UP') {
      return (
        <button
          type="button"
          onClick={() => void refetch()}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          title="Backend is currently offline or still starting. Click to recheck."
          aria-label="Backend offline. Click to recheck."
        >
          <Badge variant="danger" withDot>
            Backend Offline
          </Badge>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => void refetch()}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        title="Backend is online (UP). Click to recheck."
        aria-label="Backend online. Click to recheck."
      >
        <Badge variant="success" withDot>
          Backend UP
        </Badge>
      </button>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-3)',
        padding: 'var(--spacing-4)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--surface-card)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <Server size={18} color="var(--brand-primary)" />
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
            Backend API Health Probe
          </span>
        </div>

        <button
          type="button"
          className="btn-icon btn-ghost"
          style={{ width: 28, height: 28 }}
          aria-label="Refresh backend health"
          title="Refresh backend health"
          onClick={() => refetch()}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Target: <code>localhost:8080/actuator/health</code>
        </span>

        {isLoading ? (
          <Badge variant="neutral">
            <Spinner size={12} />
            <span>Probing...</span>
          </Badge>
        ) : isError ? (
          <Badge variant="danger" withDot>
            Connection Failed
          </Badge>
        ) : data?.status === 'UP' ? (
          <Badge variant="success" withDot>
            System Online (UP)
          </Badge>
        ) : (
          <Badge variant="warning" withDot>
            Status: {data?.status || 'UNKNOWN'}
          </Badge>
        )}
      </div>

      {isError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            padding: 'var(--spacing-2)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-danger-subtle)',
            color: 'var(--color-danger-text)',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          <AlertCircle size={14} />
          <span>
            {error instanceof Error ? error.message : 'Unable to reach backend service.'}
          </span>
        </div>
      )}

      {dataUpdatedAt > 0 && (
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            textAlign: 'right',
          }}
        >
          Last checked: {formatTimeIST(dataUpdatedAt, true)}
        </div>
      )}
    </div>
  );
};
