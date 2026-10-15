/**
 * FINServ Brand Logo Component
 * Strict Rule: "Official logo will be supplied in docs/brand/. Use the exact file,
 * never redraw it. Use a clearly named placeholder only until it arrives."
 * This placeholder will be replaced in Phase 3 once official assets are ingested.
 */

import React from 'react';
import { Landmark } from 'lucide-react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogoPlaceholder: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizeMap = { sm: 18, md: 24, lg: 32 };
  const titleSizeMap = {
    sm: 'var(--font-size-base)',
    md: 'var(--font-size-lg)',
    lg: 'var(--font-size-2xl)',
  };

  return (
    <div
      className={`brand-logo-placeholder ${className}`.trim()}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-3)' }}
      data-testid="brand-logo-placeholder"
      title="FINServ (Official Brand Logo Ingestion in Phase 3)"
    >
      <div
        style={{
          width: iconSizeMap[size] + 14,
          height: iconSizeMap[size] + 14,
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--brand-primary)',
          color: 'var(--brand-contrast)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <Landmark size={iconSizeMap[size]} strokeWidth={2.2} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: 'var(--font-family-sans)',
            fontSize: titleSizeMap[size],
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          FIN<span style={{ color: 'var(--brand-primary)' }}>Serv</span>
        </span>
        {showSubtitle && (
          <span
            style={{
              fontSize: '10px',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            Core Banking
          </span>
        )}
      </div>
    </div>
  );
};
