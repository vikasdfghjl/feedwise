import { Request, Response } from 'express';
import Tag, { ITag } from '../models/Tag';

/**
 * @desc    Get all tags
 * @route   GET /api/tags
 * @access  Private
 */
export const getTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const tags = await Tag.find();
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
export const getTagById = async (req: Request, res: Response): Promise<void> => {
  try {
    const tag = await Tag.findById(req.params.id);
    
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
export const createTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, color } = req.body;

    // Check if tag already exists
    const tagExists = await Tag.findOne({ name: name.toLowerCase() });
    if (tagExists) {
      res.status(400).json({ message: 'Tag already exists' });
      return;
    }

    const tag = await Tag.create({ 
      name: name.toLowerCase(),
      color: color || '#3b82f6', // Default blue color
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
export const updateTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, color } = req.body;
    
    const tag = await Tag.findById(req.params.id);
    
    if (tag) {
      if (name) tag.name = name.toLowerCase();
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
export const deleteTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const tag = await Tag.findById(req.params.id);
    
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