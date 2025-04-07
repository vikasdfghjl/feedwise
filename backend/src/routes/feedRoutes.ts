import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getFeeds,
  getFeedById,
  createFeed,
  updateFeed,
  deleteFeed,
  refreshFeed,
} from '../controllers/feedController';

const router = express.Router();

// All feed routes are protected
router.route('/')
  .get(protect, getFeeds)
  .post(protect, createFeed);

router.route('/:id')
  .get(protect, getFeedById)
  .put(protect, updateFeed)
  .delete(protect, deleteFeed);

// Special route for refreshing feed
router.post('/:id/refresh', protect, refreshFeed);

export default router;