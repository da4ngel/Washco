import { Router } from 'express';
import { isConfigured } from '../config/env';
import authRoutes from './auth.routes';
import tenantRoutes from './tenant.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import serviceRoutes from './service.routes';
import slotRoutes from './slot.routes';
import userRoutes from './user.routes';
import reviewRoutes from './review.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Health check — used to confirm the server is up.
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'washco-api',
    timestamp: new Date().toISOString(),
    configured: isConfigured,
  });
});

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/services', serviceRoutes);
router.use('/slots', slotRoutes);
router.use('/users', userRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);

export default router;
