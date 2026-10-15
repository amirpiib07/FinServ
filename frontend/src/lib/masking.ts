/**
 * FINServ Data Masking Helpers
 * Protects PII and sensitive banking account numbers across UI views and printouts.
 */

/**
 * Masks a bank account number showing only the last 4 digits
 * Example: "10010100000017" -> "••••••••••0017"
 */
export function maskAccountNumber(
  accountNumber: string | null | undefined,
  maskChar = '•'
): string {
  if (!accountNumber) return '';
  const clean = accountNumber.trim();
  if (clean.length <= 4) return clean;
  const visible = clean.slice(-4);
  return `${maskChar.repeat(clean.length - 4)}${visible}`;
}

/**
 * Masks an Indian mobile phone number showing only the last 4 digits
 * Example: "+919876543210" -> "+91 ••••••3210" or "9876543210" -> "••••••3210"
 */
export function maskPhoneNumber(
  phone: string | null | undefined,
  maskChar = '•'
): string {
  if (!phone) return '';
  const trimmed = phone.trim();

  // If prefixed with +91 or 91
  if (trimmed.startsWith('+91')) {
    const digits = trimmed.slice(3).replace(/\D/g, '');
    if (digits.length <= 4) return trimmed;
    return `+91 ${maskChar.repeat(digits.length - 4)}${digits.slice(-4)}`;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `${maskChar.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

/**
 * Masks an email address preserving first and last char of user part and full domain
 * Example: "alex.kumar@finserv.com" -> "a•••••••r@finserv.com"
 */
export function maskEmail(
  email: string | null | undefined,
  maskChar = '•'
): string {
  if (!email || !email.includes('@')) return email || '';
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;

  if (localPart.length <= 2) {
    return `${localPart[0] ?? ''}${maskChar}@${domain}`;
  }

  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  const maskedLength = Math.max(3, localPart.length - 2);
  return `${firstChar}${maskChar.repeat(maskedLength)}${lastChar}@${domain}`;
}

/**
 * Masks a Permanent Account Number (PAN) showing only the last 3 characters
 * Example: "ABCDE1234F" -> "•••••••34F"
 */
export function maskPan(
  pan: string | null | undefined,
  maskChar = '•'
): string {
  if (!pan) return '';
  const clean = pan.trim().toUpperCase();
  if (clean.length <= 3) return clean;
  return `${maskChar.repeat(clean.length - 3)}${clean.slice(-3)}`;
}
