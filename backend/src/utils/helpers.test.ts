import { describe, it, expect } from 'vitest';
import {
  round2,
  computeFees,
  slugify,
  parsePagination,
  timeToMinutes,
  minutesToTime,
} from './helpers';

describe('round2', () => {
  it('rounds to two decimal places', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
    expect(round2(10)).toBe(10);
  });
});

describe('computeFees', () => {
  it('applies the commission rate and splits the price', () => {
    const { platformFee, tenantPayout } = computeFees(1000, 16);
    expect(platformFee).toBe(160);
    expect(tenantPayout).toBe(840);
    // The split always reconstitutes the original price.
    expect(round2(platformFee + tenantPayout)).toBe(1000);
  });

  it('handles a 0% commission (whole price to tenant)', () => {
    expect(computeFees(500, 0)).toEqual({ platformFee: 0, tenantPayout: 500 });
  });

  it('handles a 100% commission (nothing to tenant)', () => {
    expect(computeFees(500, 100)).toEqual({ platformFee: 500, tenantPayout: 0 });
  });

  it('rounds fractional LKR amounts to cents', () => {
    const { platformFee, tenantPayout } = computeFees(1999.99, 16);
    expect(platformFee).toBe(320);
    expect(tenantPayout).toBe(1679.99);
    expect(round2(platformFee + tenantPayout)).toBe(1999.99);
  });
});

describe('slugify', () => {
  it('lowercases, trims, and hyphenates', () => {
    expect(slugify('  Speedy Wash Colombo 3 ')).toBe('speedy-wash-colombo-3');
  });

  it('strips punctuation and collapses repeated separators', () => {
    expect(slugify('AquaShine!! Auto  Spa')).toBe('aquashine-auto-spa');
  });

  it('caps the length at 60 characters', () => {
    expect(slugify('a'.repeat(80)).length).toBe(60);
  });
});

describe('parsePagination', () => {
  it('defaults to page 1, limit 20', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, from: 0, to: 19 });
  });

  it('computes the range for a later page', () => {
    expect(parsePagination({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10, from: 20, to: 29 });
  });

  it('clamps invalid values into range', () => {
    expect(parsePagination({ page: -5, limit: 5000 })).toEqual({ page: 1, limit: 100, from: 0, to: 99 });
  });
});

describe('time conversion', () => {
  it('converts HH:MM(:SS) to minutes since midnight', () => {
    expect(timeToMinutes('09:00')).toBe(540);
    expect(timeToMinutes('18:30:00')).toBe(1110);
  });

  it('round-trips minutes back to HH:MM:SS', () => {
    expect(minutesToTime(540)).toBe('09:00:00');
    expect(minutesToTime(1110)).toBe('18:30:00');
    expect(timeToMinutes(minutesToTime(725))).toBe(725);
  });
});
