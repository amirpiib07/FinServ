/**
 * FINServ Button Component
 * - Accessible, token-driven
 * - Variants: primary, secondary, outline, ghost, danger
 * - Loading state prevents double activation (aria-busy, disabled)
 */

import React, { forwardRef } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
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

    const variantClass = `btn-${variant}`;
    const sizeClass = `btn-${size}`;
    const fullClass = fullWidth ? 'btn-full' : '';

    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        className={`btn ${variantClass} ${sizeClass} ${fullClass} ${className}`.trim()}
        disabled={isActuallyDisabled}
        aria-busy={isLoading || undefined}
        aria-disabled={isActuallyDisabled || undefined}
        onClick={handleClick}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size={size === 'lg' ? 18 : 14} />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="btn-icon-prefix" aria-hidden="true">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="btn-icon-suffix" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
