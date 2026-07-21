import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createService,
  updateService,
  deleteService,
  reorderService,
} from '../controllers/service.controller';
import { createServiceSchema, updateServiceSchema, reorderServiceSchema } from '../schemas/service.schema';

const router = Router();

router.use(authenticate, requireRole(['tenant', 'admin']));

router.post('/', validate(createServiceSchema), createService);
router.put('/:id', validate(updateServiceSchema), updateService);
router.delete('/:id', deleteService);
router.put('/:id/reorder', validate(reorderServiceSchema), reorderService);

export default router;
