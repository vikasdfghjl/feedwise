import express from 'express';
import { protect, adminMiddleware } from '../middleware/authMiddleware';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';

const router = express.Router();

// Get all categories - public
router.get('/', getCategories);

// Get single category by ID - public
router.get('/:id', getCategoryById);

// Admin only routes - protected
router.post('/', protect, adminMiddleware, createCategory);
router.put('/:id', protect, adminMiddleware, updateCategory);
router.delete('/:id', protect, adminMiddleware, deleteCategory);

export default router;