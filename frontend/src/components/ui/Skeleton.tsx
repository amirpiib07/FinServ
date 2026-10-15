/**
 * FINServ Shimmer Skeleton Component
 */

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variantClass =
    variant === 'circular'
      ? 'skeleton-circle'
      : variant === 'text'
      ? 'skeleton-text'
      : '';

  return (
    <div
      className={`skeleton ${variantClass} ${className}`.trim()}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
};
