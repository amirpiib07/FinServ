/**
 * Unit Tests for Monetary Precision Utilities
 * Strictly verifies zero-floating-point calculations and Indian digit grouping (Lakh/Crore)
 */

import { describe, it, expect } from 'vitest';
import {
  formatINR,
  toPaise,
  fromPaise,
  addMoney,
  subtractMoney,
  multiplyMoney,
  divideMoney,
  compareMoney,
  isValidAmountString,
} from '../money';

describe('Monetary Precision Utilities (money.ts)', () => {
  describe('formatINR() - Indian Digit Grouping', () => {
    it('should format zero correctly', () => {
      expect(formatINR('0')).toBe('₹0.00');
      expect(formatINR('0.00')).toBe('₹0.00');
      expect(formatINR(0)).toBe('₹0.00');
    });

    it('should format small amounts (< 1,000)', () => {
      expect(formatINR('5')).toBe('₹5.00');
      expect(formatINR('99.5')).toBe('₹99.50');
      expect(formatINR('999.99')).toBe('₹999.99');
    });

    it('should format thousands (1,000 to 99,999)', () => {
      expect(formatINR('1000')).toBe('₹1,000.00');
      expect(formatINR('12500.50')).toBe('₹12,500.50');
      expect(formatINR('99999.99')).toBe('₹99,999.99');
    });

    it('should format Lakhs (1,00,000 to 99,99,999)', () => {
      expect(formatINR('100000')).toBe('₹1,00,000.00');
      expect(formatINR('525000.75')).toBe('₹5,25,000.75');
      expect(formatINR('7550123.10')).toBe('₹75,50,123.10');
    });

    it('should format Crores (1,00,00,000 and above)', () => {
      expect(formatINR('10000000')).toBe('₹1,00,00,000.00');
      expect(formatINR('254321987.50')).toBe('₹25,43,21,987.50');
      expect(formatINR('1000000000.00')).toBe('₹1,00,00,00,000.00');
    });

    it('should handle negative monetary amounts with minus or parentheses', () => {
      expect(formatINR('-500.00')).toBe('-₹500.00');
      expect(formatINR('-125000.50')).toBe('-₹1,25,000.50');
      expect(formatINR('-125000.50', { negativeStyle: 'parentheses' })).toBe('(₹1,25,000.50)');
    });

    it('should respect formatting options (showSymbol, spaceAfterSymbol)', () => {
      expect(formatINR('15000', { showSymbol: false })).toBe('15,000.00');
      expect(formatINR('15000', { spaceAfterSymbol: true })).toBe('₹ 15,000.00');
    });

    it('should apply Half-Even Banker Rounding on fractional amounts', () => {
      // In Banker's rounding: .005 rounds to nearest even number (.00)
      expect(formatINR('10.005')).toBe('₹10.00');
      // .015 rounds to nearest even number (.02)
      expect(formatINR('10.015')).toBe('₹10.02');
    });
  });

  describe('Paise Conversion (toPaise and fromPaise)', () => {
    it('should convert rupee amounts to integer paise', () => {
      expect(toPaise('0.00')).toBe(0n);
      expect(toPaise('1.00')).toBe(100n);
      expect(toPaise('150.25')).toBe(15025n);
      expect(toPaise('99999.99')).toBe(9999999n);
    });

    it('should convert integer paise back to rupee decimal string', () => {
      expect(fromPaise(0n)).toBe('0.00');
      expect(fromPaise(100n)).toBe('1.00');
      expect(fromPaise(15025n)).toBe('150.25');
      expect(fromPaise(9999999n)).toBe('99999.99');
    });
  });

  describe('Decimal Arithmetic', () => {
    it('should perform precision addition without floating point error (0.1 + 0.2 = 0.30)', () => {
      expect(addMoney('0.1', '0.2')).toBe('0.30');
      expect(addMoney('100000.50', '250000.75')).toBe('350001.25');
    });

    it('should perform precision subtraction', () => {
      expect(subtractMoney('500.00', '125.75')).toBe('374.25');
      expect(subtractMoney('100.00', '150.00')).toBe('-50.00');
    });

    it('should perform precision multiplication', () => {
      expect(multiplyMoney('250.00', 3)).toBe('750.00');
      expect(multiplyMoney('100.00', '0.085')).toBe('8.50');
    });

    it('should perform precision division with banker rounding', () => {
      expect(divideMoney('100.00', 2)).toBe('50.00');
      expect(divideMoney('100.00', 3)).toBe('33.33');
    });

    it('should throw on division by zero', () => {
      expect(() => divideMoney('100.00', '0')).toThrow('Division by zero');
    });

    it('should compare amounts correctly', () => {
      expect(compareMoney('100.00', '200.00')).toBe(-1);
      expect(compareMoney('200.00', '200.00')).toBe(0);
      expect(compareMoney('300.00', '200.00')).toBe(1);
    });
  });

  describe('isValidAmountString()', () => {
    it('should accept valid positive and negative decimal strings', () => {
      expect(isValidAmountString('100')).toBe(true);
      expect(isValidAmountString('100.5')).toBe(true);
      expect(isValidAmountString('100.50')).toBe(true);
      expect(isValidAmountString('-100.50')).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(isValidAmountString('')).toBe(false);
      expect(isValidAmountString('abc')).toBe(false);
      expect(isValidAmountString('100.123')).toBe(false); // More than 2 decimal places
      expect(isValidAmountString('100..00')).toBe(false);
    });
  });
});
