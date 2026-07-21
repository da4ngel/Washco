import { describe, it, expect } from 'vitest';
import { cn, formatLKR, formatTime, truncate } from './utils';

describe('cn', () => {
  it('merges class names and dedupes conflicting Tailwind utilities', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', false && 'hidden', 'font-bold')).toBe('text-sm font-bold');
  });
});

describe('formatLKR', () => {
  it('formats an amount as Sri Lankan Rupees with no decimals', () => {
    const out = formatLKR(1500);
    expect(out).toContain('1,500');
    expect(out).not.toContain('.00');
  });
});

describe('formatTime', () => {
  it('converts 24h times to 12h with a period', () => {
    expect(formatTime('09:00:00')).toBe('9:00 AM');
    expect(formatTime('13:30')).toBe('1:30 PM');
    expect(formatTime('00:15')).toBe('12:15 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
  });
});

describe('truncate', () => {
  it('leaves short strings untouched', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('adds an ellipsis when over the limit', () => {
    expect(truncate('hello world', 5)).toBe('hello…');
  });
});
