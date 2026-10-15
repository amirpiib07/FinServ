/**
 * Unit Tests for Date Formatting in Asia/Kolkata (IST = UTC+5:30)
 * Verifies day-boundary midnight rollover handling
 */

import { describe, it, expect } from 'vitest';
import {
  formatDateIST,
  formatTimeIST,
  formatDateTimeIST,
  formatRelativeIST,
} from '../dates';

describe('Date Formatting Utilities (dates.ts)', () => {
  describe('IST Day-Boundary Midnight Rollover', () => {
    it('should format 1 second before midnight as the same day in IST', () => {
      // 2026-10-15 18:29:59 UTC + 5:30 = 2026-10-15 23:59:59 IST
      const beforeMidnightUTC = '2026-10-15T18:29:59Z';
      expect(formatDateIST(beforeMidnightUTC, 'medium')).toBe('15 Oct 2026');
      expect(formatTimeIST(beforeMidnightUTC, true)).toMatch(/11:59:59\s*pm/i);
    });

    it('should format exact midnight rollover as the NEXT day in IST', () => {
      // 2026-10-15 18:30:00 UTC + 5:30 = 2026-10-16 00:00:00 IST
      const exactMidnightUTC = '2026-10-15T18:30:00Z';
      expect(formatDateIST(exactMidnightUTC, 'medium')).toBe('16 Oct 2026');
      expect(formatTimeIST(exactMidnightUTC, true)).toMatch(/12:00:00\s*am/i);
    });

    it('should format morning UTC timestamps correctly into afternoon IST', () => {
      // 2026-10-15 09:00:00 UTC + 5:30 = 2026-10-15 14:30:00 IST (02:30 PM)
      const morningUTC = '2026-10-15T09:00:00Z';
      expect(formatDateIST(morningUTC, 'medium')).toBe('15 Oct 2026');
      expect(formatTimeIST(morningUTC, false)).toMatch(/02:30\s*pm/i);
    });
  });

  describe('formatDateIST() Formats', () => {
    const instant = '2026-05-20T10:00:00Z';

    it('formats short DD/MM/YYYY', () => {
      expect(formatDateIST(instant, 'short')).toBe('20/05/2026');
    });

    it('formats medium DD Mon YYYY', () => {
      expect(formatDateIST(instant, 'medium')).toBe('20 May 2026');
    });

    it('formats long DD Month YYYY', () => {
      expect(formatDateIST(instant, 'long')).toBe('20 May 2026');
    });
  });

  describe('formatDateTimeIST()', () => {
    it('combines date and time in IST', () => {
      const instant = '2026-10-15T06:00:00Z'; // 11:30 AM IST
      const result = formatDateTimeIST(instant, false);
      expect(result).toContain('15 Oct 2026');
      expect(result).toMatch(/11:30\s*am/i);
      expect(result).toContain('IST');
    });
  });

  describe('formatRelativeIST()', () => {
    it('returns "Just now" for events within 45 seconds', () => {
      const now = new Date('2026-10-15T12:00:00Z');
      const past = new Date('2026-10-15T11:59:30Z'); // 30s ago
      expect(formatRelativeIST(past, now)).toBe('Just now');
    });

    it('returns minutes ago', () => {
      const now = new Date('2026-10-15T12:00:00Z');
      const past = new Date('2026-10-15T11:55:00Z'); // 5m ago
      expect(formatRelativeIST(past, now)).toBe('5 mins ago');
    });

    it('returns hours ago', () => {
      const now = new Date('2026-10-15T15:00:00Z');
      const past = new Date('2026-10-15T12:00:00Z'); // 3h ago
      expect(formatRelativeIST(past, now)).toBe('3 hours ago');
    });

    it('returns days ago', () => {
      const now = new Date('2026-10-15T12:00:00Z');
      const past = new Date('2026-10-13T12:00:00Z'); // 2 days ago
      expect(formatRelativeIST(past, now)).toBe('2 days ago');
    });
  });
});
