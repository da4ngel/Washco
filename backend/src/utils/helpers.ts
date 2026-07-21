import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler so rejected promises are forwarded to the
 * Express error handler instead of crashing the process.
 */
export const asyncHandler =
  <T extends Request = Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
  ) =>
  (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/** Rounds a number to 2 decimal places (money). */
export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Computes the platform fee and tenant payout for a service price.
 * Snapshot these onto the booking at creation time.
 */
export const computeFees = (
  servicePrice: number,
  commissionRate: number
): { platformFee: number; tenantPayout: number } => {
  const platformFee = round2((servicePrice * commissionRate) / 100);
  const tenantPayout = round2(servicePrice - platformFee);
  return { platformFee, tenantPayout };
};

/** Converts a business name into a URL-friendly slug. */
export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

/** Standard paginated-list query parsing. */
export const parsePagination = (query: Record<string, unknown>): { page: number; limit: number; from: number; to: number } => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { page, limit, from, to };
};

/** "HH:MM:SS" or "HH:MM" -> minutes since midnight. */
export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
};

/** minutes since midnight -> "HH:MM:SS". */
export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
};

export const DAYS_OF_WEEK = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;
