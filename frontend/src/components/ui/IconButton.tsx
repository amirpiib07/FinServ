/**
 * FINServ Accessible Icon Button
 * Requires aria-label for non-text action triggers
 */

import React, { forwardRef } from 'react';
import { ButtonVariant, ButtonSize } from './Button';
import { Spinner } from './Spinner';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      'aria-label': ariaLabel,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled = false,
      icon,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const isActuallyDisabled = disabled || isLoading;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isActuallyDisabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        aria-label={ariaLabel}
        className={`btn btn-icon btn-${variant} btn-icon-${size} ${className}`.trim()}
        disabled={isActuallyDisabled}
        aria-busy={isLoading || undefined}
        onClick={handleClick}
        {...props}
        title={props.title ?? ariaLabel}
      >
        {isLoading ? <Spinner size={size === 'lg' ? 20 : 16} /> : icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
