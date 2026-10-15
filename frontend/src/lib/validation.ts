/**
 * FINServ Standard Banking Zod Validation Schemas
 * Type-safe validation for common Indian banking domain fields
 */

import { z } from 'zod';
import Decimal from 'decimal.js';

/**
 * Normalizes Indian mobile number by removing spaces, dashes, +91 or leading 0
 */
export function normalizeIndianMobile(raw: string): string {
  let cleaned = raw.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Indian Mobile Number: 10 digits starting with 6, 7, 8, or 9
 */
export const indianMobileSchema = z
  .string()
  .min(10, 'Mobile number must be at least 10 digits')
  .max(15, 'Mobile number exceeds valid length')
  .transform(normalizeIndianMobile)
  .pipe(
    z
      .string()
      .regex(
        /^[6-9]\d{9}$/,
        'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
      )
  );

/**
 * Standard Email Schema: valid RFC email up to 255 chars
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email address is required')
  .max(255, 'Email cannot exceed 255 characters')
  .email('Please enter a valid email address');

/**
 * Permanent Account Number (PAN): 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)
 */
export const panSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    'Invalid PAN format. Must be 5 uppercase letters, 4 digits, and 1 letter (e.g. ABCDE1234F)'
  );

/**
 * Indian Financial System Code (IFSC): 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234, FINV0001001)
 */
export const ifscSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-Z]{4}0[A-Z0-9]{6}$/,
    'Invalid IFSC code. Must be 4 letters, 0, and 6 alphanumeric branch characters (e.g. FINV0001001)'
  );

/**
 * Financial Amount Schema:
 * Validates that string is a non-empty, positive decimal with at most 2 decimal places.
 */
export const amountSchema = (options: { min?: string | number; max?: string | number } = {}) => {
  const minDec = new Decimal(options.min !== undefined ? options.min : '0.01');
  const maxDec = options.max !== undefined ? new Decimal(options.max) : new Decimal('100000000.00');

  return z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .refine(val => /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Amount must be a valid positive number with at most 2 decimal places',
    })
    .refine(
      val => {
        try {
          const d = new Decimal(val);
          return d.gte(minDec);
        } catch {
          return false;
        }
      },
      {
        message: `Amount must be at least ₹${minDec.toFixed(2)}`,
      }
    )
    .refine(
      val => {
        try {
          const d = new Decimal(val);
          return d.lte(maxDec);
        } catch {
          return false;
        }
      },
      {
        message: `Amount cannot exceed ₹${maxDec.toFixed(2)}`,
      }
    );
};
