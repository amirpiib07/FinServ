/**
 * FINServ PasswordInput Component
 * Includes accessible show/hide password toggle button
 */

import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  hasError?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ hasError = false, className = '', 'aria-invalid': ariaInvalid, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isInvalid = ariaInvalid || hasError;

    return (
      <div className="input-wrapper">
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={`input-control input-has-suffix ${className}`.trim()}
          aria-invalid={isInvalid ? true : undefined}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          className="input-suffix actionable btn-icon"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword(prev => !prev)}
          disabled={disabled}
          style={{ background: 'transparent', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          {showPassword ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
