/**
 * Unit Tests for Idempotency Key Generation
 */

import { describe, it, expect } from 'vitest';
import { generateIdempotencyKey } from '../idempotency';

describe('Idempotency Key Helper (idempotency.ts)', () => {
  it('generates a non-empty string in valid UUID v4 format', () => {
    const key = generateIdempotencyKey();
    expect(key).toBeTypeOf('string');
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generates distinct unique keys across consecutive invocations', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const k = generateIdempotencyKey();
      expect(keys.has(k)).toBe(false);
      keys.add(k);
    }
    expect(keys.size).toBe(50);
  });
});
