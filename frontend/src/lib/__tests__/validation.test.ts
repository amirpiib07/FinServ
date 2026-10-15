/**
 * Unit Tests for Zod Validation Schemas
 * Tests Indian Mobile, Email, PAN, IFSC, and Monetary Amount
 */

import { describe, it, expect } from 'vitest';
import {
  indianMobileSchema,
  emailSchema,
  panSchema,
  ifscSchema,
  amountSchema,
  normalizeIndianMobile,
} from '../validation';

describe('Banking Zod Validation Schemas (validation.ts)', () => {
  describe('indianMobileSchema', () => {
    it('accepts valid 10-digit mobile numbers starting with 6, 7, 8, 9', () => {
      expect(indianMobileSchema.safeParse('9876543210').success).toBe(true);
      expect(indianMobileSchema.safeParse('8123456789').success).toBe(true);
      expect(indianMobileSchema.safeParse('7000000000').success).toBe(true);
      expect(indianMobileSchema.safeParse('6999999999').success).toBe(true);
    });

    it('normalizes +91, 0, spaces and dashes', () => {
      const res1 = indianMobileSchema.safeParse('+91 98765 43210');
      expect(res1.success).toBe(true);
      if (res1.success) expect(res1.data).toBe('9876543210');

      const res2 = indianMobileSchema.safeParse('09876543210');
      expect(res2.success).toBe(true);
      if (res2.success) expect(res2.data).toBe('9876543210');

      expect(normalizeIndianMobile('919876543210')).toBe('9876543210');
    });

    it('rejects numbers starting with 0-5', () => {
      expect(indianMobileSchema.safeParse('5123456789').success).toBe(false);
      expect(indianMobileSchema.safeParse('1234567890').success).toBe(false);
    });

    it('rejects incorrect lengths', () => {
      expect(indianMobileSchema.safeParse('987654321').success).toBe(false); // 9 digits
      expect(indianMobileSchema.safeParse('987654321000').success).toBe(false); // 12 digits
    });
  });

  describe('emailSchema', () => {
    it('accepts valid email addresses', () => {
      expect(emailSchema.safeParse('user@finserv.com').success).toBe(true);
      expect(emailSchema.safeParse('compliance.officer@bank.in').success).toBe(true);
    });

    it('rejects malformed emails and empty values', () => {
      expect(emailSchema.safeParse('not-an-email').success).toBe(false);
      expect(emailSchema.safeParse('').success).toBe(false);
    });
  });

  describe('panSchema', () => {
    it('accepts valid 10-character PAN format (5 letters, 4 digits, 1 letter)', () => {
      const res = panSchema.safeParse('ABCDE1234F');
      expect(res.success).toBe(true);
      if (res.success) expect(res.data).toBe('ABCDE1234F');
    });

    it('transforms lowercase PAN into uppercase', () => {
      const res = panSchema.safeParse('abcde1234f');
      expect(res.success).toBe(true);
      if (res.success) expect(res.data).toBe('ABCDE1234F');
    });

    it('rejects malformed PAN formats', () => {
      expect(panSchema.safeParse('ABCD12345F').success).toBe(false); // 4 letters + 5 digits
      expect(panSchema.safeParse('ABCDE12345').success).toBe(false); // Ends with digit
      expect(panSchema.safeParse('12345ABCDE').success).toBe(false);
      expect(panSchema.safeParse('ABCDE1234').success).toBe(false); // 9 chars
    });
  });

  describe('ifscSchema', () => {
    it('accepts valid IFSC format (4 letters, 0, 6 alphanumeric)', () => {
      expect(ifscSchema.safeParse('SBIN0001234').success).toBe(true);
      expect(ifscSchema.safeParse('FINV0001001').success).toBe(true);
      expect(ifscSchema.safeParse('HDFC0000001').success).toBe(true);
    });

    it('rejects invalid IFSC codes', () => {
      expect(ifscSchema.safeParse('SBIN1001234').success).toBe(false); // 5th char is not 0
      expect(ifscSchema.safeParse('SBI0001234').success).toBe(false); // Too short
      expect(ifscSchema.safeParse('SBIN00012345').success).toBe(false); // Too long
    });
  });

  describe('amountSchema()', () => {
    const validator = amountSchema({ min: '1.00', max: '100000.00' });

    it('accepts valid monetary amount within bounds', () => {
      expect(validator.safeParse('100').success).toBe(true);
      expect(validator.safeParse('1.00').success).toBe(true);
      expect(validator.safeParse('99999.99').success).toBe(true);
      expect(validator.safeParse('100000.00').success).toBe(true);
    });

    it('rejects amounts below minimum', () => {
      expect(validator.safeParse('0.50').success).toBe(false);
      expect(validator.safeParse('0').success).toBe(false);
      expect(validator.safeParse('-10.00').success).toBe(false);
    });

    it('rejects amounts above maximum', () => {
      expect(validator.safeParse('100000.01').success).toBe(false);
      expect(validator.safeParse('200000.00').success).toBe(false);
    });

    it('rejects invalid number formats', () => {
      expect(validator.safeParse('abc').success).toBe(false);
      expect(validator.safeParse('100.123').success).toBe(false); // More than 2 decimals
    });
  });
});
