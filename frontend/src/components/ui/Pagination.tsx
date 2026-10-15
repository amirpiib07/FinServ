/**
 * FINServ Accessible Pagination Component
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav className={`pagination-root ${className}`.trim()} aria-label="Pagination Navigation">
      <button
        type="button"
        className="pagination-item"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {pages.map((p, idx) => {
        if (typeof p === 'string') {
          return (
            <span key={`ellipsis-${idx}`} className="pagination-item" aria-hidden="true">
              …
            </span>
          );
        }

        const isCurrent = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            className="pagination-item"
            aria-current={isCurrent ? 'page' : undefined}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        className="pagination-item"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
};
