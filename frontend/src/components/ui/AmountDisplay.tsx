/**
 * FINServ AmountDisplay Component
 * Precision-safe Indian Rupee display with Lakh/Crore grouping
 */

import React from 'react';
import { formatINR, parseAmount } from '@/lib/money';
import Decimal from 'decimal.js';

export interface AmountDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: string | Decimal | number;
  colorBySign?: boolean;
  showSymbol?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  spaceAfterSymbol?: boolean;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  colorBySign = false,
  showSymbol = true,
  size = 'md',
  spaceAfterSymbol = false,
  className = '',
  ...props
}) => {
  let dec: Decimal;
  try {
    dec = parseAmount(amount);
  } catch {
    dec = new Decimal(0);
  }

  const isNegative = dec.isNegative() && !dec.isZero();
  const isPositive = dec.isPositive() && !dec.isZero();

  let signClass = 'amount-neutral';
  if (colorBySign) {
    if (isPositive) signClass = 'amount-positive';
    if (isNegative) signClass = 'amount-negative';
  }

  const formattedWithSymbol = formatINR(dec, {
    showSymbol,
    spaceAfterSymbol,
  });

  // Calculate font-size style
  const sizeMap = {
    sm: 'var(--font-size-xs)',
    md: 'var(--font-size-base)',
    lg: 'var(--font-size-xl)',
    xl: 'var(--font-size-3xl)',
  };

  return (
    <span
      className={`amount-root ${signClass} ${className}`.trim()}
      style={{ fontSize: sizeMap[size] }}
      {...props}
    >
      {formattedWithSymbol}
    </span>
  );
};
