import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { UserRole } from '../types';

/**
 * Role-based access control. Use after `authenticate`.
 * requireRole('admin') or requireRole(['tenant', 'admin']).
 */
export const requireRole = (role: UserRole | UserRole[]) => {
  const roles = Array.isArray(role) ? role : [role];
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.profile.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
};
