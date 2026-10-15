/**
 * FINServ Textarea Component
 */

import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError = false, className = '', 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const isInvalid = ariaInvalid || hasError;

    return (
      <textarea
        ref={ref}
        className={`input-control textarea-control ${className}`.trim()}
        aria-invalid={isInvalid ? true : undefined}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
