import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware to handle errors
 */
export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Default error status and message
  let statusCode = 500;
  let message = 'Server Error';
  
  // Check if error is our ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  
  // Get stack trace if in development
  const stack = process.env.NODE_ENV === 'production' ? null : err.stack;
  
  // Log the error
  logger.error(`[${statusCode}] ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (stack) {
    logger.error(stack);
  }
  
  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'production' ? undefined : stack
  });
};

/**
 * Utility to catch async errors in controllers
 */
export const asyncHandler = (fn: Function) => (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};