/**
 * Unit Tests for PII and Banking Data Masking
 */

import { describe, it, expect } from 'vitest';
import {
  maskAccountNumber,
  maskPhoneNumber,
  maskEmail,
  maskPan,
} from '../masking';

describe('Data Masking Utilities (masking.ts)', () => {
  describe('maskAccountNumber()', () => {
    it('masks 14-digit bank account number showing last 4 digits', () => {
      expect(maskAccountNumber('10010100000017')).toBe('••••••••••0017');
    });

    it('returns empty string for null or empty input', () => {
      expect(maskAccountNumber('')).toBe('');
      expect(maskAccountNumber(null)).toBe('');
      expect(maskAccountNumber(undefined)).toBe('');
    });

    it('leaves short strings <= 4 untouched', () => {
      expect(maskAccountNumber('1234')).toBe('1234');
    });
  });

  describe('maskPhoneNumber()', () => {
    it('masks 10-digit Indian phone number showing last 4 digits', () => {
      expect(maskPhoneNumber('9876543210')).toBe('••••••3210');
    });

    it('masks phone number prefixed with +91', () => {
      expect(maskPhoneNumber('+919876543210')).toBe('+91 ••••••3210');
    });

    it('returns empty for null or empty phone', () => {
      expect(maskPhoneNumber('')).toBe('');
      expect(maskPhoneNumber(null)).toBe('');
    });
  });

  describe('maskEmail()', () => {
    it('masks standard email keeping first, last, and domain', () => {
      expect(maskEmail('amit.kumar@finserv.com')).toBe('a••••••••r@finserv.com');
    });

    it('handles short email prefixes safely', () => {
      expect(maskEmail('ab@test.com')).toBe('a•@test.com');
    });

    it('returns original input if invalid email or empty', () => {
      expect(maskEmail('invalid-string')).toBe('invalid-string');
      expect(maskEmail('')).toBe('');
    });
  });

  describe('maskPan()', () => {
    it('masks 10-character PAN showing last 3 chars', () => {
      expect(maskPan('ABCDE1234F')).toBe('•••••••34F');
    });

    it('handles lowercase PAN by uppercasing and masking', () => {
      expect(maskPan('abcde1234f')).toBe('•••••••34F');
    });

    it('returns empty for null or empty input', () => {
      expect(maskPan('')).toBe('');
      expect(maskPan(null)).toBe('');
    });
  });
});
