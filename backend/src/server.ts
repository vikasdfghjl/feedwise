import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import categoryRoutes from './routes/categoryRoutes';
import tagRoutes from './routes/tagRoutes';
import feedRoutes from './routes/feedRoutes';
import articleRoutes from './routes/articleRoutes';
import logger from './utils/logger';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './utils/errorUtils';

// Load environment variables
dotenv.config();

// Ensure logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Log uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack || 'No stack trace available');
  process.exit(1);
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Add request logger middleware
app.use(requestLogger);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/feeds', feedRoutes);
app.use('/api/articles', articleRoutes);

// Home route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to FeedWise API' });
});

// Error handler middleware
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack || 'No stack trace available');
  server.close(() => {
    process.exit(1);
  });
});

export default app;