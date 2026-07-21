import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  getProfile,
  updateProfile,
  listMyBookings,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  listWashPasses,
} from '../controllers/user.controller';
import { updateProfileSchema } from '../schemas/user.schema';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.get('/bookings', listMyBookings);
router.get('/notifications', listNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);
router.get('/wash-passes', listWashPasses);

export default router;
