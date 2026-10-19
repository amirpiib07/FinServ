import type { UserSummary } from '@/types/auth';

export function getUserDisplayName(user: Partial<UserSummary> | null | undefined): string {
  const customerName = [user?.firstName, user?.lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ');

  return customerName || user?.employeeName?.trim() || user?.username?.trim() || 'Customer';
}

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts.at(0);
  const last = parts.at(-1);

  if (!first) return 'CU';
  if (!last || parts.length === 1) return first.slice(0, 2).toUpperCase();
  return `${first[0]}${last[0]}`.toUpperCase();
}

export function getAsiaKolkataGreeting(date: Date = new Date()): string {
  const hour = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .find((part) => part.type === 'hour')?.value;

  const istHour = Number(hour);
  if (!Number.isFinite(istHour)) return 'Welcome back';
  if (istHour < 12) return 'Good morning';
  if (istHour < 17) return 'Good afternoon';
  return 'Good evening';
}
