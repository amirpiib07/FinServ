/**
 * FINServ FormField Wrapper
 * Connects labels, descriptions, and error messages via accessible ARIA attributes
 */

import React, { useId } from 'react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode | ((props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => React.ReactNode);
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  hint,
  error,
  htmlFor,
  className = '',
  children,
}) => {
  const generatedId = useId();
  const fieldId = htmlFor || generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const isInvalid = Boolean(error);

  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <label htmlFor={fieldId} className="form-label">
          <span>{label}</span>
          {required && (
            <span className="form-required-star" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {typeof children === 'function'
        ? children({ id: fieldId, 'aria-describedby': describedBy, 'aria-invalid': isInvalid })
        : React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            id: (children.props as { id?: string }).id || fieldId,
            'aria-describedby': describedBy,
            'aria-invalid': isInvalid,
          })
        : children}

      {hint && !error && (
        <p id={hintId} className="form-hint">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="form-error" role="alert">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
