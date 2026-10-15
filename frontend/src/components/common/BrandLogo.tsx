/**
 * FINServ Brand Logo Component
 * Strict Rule: "Official logo will be supplied in docs/brand/. Use the exact file,
 * never redraw it. Use a clearly named placeholder only until it arrives."
 *
 * Ingested official SVG assets:
 * - Full Logo: /finserv-logo.svg (docs/brand/finserv-logo.svg)
 * - Brand Mark: /finserv-mark.svg (docs/brand/finserv-mark.svg)
 */

import React from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'mark';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'full',
  showSubtitle = true,
  className = '',
}) => {
  const heightMap = {
    sm: 28,
    md: 36,
    lg: 48,
  };

  const markHeight = heightMap[size];

  if (variant === 'mark') {
    return (
      <div
        className={`brand-logo-mark ${className}`.trim()}
        data-testid="brand-logo-mark"
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        <img
          src="/finserv-mark.svg"
          alt="FINServ Mark"
          height={markHeight}
          width={markHeight}
          style={{ height: `${markHeight}px`, width: `${markHeight}px`, objectFit: 'contain' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`brand-logo ${className}`.trim()}
      data-testid="brand-logo"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
    >
      <img
        src="/finserv-logo.svg"
        alt="FINServ"
        height={markHeight}
        style={{ height: `${markHeight}px`, width: 'auto', display: 'block' }}
      />
      {showSubtitle && (
        <span
          style={{
            marginLeft: 'var(--spacing-1)',
            paddingLeft: 'var(--spacing-2)',
            borderLeft: '1px solid var(--border-subtle)',
            fontSize: size === 'sm' ? '10px' : '11px',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 'var(--font-weight-semibold)',
            lineHeight: 1,
            alignSelf: 'center',
          }}
        >
          Core Banking
        </span>
      )}
    </div>
  );
};

// Backwards-compatible alias for Phase 2 references
export const BrandLogoPlaceholder = BrandLogo;
