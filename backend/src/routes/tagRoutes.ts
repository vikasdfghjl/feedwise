import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} from '../controllers/tagController';

const router = express.Router();

// All tag routes are protected
router.get('/', protect, getTags);
router.get('/:id', protect, getTagById);
router.post('/', protect, createTag);
router.put('/:id', protect, updateTag);
router.delete('/:id', protect, deleteTag);

export default router;