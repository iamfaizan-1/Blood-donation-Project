import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { config } from '../config/env.js';

export const globalErrorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Resource not found / Invalid ID format';
  } else if ((err as any).code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered (email already exists)';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};
