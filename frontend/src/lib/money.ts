/**
 * FINServ Monetary Precision Utilities
 * Non-negotiable: ZERO IEEE 754 floating-point math on currency.
 * Amounts arrive and depart as decimal strings (e.g. "125000.50").
 * All arithmetic uses Decimal.js configured with Banker's Rounding (ROUND_HALF_EVEN).
 */

import Decimal from 'decimal.js';

// Configure Decimal global defaults for financial safety
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_EVEN, // Banker's rounding matching Java BigDecimal.HALF_EVEN
  toExpNeg: -9,
  toExpPos: 28,
});

export interface FormatINROptions {
  showSymbol?: boolean;      // Include ₹ symbol (default: true)
  spaceAfterSymbol?: boolean; // Add space between ₹ and amount (default: false)
  negativeStyle?: 'minus' | 'parentheses'; // e.g. -₹100 vs (₹100)
}

/**
 * Validates whether a value is a valid financial decimal string (up to 2 fractional digits)
 */
export function isValidAmountString(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  // Optional negative sign, digits, optional decimal point with up to 2 decimal places
  return /^-?\d+(\.\d{1,2})?$/.test(trimmed);
}

/**
 * Parses an input string into a Decimal instance safely without floating-point conversion
 */
export function parseAmount(value: string | Decimal | number): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  if (typeof value === 'number') {
    // If a number is passed, convert to string first
    return new Decimal(value.toString());
  }
  if (typeof value === 'string') {
    // Strip optional currency symbols, commas and extra spaces
    const clean = value.replace(/[₹,\s]/g, '').trim();
    if (!clean) {
      return new Decimal(0);
    }
    return new Decimal(clean);
  }
  throw new Error(`Unsupported money value type: ${typeof value}`);
}

/**
 * Converts a decimal amount string to integer paise (1 Rupee = 100 Paise)
 * Example: "150.25" -> 15025n
 */
export function toPaise(value: string | Decimal): bigint {
  const d = parseAmount(value);
  const paise = d.mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN);
  return BigInt(paise.toFixed(0));
}

/**
 * Converts integer paise to a 2-decimal rupee string
 * Example: 15025n -> "150.25"
 */
export function fromPaise(paise: bigint | number): string {
  const p = new Decimal(paise.toString());
  return p.div(100).toFixed(2);
}

/**
 * Formats a number/decimal string with Indian numbering grouping (Lakh / Crore style)
 * Grouping pattern: 3 digits for hundreds, followed by pairs of 2 digits (e.g. 12,34,56,789.50)
 * Works directly on strings to prevent IEEE 754 precision loss on huge values.
 */
export function formatINR(
  value: string | Decimal | number,
  options: FormatINROptions = {}
): string {
  const {
    showSymbol = true,
    spaceAfterSymbol = false,
    negativeStyle = 'minus',
  } = options;

  let dec: Decimal;
  try {
    dec = parseAmount(value);
  } catch {
    return showSymbol ? '₹0.00' : '0.00';
  }

  const isNegative = dec.isNegative() && !dec.isZero();
  const absDec = dec.abs();
  // Fixed to 2 decimal places using Banker's Rounding
  const fixedStr = absDec.toFixed(2);
  const [integerPart = '0', fractionalPart = '00'] = fixedStr.split('.');

  // Format integer part with Indian digit grouping (last 3, then groups of 2)
  let formattedInteger: string;
  if (integerPart.length <= 3) {
    formattedInteger = integerPart;
  } else {
    const lastThree = integerPart.slice(-3);
    const remaining = integerPart.slice(0, -3);
    // Group remaining into pairs of 2 from right to left
    const paired = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInteger = `${paired},${lastThree}`;
  }

  const numberPart = `${formattedInteger}.${fractionalPart}`;
  const symbol = showSymbol ? '₹' : '';
  const spacing = showSymbol && spaceAfterSymbol ? ' ' : '';

  if (isNegative) {
    if (negativeStyle === 'parentheses') {
      return `(${symbol}${spacing}${numberPart})`;
    }
    return `-${symbol}${spacing}${numberPart}`;
  }

  return `${symbol}${spacing}${numberPart}`;
}

/**
 * Decimal Arithmetic Operations with Banker's Rounding
 */
export function addMoney(a: string | Decimal, b: string | Decimal): string {
  return parseAmount(a).add(parseAmount(b)).toFixed(2);
}

export function subtractMoney(a: string | Decimal, b: string | Decimal): string {
  return parseAmount(a).sub(parseAmount(b)).toFixed(2);
}

export function multiplyMoney(a: string | Decimal, factor: string | number | Decimal): string {
  return parseAmount(a).mul(parseAmount(factor)).toFixed(2);
}

export function divideMoney(a: string | Decimal, divisor: string | number | Decimal): string {
  const div = parseAmount(divisor);
  if (div.isZero()) {
    throw new Error('Division by zero in monetary arithmetic');
  }
  return parseAmount(a).div(div).toFixed(2);
}

/**
 * Compares two monetary amounts
 * Returns -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareMoney(a: string | Decimal, b: string | Decimal): number {
  return parseAmount(a).comparedTo(parseAmount(b));
}
