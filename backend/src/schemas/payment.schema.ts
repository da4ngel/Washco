import { z } from 'zod';

export const createIntentSchema = z.object({
  booking_id: z.string().uuid(),
});

export const confirmPaymentSchema = z.object({
  booking_id: z.string().uuid(),
  payment_intent_id: z.string().min(1),
});
