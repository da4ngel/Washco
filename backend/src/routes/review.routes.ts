import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createReview,
  updateReview,
  deleteReview,
  replyToReview,
} from '../controllers/review.controller';
import { createReviewSchema, updateReviewSchema, replyReviewSchema } from '../schemas/review.schema';

const router = Router();

router.use(authenticate);

router.post('/', validate(createReviewSchema), createReview);
router.put('/:id', validate(updateReviewSchema), updateReview);
router.delete('/:id', deleteReview);
router.put('/:id/reply', requireRole(['tenant', 'admin']), validate(replyReviewSchema), replyToReview);

export default router;
