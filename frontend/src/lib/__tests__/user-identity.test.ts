import { describe, expect, it } from 'vitest';
import { getAsiaKolkataGreeting, getUserDisplayName, getUserInitials } from '../user-identity';

describe('user identity presentation', () => {
  it('prefers a customer real name over the username', () => {
    expect(getUserDisplayName({ firstName: ' Rahul ', lastName: 'Sharma', username: 'rsharma' }))
      .toBe('Rahul Sharma');
  });

  it('uses an employee name when provided and otherwise falls back to username', () => {
    expect(getUserDisplayName({ employeeName: 'Asha Rao', username: 'arao' })).toBe('Asha Rao');
    expect(getUserDisplayName({ username: 'arao' })).toBe('arao');
    expect(getUserDisplayName(null)).toBe('Customer');
  });

  it('builds initials from the real display name', () => {
    expect(getUserInitials('Rahul Sharma')).toBe('RS');
    expect(getUserInitials('Rahul')).toBe('RA');
  });

  it('chooses greetings using the Asia/Kolkata hour', () => {
    expect(getAsiaKolkataGreeting(new Date('2026-10-19T01:00:00.000Z'))).toBe('Good morning');
    expect(getAsiaKolkataGreeting(new Date('2026-10-19T08:00:00.000Z'))).toBe('Good afternoon');
    expect(getAsiaKolkataGreeting(new Date('2026-10-19T12:00:00.000Z'))).toBe('Good evening');
  });
});
