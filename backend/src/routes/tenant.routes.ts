import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  searchTenants,
  getTenant,
  getTenantServices,
  getTenantAvailability,
  getTenantReviews,
  getMyTenant,
  getDashboard,
  updateMyTenant,
  updateOperatingHours,
  addPhoto,
  deletePhoto,
  setPrimaryPhoto,
  getPayouts,
  getAnalytics,
} from '../controllers/tenant.controller';
import {
  searchTenantsSchema,
  updateTenantProfileSchema,
  updateHoursSchema,
  addPhotoSchema,
} from '../schemas/tenant.schema';

const router = Router();

// ---- Protected owner endpoints (registered before /:id so they aren't shadowed) ----
const owner = [authenticate, requireRole(['tenant', 'admin'])] as const;

router.get('/me', ...owner, getMyTenant);
router.get('/dashboard', ...owner, getDashboard);
router.get('/payouts', ...owner, getPayouts);
router.get('/analytics', ...owner, getAnalytics);
router.put('/profile', ...owner, validate(updateTenantProfileSchema), updateMyTenant);
router.put('/hours', ...owner, validate(updateHoursSchema), updateOperatingHours);
router.post('/photos', ...owner, validate(addPhotoSchema), addPhoto);
router.delete('/photos/:photoId', ...owner, deletePhoto);
router.put('/photos/:photoId/primary', ...owner, setPrimaryPhoto);

// ---- Public discovery endpoints ----
router.get('/', validate(searchTenantsSchema, 'query'), searchTenants);
router.get('/:id', getTenant);
router.get('/:id/services', getTenantServices);
router.get('/:id/availability', getTenantAvailability);
router.get('/:id/reviews', getTenantReviews);

export default router;
