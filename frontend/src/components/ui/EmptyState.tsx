/**
 * FINServ EmptyState Component
 */

import React from 'react';
import { FolderOpen } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`state-box ${className}`.trim()}>
      <div className="state-icon-wrapper" aria-hidden="true">
        {icon || <FolderOpen size={28} />}
      </div>
      <h4 className="state-title">{title}</h4>
      {description && <p className="state-description">{description}</p>}
      {action && <div className="state-action">{action}</div>}
    </div>
  );
};
