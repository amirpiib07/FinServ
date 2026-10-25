/**
 * FINServ Date & Time Formatting Utilities
 * Standardizes all UTC timestamps from the backend into Asia/Kolkata (IST = UTC+5:30).
 * Handles midnight rollover boundary edge cases deterministically.
 * Resilient against null, undefined, and unparseable date values.
 */

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Parses any ISO instant string, Date object, or millisecond timestamp safely.
 * Returns null if the instant is null, undefined, empty, or unparseable.
 */
function toDate(instant: string | Date | number | null | undefined): Date | null {
  if (instant == null || instant === '') {
    return null;
  }
  if (instant instanceof Date) {
    return isNaN(instant.getTime()) ? null : instant;
  }
  const d = new Date(instant);
  if (isNaN(d.getTime())) {
    return null;
  }
  return d;
}

/**
 * Formats a UTC instant to an IST Date string
 * Example: "15 Oct 2026" or "15/10/2026"
 */
export function formatDateIST(
  instant: string | Date | number | null | undefined,
  formatStyle: 'short' | 'medium' | 'long' = 'medium',
  fallback = '—'
): string {
  const date = toDate(instant);
  if (!date) return fallback;

  if (formatStyle === 'short') {
    // DD/MM/YYYY
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return formatter.format(date);
  }

  if (formatStyle === 'long') {
    // 15 October 2026
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(date);
  }

  // medium default: 15 Oct 2026
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return formatter.format(date);
}

/**
 * Formats a UTC instant to an IST 12-hour Time string
 * Example: "05:30 AM" or "05:30:00 AM"
 */
export function formatTimeIST(
  instant: string | Date | number | null | undefined,
  includeSeconds = false,
  fallback = '—'
): string {
  const date = toDate(instant);
  if (!date) return fallback;

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });
  return formatter.format(date);
}

/**
 * Formats a UTC instant into a combined date and time string in IST
 * Example: "16 Oct 2026, 12:00:00 am IST"
 */
export function formatDateTimeIST(
  instant: string | Date | number | null | undefined,
  includeSeconds = true,
  fallback = '—'
): string {
  const date = toDate(instant);
  if (!date) return fallback;

  const dateStr = formatDateIST(date, 'medium', fallback);
  const timeStr = formatTimeIST(date, includeSeconds, fallback);
  return `${dateStr}, ${timeStr} IST`;
}

/**
 * Relative time formatter for bank audit trails, activity feeds, and alerts
 * Example: "Just now", "5 mins ago", "Yesterday at 11:30 PM", "3 days ago"
 */
export function formatRelativeIST(
  instant: string | Date | number | null | undefined,
  baseDate: Date = new Date(),
  fallback = '—'
): string {
  const date = toDate(instant);
  if (!date) return fallback;

  const diffMs = baseDate.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (Math.abs(diffSec) < 45) {
    return 'Just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return diffMin > 0 ? `${diffMin} min${diffMin === 1 ? '' : 's'} ago` : `in ${Math.abs(diffMin)} min${Math.abs(diffMin) === 1 ? '' : 's'}`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `${diffHours} hour${diffHours === 1 ? '' : 's'} ago` : `in ${Math.abs(diffHours)} hour${Math.abs(diffHours) === 1 ? '' : 's'}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return diffDays > 0 ? `${diffDays} day${diffDays === 1 ? '' : 's'} ago` : `in ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
  }

  // Beyond a week, return absolute IST date
  return formatDateIST(date, 'medium', fallback);
}
