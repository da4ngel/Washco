import { z } from 'zod';

export const createReviewSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).nullable().optional(),
});

export const replyReviewSchema = z.object({
  tenant_reply: z.string().min(1).max(1000),
});
