import mongoose from 'mongoose';
import Article from '../models/Article';
import SavedArticle from '../models/SavedArticle';
import config from '../config/db';
import logger from '../utils/logger';

/**
 * Migration script to populate the SavedArticle collection with existing saved articles
 */
async function migrateSavedArticles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI);
    logger.info('Connected to MongoDB for migration');

    // Find all articles with isSaved=true
    const savedArticles = await Article.find({ isSaved: true });
    logger.info(`Found ${savedArticles.length} saved articles to migrate`);

    // Count for reporting
    let createdCount = 0;
    let skipCount = 0;

    // Process each saved article
    for (const article of savedArticles) {
      // Check if it's already in the SavedArticle collection
      const existingSavedArticle = await SavedArticle.findOne({
        articleId: article._id,
        userId: article.userId
      });

      if (!existingSavedArticle) {
        // Add to SavedArticle collection
        await SavedArticle.create({
          articleId: article._id,
          userId: article.userId,
          savedAt: article.updatedAt || new Date()
        });
        createdCount++;
      } else {
        skipCount++;
      }
    }

    logger.info(`Migration complete: ${createdCount} records created, ${skipCount} records skipped`);
    process.exit(0);
  } catch (error) {
    logger.error('Migration error:', error);
    process.exit(1);
  }
}

// Run the migration
migrateSavedArticles();