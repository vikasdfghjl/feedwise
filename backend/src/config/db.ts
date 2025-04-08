import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Add event listeners for MongoDB connection
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.error(`Stack trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
    process.exit(1);
  }
};

export default connectDB;