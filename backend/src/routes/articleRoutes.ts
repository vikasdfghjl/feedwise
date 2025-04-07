import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getArticles,
  getArticleById,
  markArticleAsRead,
  markArticleAsUnread,
  toggleSavedArticle,
  updateArticleTags,
} from '../controllers/articleController';

const router = express.Router();

// All article routes are protected
router.get('/', protect, getArticles);
router.get('/:id', protect, getArticleById);

// Article status routes
router.put('/:id/read', protect, markArticleAsRead);
router.put('/:id/unread', protect, markArticleAsUnread);
router.put('/:id/save', protect, toggleSavedArticle);
router.put('/:id/tags', protect, updateArticleTags);

export default router;