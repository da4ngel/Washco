import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  create,
  getById,
  confirmBooking,
  startBooking,
  completeBooking,
  cancelBooking,
  uploadBookingPhotos,
  listTenantBookings,
} from '../controllers/booking.controller';
import { createBookingSchema, cancelBookingSchema, bookingPhotosSchema } from '../schemas/booking.schema';

const router = Router();

// All booking routes require authentication.
router.use(authenticate);

// Tenant-scoped list (specific path before /:id).
router.get('/tenant/all', requireRole(['tenant', 'admin']), listTenantBookings);

router.post('/', validate(createBookingSchema), create);
router.get('/:id', getById);
router.post('/:id/cancel', validate(cancelBookingSchema), cancelBooking);

// Tenant status transitions.
router.put('/:id/confirm', requireRole(['tenant', 'admin']), confirmBooking);
router.put('/:id/start', requireRole(['tenant', 'admin']), startBooking);
router.put('/:id/complete', requireRole(['tenant', 'admin']), completeBooking);
router.post('/:id/photos', requireRole(['tenant', 'admin']), validate(bookingPhotosSchema), uploadBookingPhotos);

export default router;
