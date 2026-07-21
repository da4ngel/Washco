import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  getSlotsForTenant,
  generate,
  blockSlot,
  unblockSlot,
  bulkBlock,
} from '../controllers/slot.controller';
import { generateSlotsSchema, bulkBlockSchema } from '../schemas/slot.schema';

const router = Router();

// Public: slots for a tenant (booking flow).
router.get('/tenant/:tenantId', getSlotsForTenant);

// Tenant-only management.
router.use(authenticate, requireRole(['tenant', 'admin']));
router.post('/generate', validate(generateSlotsSchema), generate);
router.put('/:id/block', blockSlot);
router.put('/:id/unblock', unblockSlot);
router.post('/bulk-block', validate(bulkBlockSchema), bulkBlock);

export default router;
