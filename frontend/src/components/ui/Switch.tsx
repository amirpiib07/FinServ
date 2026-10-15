/**
 * FINServ Switch Component
 */

import React from 'react';

export interface SwitchProps {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  'aria-label'?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  id,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  label,
  'aria-label': ariaLabel,
  className = '',
}) => {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isChecked = checked !== undefined ? checked : internalChecked;

  const toggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (checked === undefined) {
      setInternalChecked(next);
    }
    onCheckedChange?.(next);
  };

  return (
    <label className={`choice-wrapper ${disabled ? 'disabled' : ''} ${className}`.trim()}>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={isChecked}
        aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
        disabled={disabled}
        onClick={toggle}
        className={`switch-root ${isChecked ? 'checked' : ''}`}
      >
        <span className="switch-thumb" aria-hidden="true" />
      </button>
      {label && <span className="choice-label">{label}</span>}
    </label>
  );
};
