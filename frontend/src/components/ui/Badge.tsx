/**
 * FINServ Badge and StatusPill Components
 */

import React from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  withDot = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} {...props}>
      {withDot && <span className="badge-dot" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};

export interface StatusPillProps {
  status: 'ACTIVE' | 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'DORMANT' | 'FROZEN' | 'BLOCKED' | 'SUSPENDED';
  label?: string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, className = '' }) => {
  let variant: BadgeVariant;
  switch (status) {
    case 'ACTIVE':
    case 'VERIFIED':
    case 'APPROVED':
      variant = 'success';
      break;
    case 'PENDING':
    case 'IN_REVIEW':
      variant = 'warning';
      break;
    case 'REJECTED':
    case 'FROZEN':
    case 'BLOCKED':
    case 'SUSPENDED':
      variant = 'danger';
      break;
    case 'DORMANT':
    default:
      variant = 'neutral';
      break;
  }

  const displayText = label || status.replace(/_/g, ' ');

  return (
    <Badge variant={variant} withDot className={className}>
      {displayText}
    </Badge>
  );
};
