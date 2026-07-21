import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import {
  getDashboard,
  listTenants,
  getTenantDetail,
  approveTenant,
  rejectTenant,
  suspendTenant,
  reinstateTenant,
  toggleFeatured,
  listAllBookings,
  listUsers,
  toggleBanUser,
  getRevenue,
  calculatePayouts,
  processPayouts,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/dashboard', getDashboard);
router.get('/tenants', listTenants);
router.get('/tenants/:id', getTenantDetail);
router.put('/tenants/:id/approve', approveTenant);
router.put('/tenants/:id/reject', rejectTenant);
router.put('/tenants/:id/suspend', suspendTenant);
router.put('/tenants/:id/reinstate', reinstateTenant);
router.put('/tenants/:id/featured', toggleFeatured);
router.get('/bookings', listAllBookings);
router.get('/users', listUsers);
router.put('/users/:id/ban', toggleBanUser);
router.get('/revenue', getRevenue);
router.post('/payouts/calculate', calculatePayouts);
router.post('/payouts/process', processPayouts);

export default router;
