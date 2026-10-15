/**
 * FINServ Accessible Breadcrumbs Component
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`breadcrumbs-nav ${className}`.trim()}>
      <ol style={{ display: 'flex', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="breadcrumb-item">
              {isLast || !item.href ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="breadcrumb-link">
                  {item.label}
                </Link>
              )}

              {!isLast && (
                <ChevronRight
                  size={14}
                  aria-hidden="true"
                  style={{ opacity: 0.4, margin: '0 var(--spacing-1)' }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
