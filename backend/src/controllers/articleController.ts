import { Request, Response } from 'express';
import Article, { IArticle } from '../models/Article';
import SavedArticle from '../models/SavedArticle';
import Feed from '../models/Feed';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { asyncHandler, ApiError } from '../utils/errorUtils';

// Custom request type with user field
interface AuthRequest extends Request {
  user?: any;
}

/**
 * @desc    Get all articles for the logged-in user
 * @route   GET /api/articles
 * @access  Private
 */
export const getArticles = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  
  // Filter options
  const feedId = req.query.feedId ? req.query.feedId : null;
  const tag = req.query.tag ? req.query.tag : null;
  const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : null;
  const isSaved = req.query.isSaved === 'true' ? true : null;
  
  // Check if this is a request from the sidebar for saved articles
  const isFromSidebar = req.query.source === 'sidebar' && isSaved;
  
  logger.debug(`Fetching articles with filters: feedId=${feedId}, tag=${tag}, isRead=${isRead}, isSaved=${isSaved}, isFromSidebar=${isFromSidebar}`);
  
  // Special case for saved articles - use the SavedArticle collection for better performance
  if (isSaved) {
    logger.debug('Fetching saved articles using the SavedArticle collection');
    
    // Get saved article IDs for this user
    const savedArticlesQuery = SavedArticle.find({ userId: req.user._id })
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const [savedArticles, totalSaved] = await Promise.all([
      savedArticlesQuery.exec(),
      SavedArticle.countDocuments({ userId: req.user._id })
    ]);
    
    // Extract the article IDs
    const articleIds = savedArticles.map(item => item.articleId);
    
    // If no saved articles found, return empty result
    if (articleIds.length === 0) {
      res.json({
        articles: [],
        page,
        pages: Math.ceil(totalSaved / limit),
        total: totalSaved
      });
      return;
    }
    
    // Additional filters for the article lookup
    const articleFilter: any = { 
      _id: { $in: articleIds },
      userId: req.user._id
    };
    if (feedId) articleFilter.feedId = feedId;
    if (tag) articleFilter.tags = tag;
    if (isRead !== null) articleFilter.isRead = isRead;
    
    // Get the full article data
    const articles: IArticle[] = await Article.find(articleFilter);
    
    // Sort articles to match the saved order
    const sortedArticles = articleIds.map(id => 
      articles.find((article: IArticle) => 
        article._id && article._id.toString() === id.toString()
      )
    ).filter(Boolean);
    
    logger.debug(`Retrieved ${sortedArticles.length} saved articles out of ${totalSaved} total`);
    
    res.json({
      articles: sortedArticles,
      page,
      pages: Math.ceil(totalSaved / limit),
      total: totalSaved
    });
    return;
  }
  
  // Regular article fetching for non-saved filters
  const filter: any = { userId: req.user._id };
  if (feedId) filter.feedId = feedId;
  if (tag) filter.tags = tag;
  if (isRead !== null) filter.isRead = isRead;
  
  // Get articles
  const articles = await Article.find(filter)
    .sort({ publishDate: -1 })
    .skip(skip)
    .limit(limit);
    
  // Get total count
  const totalArticles = await Article.countDocuments(filter);
  
  logger.debug(`Retrieved ${articles.length} articles out of ${totalArticles} total`);
  
  res.json({
    articles,
    page,
    pages: Math.ceil(totalArticles / limit),
    total: totalArticles
  });
});

/**
 * @desc    Get article by ID
 * @route   GET /api/articles/:id
 * @access  Private
 */
export const getArticleById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized');
  }

  logger.debug(`Fetching article with ID: ${req.params.id}`);
  
  const article = await Article.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  
  if (article) {
    res.json(article);
  } else {
    logger.warn(`Article with ID ${req.params.id} not found for user ${req.user._id}`);
    throw new ApiError(404, 'Article not found');
  }
});

/**
 * @desc    Mark article as read
 * @route   PUT /api/articles/:id/read
 * @access  Private
 */
export const markArticleAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized');
  }

  logger.debug(`Marking article ${req.params.id} as read`);
  
  const article = await Article.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  
  if (!article) {
    logger.warn(`Article with ID ${req.params.id} not found for user ${req.user._id}`);
    throw new ApiError(404, 'Article not found');
  }
  
  // If article is not already read, update unread count for feed
  if (!article.isRead) {
    const feed = await Feed.findById(article.feedId);
    if (feed && feed.unreadCount > 0) {
      feed.unreadCount -= 1;
      await feed.save();
      logger.debug(`Decreased unread count for feed ${article.feedId} to ${feed.unreadCount}`);
    }
  }
  
  // Mark as read
  article.isRead = true;
  const updatedArticle = await article.save();
  
  res.json(updatedArticle);
});

/**
 * @desc    Mark article as unread
 * @route   PUT /api/articles/:id/unread
 * @access  Private
 */
export const markArticleAsUnread = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized');
  }

  logger.debug(`Marking article ${req.params.id} as unread`);
  
  const article = await Article.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  
  if (!article) {
    logger.warn(`Article with ID ${req.params.id} not found for user ${req.user._id}`);
    throw new ApiError(404, 'Article not found');
  }
  
  // If article is already read, update unread count for feed
  if (article.isRead) {
    const feed = await Feed.findById(article.feedId);
    if (feed) {
      feed.unreadCount += 1;
      await feed.save();
      logger.debug(`Increased unread count for feed ${article.feedId} to ${feed.unreadCount}`);
    }
  }
  
  // Mark as unread
  article.isRead = false;
  const updatedArticle = await article.save();
  
  res.json(updatedArticle);
});

/**
 * @desc    Toggle saved status of article
 * @route   PUT /api/articles/:id/save
 * @access  Private
 */
export const toggleSavedArticle = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized');
  }

  logger.debug(`Toggling saved status for article ${req.params.id}`);
  
  const article = await Article.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  
  if (!article) {
    logger.warn(`Article with ID ${req.params.id} not found for user ${req.user._id}`);
    throw new ApiError(404, 'Article not found');
  }
  
  // Check if article is already in SavedArticle collection
  const existingSavedArticle = await SavedArticle.findOne({
    articleId: article._id,
    userId: req.user._id
  });
  
  // Update the isSaved flag in the original article
  const wasSaved = article.isSaved;
  article.isSaved = !wasSaved;
  await article.save();
  
  if (!wasSaved) {
    // If not previously saved, add it to SavedArticle collection
    if (!existingSavedArticle) {
      await SavedArticle.create({
        articleId: article._id,
        userId: req.user._id,
        savedAt: new Date()
      });
      logger.debug(`Article ${req.params.id} added to SavedArticle collection`);
    }
  } else {
    // If previously saved, remove it from SavedArticle collection
    if (existingSavedArticle) {
      await SavedArticle.deleteOne({
        articleId: article._id,
        userId: req.user._id
      });
      logger.debug(`Article ${req.params.id} removed from SavedArticle collection`);
    }
  }
  
  logger.debug(`Article ${req.params.id} saved status is now: ${article.isSaved}`);
  
  res.json(article);
});

/**
 * @desc    Update article tags
 * @route   PUT /api/articles/:id/tags
 * @access  Private
 */
export const updateArticleTags = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized');
  }

  const { tags } = req.body;
  
  logger.debug(`Updating tags for article ${req.params.id}: ${JSON.stringify(tags)}`);
  
  const article = await Article.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  
  if (!article) {
    logger.warn(`Article with ID ${req.params.id} not found for user ${req.user._id}`);
    throw new ApiError(404, 'Article not found');
  }
  
  // Update tags
  article.tags = tags;
  const updatedArticle = await article.save();
  
  res.json(updatedArticle);
});

/**
 * @desc    Get saved articles for the logged-in user
 * @route   GET /api/articles/saved
 * @access  Private
 */
export const getSavedArticles = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  
  // Filter options
  const feedId = req.query.feedId ? req.query.feedId : null;
  const tag = req.query.tag ? req.query.tag : null;
  const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : null;
  
  logger.debug(`Fetching saved articles with filters: feedId=${feedId}, tag=${tag}, isRead=${isRead}`);
  
  // Get saved article IDs for this user
  const savedArticlesQuery = SavedArticle.find({ userId: req.user._id })
    .sort({ savedAt: -1 })
    .skip(skip)
    .limit(limit);
  
  // Get total count for pagination
  const [savedArticles, totalSaved] = await Promise.all([
    savedArticlesQuery.exec(),
    SavedArticle.countDocuments({ userId: req.user._id })
  ]);
  
  // Extract the article IDs
  const articleIds = savedArticles.map(item => item.articleId);
  
  // If no saved articles found, return empty result
  if (articleIds.length === 0) {
    res.json({
      articles: [],
      page,
      pages: Math.ceil(totalSaved / limit),
      total: totalSaved
    });
    return;
  }
  
  // Additional filters for the article lookup
  const articleFilter: any = { 
    _id: { $in: articleIds },
    userId: req.user._id
  };
  if (feedId) articleFilter.feedId = feedId;
  if (tag) articleFilter.tags = tag;
  if (isRead !== null) articleFilter.isRead = isRead;
  
  // Get the full article data
  const articles: IArticle[] = await Article.find(articleFilter);
  
  // Sort articles to match the saved order
  const sortedArticles = articleIds.map(id => 
    articles.find((article: IArticle) => 
      article._id && article._id.toString() === id.toString()
    )
  ).filter(Boolean);
  
  logger.debug(`Retrieved ${sortedArticles.length} saved articles out of ${totalSaved} total`);
  
  res.json({
    articles: sortedArticles,
    page,
    pages: Math.ceil(totalSaved / limit),
    total: totalSaved
  });
});