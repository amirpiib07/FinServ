/**
 * FINServ Input Component
 */

import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      prefixIcon,
      suffixIcon,
      hasError = false,
      className = '',
      type = 'text',
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref
  ) => {
    const isInvalid = ariaInvalid || hasError;
    const prefixClass = prefixIcon ? 'input-has-prefix' : '';
    const suffixClass = suffixIcon ? 'input-has-suffix' : '';

    return (
      <div className="input-wrapper">
        {prefixIcon && <span className="input-prefix" aria-hidden="true">{prefixIcon}</span>}
        <input
          ref={ref}
          type={type}
          className={`input-control ${prefixClass} ${suffixClass} ${className}`.trim()}
          aria-invalid={isInvalid ? true : undefined}
          {...props}
        />
        {suffixIcon && <span className="input-suffix" aria-hidden="true">{suffixIcon}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
