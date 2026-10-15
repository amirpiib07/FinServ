/**
 * Idempotency Key Generation Helper
 * Generates RFC 4122 v4 UUIDs for state-altering banking calls (POST/PUT/PATCH/DELETE)
 * to satisfy the backend UNIQUE(user_id, idempotency_key) contract.
 */

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback RFC 4122 v4 UUID generator for environments lacking crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
