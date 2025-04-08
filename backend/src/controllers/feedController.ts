import { Request, Response } from 'express';
import Feed, { IFeed } from '../models/Feed';
import Article from '../models/Article';
import axios from 'axios';
import Parser from 'rss-parser';
import mongoose from 'mongoose';

// Create RSS parser instance
const parser = new Parser({
  timeout: 30000, // Increased timeout for slower feeds
  headers: {
    'User-Agent': 'FeedWise RSS Reader/1.0 (https://feedwise.app)'
  }
});

// Custom request type with user field
interface AuthRequest extends Request {
  user?: any;
}

// Define interface for feed items to fix the implicit any type
interface FeedItem {
  title?: string;
  contentSnippet?: string;
  content?: string;
  link?: string;
  creator?: string;
  author?: string | {
    name?: string | string[];
    [key: string]: any;
  } | any[];
  pubDate?: string;
  enclosure?: {
    url: string;
  };
  [key: string]: any; // Allow for other properties
}

/**
 * @desc    Get all feeds for the logged-in user
 * @route   GET /api/feeds
 * @access  Private
 */
export const getFeeds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const feeds = await Feed.find({ userId: req.user._id });
    res.json(feeds);
  } catch (error) {
    console.error('Error in getFeeds:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Get feed by ID
 * @route   GET /api/feeds/:id
 * @access  Private
 */
export const getFeedById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const feed = await Feed.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (feed) {
      res.json(feed);
    } else {
      res.status(404).json({ message: 'Feed not found' });
    }
  } catch (error) {
    console.error('Error in getFeedById:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Create a new feed
 * @route   POST /api/feeds
 * @access  Private
 */
export const createFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const { url, category, tags } = req.body;
    
    // Check if feed with this URL already exists for the user
    const feedExists = await Feed.findOne({ 
      url, 
      userId: req.user._id 
    });
    
    if (feedExists) {
      res.status(400).json({ message: 'Feed already exists' });
      return;
    }
    
    // Fetch and parse the feed
    try {
      const feed = await parser.parseURL(url);
      
      // Try to get the favicon
      let favicon = '/placeholder.svg';
      try {
        const siteUrl = new URL(url);
        const baseUrl = `${siteUrl.protocol}//${siteUrl.hostname}`;
        favicon = `${baseUrl}/favicon.ico`;
        
        // Check if favicon exists
        await axios.head(favicon);
      } catch (error) {
        // If error, use default favicon
        favicon = '/placeholder.svg';
      }
      
      // Create new feed
      const newFeed = await Feed.create({
        title: feed.title || url,
        url,
        favicon,
        category,
        tags: tags || [],
        lastUpdated: new Date(),
        unreadCount: feed.items.length || 0,
        userId: req.user._id,
      });
      
      // Create articles from feed items
      if (feed.items && feed.items.length > 0) {
        const articlesToCreate = feed.items.map((item: FeedItem) => {
          // Extract author correctly, handling complex author objects
          let authorString = 'Unknown';
          
          // Handle different types of author fields
          if (item.author) {
            if (typeof item.author === 'string') {
              authorString = item.author;
            } else if (typeof item.author === 'object') {
              // Try to extract name from complex author object
              if (!Array.isArray(item.author) && item.author.name) {
                if (Array.isArray(item.author.name) && item.author.name.length > 0) {
                  authorString = String(item.author.name[0]);
                } else if (typeof item.author.name === 'string') {
                  authorString = item.author.name;
                }
              } else if (Array.isArray(item.author) && item.author.length > 0) {
                // Sometimes author can be an array
                authorString = String(item.author[0]);
              } else {
                // Fallback to creator or stringify if possible
                authorString = item.creator || 'Unknown';
              }
            }
          } else if (item.creator) {
            authorString = item.creator;
          }
          
          // Ensure description is never empty
          let description = item.contentSnippet || item.content || '';
          
          // If description is empty or only whitespace, create a fallback description
          if (!description || description.trim() === '') {
            description = item.title ? `Article about ${item.title}` : 'No description available';
          }
          
          // Trim the description to remove any leading/trailing whitespace
          description = description.trim();
          
          return {
            title: item.title || 'No title',
            description: description,
            url: item.link || url,
            feedId: newFeed._id,
            feedTitle: newFeed.title,
            feedFavicon: newFeed.favicon,
            author: authorString,
            publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
            tags: tags || [],
            imageUrl: item.enclosure?.url || '',
            isRead: false,
            isSaved: false,
            relevanceScore: 0.5, // Default relevance score
            userId: req.user._id,
          };
        });
        
        await Article.insertMany(articlesToCreate);
      }
      
      res.status(201).json(newFeed);
    } catch (error) {
      console.error('Error parsing feed:', error);
      res.status(400).json({ message: 'Invalid feed URL or format' });
    }
  } catch (error) {
    console.error('Error in createFeed:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Update a feed
 * @route   PUT /api/feeds/:id
 * @access  Private
 */
export const updateFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const { title, category, tags } = req.body;
    
    const feed = await Feed.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (feed) {
      if (title) feed.title = title;
      if (category) feed.category = category;
      if (tags) feed.tags = tags;
      
      const updatedFeed = await feed.save();
      res.json(updatedFeed);
    } else {
      res.status(404).json({ message: 'Feed not found' });
    }
  } catch (error) {
    console.error('Error in updateFeed:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Delete a feed
 * @route   DELETE /api/feeds/:id
 * @access  Private
 */
export const deleteFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const feed = await Feed.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (feed) {
      // Delete all articles associated with this feed
      await Article.deleteMany({ feedId: feed._id });
      
      // Delete the feed
      await feed.deleteOne();
      res.json({ message: 'Feed removed' });
    } else {
      res.status(404).json({ message: 'Feed not found' });
    }
  } catch (error) {
    console.error('Error in deleteFeed:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Refresh a feed (fetch new articles)
 * @route   POST /api/feeds/:id/refresh
 * @access  Private
 */
export const refreshFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const feed = await Feed.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (!feed) {
      res.status(404).json({ message: 'Feed not found' });
      return;
    }
    
    // Fetch and parse the feed
    try {
      const parsedFeed = await parser.parseURL(feed.url);
      
      let newArticlesCount = 0;
      
      // Process each feed item
      if (parsedFeed.items && parsedFeed.items.length > 0) {
        for (const item of parsedFeed.items) {
          // Check if article already exists
          const existingArticle = await Article.findOne({ 
            url: item.link,
            userId: req.user._id 
          });
          
          if (!existingArticle) {
            // Extract author correctly, handling complex author objects
            let authorString = 'Unknown';
            
            // Handle different types of author fields
            if (item.author) {
              if (typeof item.author === 'string') {
                authorString = item.author;
              } else if (typeof item.author === 'object') {
                // Try to extract name from complex author object
                if (!Array.isArray(item.author) && item.author.name) {
                  if (Array.isArray(item.author.name) && item.author.name.length > 0) {
                    authorString = String(item.author.name[0]);
                  } else if (typeof item.author.name === 'string') {
                    authorString = item.author.name;
                  }
                } else if (Array.isArray(item.author) && item.author.length > 0) {
                  // Sometimes author can be an array
                  authorString = String(item.author[0]);
                } else {
                  // Fallback to creator or stringify if possible
                  authorString = item.creator || 'Unknown';
                }
              }
            } else if (item.creator) {
              authorString = item.creator;
            }

            // Ensure description is never empty
            let description = item.contentSnippet || item.content || '';
            
            // If description is empty or only whitespace, create a fallback description
            if (!description || description.trim() === '') {
              description = item.title ? `Article about ${item.title}` : 'No description available';
            }
            
            // Trim the description to remove any leading/trailing whitespace
            description = description.trim();

            // Create new article
            await Article.create({
              title: item.title || 'No title',
              description: description,
              url: item.link || feed.url,
              feedId: feed._id,
              feedTitle: feed.title,
              feedFavicon: feed.favicon,
              author: authorString,
              publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
              tags: feed.tags || [],
              imageUrl: item.enclosure?.url || '',
              isRead: false,
              isSaved: false,
              relevanceScore: 0.5, // Default relevance score
              userId: req.user._id,
            });
            
            newArticlesCount++;
          }
        }
      }
      
      // Update feed
      feed.lastUpdated = new Date();
      feed.unreadCount += newArticlesCount;
      feed.hasNewContent = false; // Clear the hasNewContent flag after refreshing
      await feed.save();
      
      res.json({ 
        message: `Feed refreshed. ${newArticlesCount} new articles found.`,
        feed
      });
    } catch (error) {
      console.error('Error refreshing feed:', error);
      res.status(400).json({ message: 'Error refreshing feed' });
    }
  } catch (error) {
    console.error('Error in refreshFeed:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * @desc    Check if a feed has new content available
 * @route   GET /api/feeds/:id/check-new-content
 * @access  Private
 */
export const checkNewFeedContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const feed = await Feed.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (!feed) {
      res.status(404).json({ message: 'Feed not found' });
      return;
    }
    
    try {
      // Fetch just the feed headers to check for updates without downloading all content
      const response = await axios.get(feed.url, {
        headers: {
          'User-Agent': 'FeedWise RSS Reader/1.0 (https://feedwise.app)',
          'If-Modified-Since': new Date(feed.lastUpdated).toUTCString()
        },
        validateStatus: (status) => {
          return status === 200 || status === 304; // Accept 304 Not Modified as success
        }
      });
      
      // If server returns 304 Not Modified, there's no new content
      if (response.status === 304) {
        res.json({ hasNewContent: false });
        return;
      }
      
      // If we get here, we need to check if there are actually new items
      // We only parse the feed headers and first few items to avoid heavy processing
      const parsedFeed = await parser.parseURL(feed.url);
      
      let hasNewContent = false;
      
      // Check if the latest item is newer than our last update
      if (parsedFeed.items && parsedFeed.items.length > 0) {
        // Get the most recent article date from the feed
        const mostRecentItem = parsedFeed.items[0]; // Usually feeds are sorted by date desc
        if (mostRecentItem.pubDate) {
          const itemDate = new Date(mostRecentItem.pubDate);
          const feedLastUpdated = new Date(feed.lastUpdated);
          
          // Check if this item is newer than our last update
          if (itemDate > feedLastUpdated) {
            hasNewContent = true;
          }
        }
        
        // Additional check - look for any items with links we don't have yet
        // This is useful for feeds that don't have proper date info
        if (!hasNewContent && parsedFeed.items.length > 0) {
          // We'll check just the first few items to keep it lightweight
          const itemsToCheck = parsedFeed.items.slice(0, 5);
          
          for (const item of itemsToCheck) {
            if (!item.link) continue;
            
            // Check if we already have this article
            const existingArticle = await Article.findOne({
              url: item.link,
              feedId: feed._id,
              userId: req.user._id
            });
            
            if (!existingArticle) {
              hasNewContent = true;
              break;
            }
          }
        }
      }
      
      res.json({ hasNewContent });
    } catch (error) {
      console.error('Error checking feed for new content:', error);
      // If there's an error checking, we'll assume there might be new content
      // This ensures the user can try refreshing if needed
      res.json({ hasNewContent: true });
    }
  } catch (error) {
    console.error('Error in checkNewFeedContent:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};