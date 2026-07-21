import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createIntent, confirmPayment } from '../controllers/payment.controller';
import { createIntentSchema, confirmPaymentSchema } from '../schemas/payment.schema';

const router = Router();

// NOTE: POST /api/payments/webhook is mounted separately in index.ts (raw body).

router.use(authenticate);
router.post('/create-intent', validate(createIntentSchema), createIntent);
router.post('/confirm', validate(confirmPaymentSchema), confirmPayment);

// Phase 5 adds: POST /refund/:bookingId (admin).

export default router;
