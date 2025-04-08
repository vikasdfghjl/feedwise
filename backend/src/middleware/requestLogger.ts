import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware to log HTTP requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log when the request starts
  logger.http(`${req.method} ${req.url} - Request received`);
  
  // Store the start time
  const start = Date.now();
  
  // When the response finishes
  res.on('finish', () => {
    // Calculate processing time
    const duration = Date.now() - start;
    
    // Get the status code
    const statusCode = res.statusCode;
    
    // Determine log level based on status code
    const logMethod = 
      statusCode >= 500 ? 'error' :
      statusCode >= 400 ? 'warn' :
      'http';
    
    // Format the log message
    const message = `${req.method} ${req.url} ${statusCode} - ${duration}ms`;
    
    // Log with appropriate level
    logger[logMethod](message);
  });
  
  next();
};