import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import {
  register,
  registerTenant,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  me,
} from '../controllers/auth.controller';
import {
  registerSchema,
  tenantRegisterSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/register/tenant', validate(tenantRegisterSchema), registerTenant);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticate, me);

export default router;
