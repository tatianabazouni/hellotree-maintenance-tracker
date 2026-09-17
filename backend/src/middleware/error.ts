import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors.js';
export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  void next;
  if (error instanceof ZodError)
    return void res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.flatten(),
      },
    });
  if (error instanceof AppError)
    return void res
      .status(error.status)
      .json({ error: { code: error.code, message: error.message } });
  console.error(error);
  res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
};
