import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getArticles,
  getArticleById,
  markArticleAsRead,
  markArticleAsUnread,
  toggleSavedArticle,
  updateArticleTags,
  getSavedArticles,
  getArticleSummary,
} from '../controllers/articleController';

const router = express.Router();

// All article routes are protected
router.get('/', protect, getArticles);
router.get('/saved', protect, getSavedArticles); // Endpoint for saved articles
router.get('/:id', protect, getArticleById);
router.get('/:id/summary', protect, getArticleSummary); // New endpoint for article summary

// Article status routes
router.put('/:id/read', protect, markArticleAsRead);
router.put('/:id/unread', protect, markArticleAsUnread);
router.put('/:id/save', protect, toggleSavedArticle);
router.put('/:id/tags', protect, updateArticleTags);

export default router;