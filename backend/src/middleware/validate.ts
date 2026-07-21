import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Validates a request part against a Zod schema. On success the parsed
 * (and coerced) data replaces the original part. On failure returns 400.
 */
export const validate = (schema: ZodSchema, part: RequestPart = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten(),
      });
      return;
    }
    // Reassign parsed data. For query/params we mutate keys to avoid
    // replacing read-only getters on some Express versions.
    if (part === 'body') {
      req.body = result.data;
    } else {
      Object.assign(req[part], result.data);
    }
    next();
  };
};
