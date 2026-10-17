/**
 * FINServ Banking Feature In-Rollout Screen
 * Uses 100% authentic banking language.
 */

import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Clock } from 'lucide-react';

export interface PlaceholderPageProps {
  title: string;
  description: string;
  phaseNumber?: number;
  phaseName?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
}) => {
  return (
    <div className="page-transition-enter" style={{ maxWidth: 800, margin: '0 auto', paddingTop: 'var(--spacing-8)' }}>
      <EmptyState
        icon={<Clock size={32} color="var(--brand-accent)" />}
        title={title}
        description={description}
        action={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <Badge variant="brand" withDot>
              Scheduled Core Banking Service
            </Badge>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', maxWidth: 460, textAlign: 'center' }}>
              This banking service will become active following regulatory clearing house integration and multi-factor transaction limits.
            </span>
          </div>
        }
      />
    </div>
  );
};
