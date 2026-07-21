import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';
import { isProduction } from '../config/env';

/** 404 handler for unmatched routes. */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

/** Central error handler. Must be the last middleware registered. */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack, details: err.details });
    } else {
      logger.warn(`${err.statusCode} ${err.message}`);
    }
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  const error = err as Error;
  logger.error(error?.message ?? 'Unknown error', { stack: error?.stack });
  res.status(500).json({
    error: 'Internal server error',
    ...(isProduction ? {} : { message: error?.message }),
  });
};
