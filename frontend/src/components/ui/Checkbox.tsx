/**
 * FINServ Checkbox Component
 */

import React, { forwardRef, useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, checked, indeterminate = false, disabled = false, className = '', id, onChange, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    const resolvedRef = (ref || innerRef) as React.MutableRefObject<HTMLInputElement | null>;

    useEffect(() => {
      if (resolvedRef.current) {
        resolvedRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate, resolvedRef]);

    const isChecked = Boolean(checked);

    return (
      <label className={`choice-wrapper ${disabled ? 'disabled' : ''} ${className}`.trim()}>
        <input
          ref={resolvedRef}
          type="checkbox"
          id={id}
          checked={isChecked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only"
          {...props}
        />
        <span
          className={`checkbox-box ${isChecked || indeterminate ? 'checked' : ''}`}
          aria-hidden="true"
        >
          {indeterminate ? (
            <Minus size={12} strokeWidth={3} />
          ) : isChecked ? (
            <Check size={12} strokeWidth={3} />
          ) : null}
        </span>
        {label && <span className="choice-label">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
