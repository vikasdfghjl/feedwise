import { Request, Response } from 'express';
import Article, { IArticle } from '../models/Article';
import Feed from '../models/Feed';
import mongoose from 'mongoose';

// Custom request type with user field
interface AuthRequest extends Request {
  user?: any;
}

/**
 * @desc    Get all articles for the logged-in user
 * @route   GET /api/articles
 * @access  Private
 */
export const getArticles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Filter options
    const feedId = req.query.feedId ? req.query.feedId : null;
    const tag = req.query.tag ? req.query.tag : null;
    const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : null;
    const isSaved = req.query.isSaved === 'true' ? true : null;
    
    // Build filter
    const filter: any = { userId: req.user._id };
    if (feedId) filter.feedId = feedId;
    if (tag) filter.tags = tag;
    if (isRead !== null) filter.isRead = isRead;
    if (isSaved !== null) filter.isSaved = isSaved;
    
    // Get articles
    const articles = await Article.find(filter)
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit);
      
    // Get total count
    const totalArticles = await Article.countDocuments(filter);
    
    res.json({
      articles,
      page,
      pages: Math.ceil(totalArticles / limit),
      total: totalArticles
    });
  } catch (error) {
    console.error('Error in getArticles:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Get article by ID
 * @route   GET /api/articles/:id
 * @access  Private
 */
export const getArticleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const article = await Article.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (article) {
      res.json(article);
    } else {
      res.status(404).json({ message: 'Article not found' });
    }
  } catch (error) {
    console.error('Error in getArticleById:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Mark article as read
 * @route   PUT /api/articles/:id/read
 * @access  Private
 */
export const markArticleAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const article = await Article.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }
    
    // If article is not already read, update unread count for feed
    if (!article.isRead) {
      const feed = await Feed.findById(article.feedId);
      if (feed && feed.unreadCount > 0) {
        feed.unreadCount -= 1;
        await feed.save();
      }
    }
    
    // Mark as read
    article.isRead = true;
    const updatedArticle = await article.save();
    
    res.json(updatedArticle);
  } catch (error) {
    console.error('Error in markArticleAsRead:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Mark article as unread
 * @route   PUT /api/articles/:id/unread
 * @access  Private
 */
export const markArticleAsUnread = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const article = await Article.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }
    
    // If article is already read, update unread count for feed
    if (article.isRead) {
      const feed = await Feed.findById(article.feedId);
      if (feed) {
        feed.unreadCount += 1;
        await feed.save();
      }
    }
    
    // Mark as unread
    article.isRead = false;
    const updatedArticle = await article.save();
    
    res.json(updatedArticle);
  } catch (error) {
    console.error('Error in markArticleAsUnread:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Toggle saved status of article
 * @route   PUT /api/articles/:id/save
 * @access  Private
 */
export const toggleSavedArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const article = await Article.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }
    
    // Toggle saved status
    article.isSaved = !article.isSaved;
    const updatedArticle = await article.save();
    
    res.json(updatedArticle);
  } catch (error) {
    console.error('Error in toggleSavedArticle:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Update article tags
 * @route   PUT /api/articles/:id/tags
 * @access  Private
 */
export const updateArticleTags = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const { tags } = req.body;
    
    const article = await Article.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }
    
    // Update tags
    article.tags = tags;
    const updatedArticle = await article.save();
    
    res.json(updatedArticle);
  } catch (error) {
    console.error('Error in updateArticleTags:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};