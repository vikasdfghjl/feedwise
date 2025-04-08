import { Request, Response } from 'express';
import Tag, { ITag } from '../models/Tag';
import Article, { IArticle } from '../models/Article';
import { IUser } from '../models/User';
import logger from '../utils/logger';
import { ApiError } from '../utils/errorUtils';
import mongoose, { Document } from 'mongoose';

// Define AuthRequest interface to extend Request with correct user type
interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * @desc    Get all tags
 * @route   GET /api/tags
 * @access  Private
 */
export const getTags = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const tags = await Tag.find({ userId: req.user._id });
    res.json(tags);
  } catch (error) {
    console.error('Error in getTags:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Get tag by ID
 * @route   GET /api/tags/:id
 * @access  Private
 */
export const getTagById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }
    
    const tag = await Tag.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (tag) {
      res.json(tag);
    } else {
      res.status(404).json({ message: 'Tag not found' });
    }
  } catch (error) {
    console.error('Error in getTagById:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Create a new tag
 * @route   POST /api/tags
 * @access  Private
 */
export const createTag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, color } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Check if tag already exists for this user
    const tagExists = await Tag.findOne({ 
      name: name.toLowerCase(),
      userId: req.user._id 
    });
    
    if (tagExists) {
      res.status(400).json({ message: 'Tag already exists' });
      return;
    }

    const tag = await Tag.create({ 
      name: name.toLowerCase(),
      color: color || '#3b82f6', // Default blue color
      userId: req.user._id
    });
    
    res.status(201).json(tag);
  } catch (error) {
    console.error('Error in createTag:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Update a tag
 * @route   PUT /api/tags/:id
 * @access  Private
 */
export const updateTag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }
    
    const { name, color } = req.body;
    
    // Find tag by ID and ensure it belongs to the current user
    const tag = await Tag.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (tag) {
      if (name) {
        // Check if another tag with this name already exists for this user
        if (name.toLowerCase() !== tag.name) {
          const existingTag = await Tag.findOne({ 
            name: name.toLowerCase(), 
            userId: req.user._id,
            _id: { $ne: tag._id } // Exclude current tag from check
          });
          
          if (existingTag) {
            res.status(400).json({ message: 'Another tag with this name already exists' });
            return;
          }
        }
        tag.name = name.toLowerCase();
      }
      
      if (color) tag.color = color;
      
      const updatedTag = await tag.save();
      res.json(updatedTag);
    } else {
      res.status(404).json({ message: 'Tag not found' });
    }
  } catch (error) {
    console.error('Error in updateTag:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Delete a tag
 * @route   DELETE /api/tags/:id
 * @access  Private
 */
export const deleteTag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }
    
    // Find tag by ID and ensure it belongs to the current user
    const tag = await Tag.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (tag) {
      await tag.deleteOne();
      res.json({ message: 'Tag removed' });
    } else {
      res.status(404).json({ message: 'Tag not found' });
    }
  } catch (error) {
    console.error('Error in deleteTag:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Scan all articles for content related to a tag
 * @route   POST /api/tags/scan-articles
 * @access  Private
 */
export const scanArticlesForTag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authorized');
    }
    
    const { tagName } = req.body;
    
    if (!tagName) {
      res.status(400).json({ message: 'Tag name is required' });
      return;
    }
    
    logger.debug(`Scanning articles for content related to tag: ${tagName}`);
    
    // Get all articles for this user - use lean() to get plain JavaScript objects
    const articles = await Article.find({ userId: req.user._id }).lean();
    
    if (articles.length === 0) {
      logger.debug('No articles found to scan');
      res.json({ message: 'No articles found to scan', taggedArticles: [] });
      return;
    }
    
    logger.debug(`Found ${articles.length} articles to scan for tag relevance`);
    
    // Array to store IDs of articles that are relevant to this tag
    const taggedArticleIds: string[] = [];
    
    // Ensure tag exists for this user
    let tag = await Tag.findOne({ name: tagName.toLowerCase(), userId: req.user._id });
    
    // If tag doesn't exist, create it
    if (!tag) {
      logger.debug(`Tag ${tagName} doesn't exist for this user, creating it`);
      // Generate a random color
      const colors = [
        '#3b82f6', '#10b981', '#6366f1', '#f59e0b', 
        '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      tag = await Tag.create({
        name: tagName.toLowerCase(),
        color: randomColor,
        userId: req.user._id
      });
    }
    
    // For each article, check if its content is relevant to the tag
    for (const article of articles) {
      // Using lean() above gives us plain JavaScript objects, so we can access _id directly
      const articleId = article._id.toString();
      
      // Convert text to lowercase for case-insensitive matching
      const tagNameLower = tagName.toLowerCase();
      
      // Check if article title or description contains the tag keyword
      const titleMatch = article.title.toLowerCase().includes(tagNameLower);
      const descriptionMatch = article.description.toLowerCase().includes(tagNameLower);
      
      // If any part of the article matches the tag, mark it as relevant
      if (titleMatch || descriptionMatch) {
        taggedArticleIds.push(articleId);
        
        // Update the article to include this tag if not already present
        if (!article.tags?.includes(tagNameLower)) {
          const updatedTags = article.tags || [];
          updatedTags.push(tagNameLower);
          
          // Update the article in the database
          await Article.findByIdAndUpdate(articleId, { tags: updatedTags });
          logger.debug(`Added tag ${tagNameLower} to article ${articleId}`);
        }
      }
    }
    
    logger.debug(`Found ${taggedArticleIds.length} articles relevant to tag ${tagName}`);
    
    res.json({
      message: `Found ${taggedArticleIds.length} articles relevant to tag ${tagName}`,
      taggedArticles: taggedArticleIds,
      tag: tag // Return the tag object so frontend can update state
    });
  } catch (error) {
    logger.error('Error in scanArticlesForTag:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};