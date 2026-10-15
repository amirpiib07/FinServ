/**
 * FINServ Phase Placeholder Page
 * Strictly adheres to project rule: "Real functionality only. No fake balances,
 * references, KYC approvals, or payment success. Pages are placeholders only,
 * showing a clear Coming in Phase X empty state."
 */

import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Clock } from 'lucide-react';

export interface PlaceholderPageProps {
  title: string;
  phaseNumber: number;
  phaseName: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  phaseNumber,
  phaseName,
  description,
}) => {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 'var(--spacing-8)' }}>
      <EmptyState
        icon={<Clock size={32} color="var(--brand-primary)" />}
        title={title}
        description={description}
        action={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <Badge variant="brand" withDot>
              Scheduled for Phase {phaseNumber}: {phaseName}
            </Badge>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', maxWidth: 460 }}>
              Per FINServ engineering guidelines, banking functionality and account data will be wired only after secure authentication and backend ledger verification.
            </span>
          </div>
        }
      />
    </div>
  );
};
