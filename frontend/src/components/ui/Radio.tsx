/**
 * FINServ Radio and RadioGroup Components
 */

import React, { forwardRef } from 'react';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, checked, disabled = false, className = '', id, onChange, ...props }, ref) => {
    const isChecked = Boolean(checked);

    return (
      <label className={`choice-wrapper ${disabled ? 'disabled' : ''} ${className}`.trim()}>
        <input
          ref={ref}
          type="radio"
          id={id}
          checked={isChecked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only"
          {...props}
        />
        <span className={`radio-box ${isChecked ? 'checked' : ''}`} aria-hidden="true" />
        {label && <span className="choice-label">{label}</span>}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export interface RadioGroupOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: RadioGroupOption[];
  direction?: 'row' | 'column';
  className?: string;
  disabled?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  direction = 'column',
  className = '',
  disabled = false,
}) => {
  return (
    <div
      role="radiogroup"
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: 'var(--spacing-3)',
      }}
      className={className}
    >
      {options.map(option => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          label={option.label}
          checked={value === option.value}
          disabled={disabled || option.disabled}
          onChange={() => onChange?.(option.value)}
        />
      ))}
    </div>
  );
};
