import mongoose, { Document, Schema } from 'mongoose';

// Feed interface
export interface IFeed extends Document {
  title: string;
  url: string;
  favicon: string;
  category: string;
  tags: string[];
  lastUpdated: Date;
  unreadCount: number;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Feed schema
const feedSchema = new Schema<IFeed>(
  {
    title: {
      type: String,
      required: [true, 'Please add a feed title'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Please add a feed URL'],
      trim: true,
      unique: true,
    },
    favicon: {
      type: String,
      default: '/placeholder.svg',
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      ref: 'Category',
    },
    tags: [{
      type: String,
      ref: 'Tag',
    }],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
feedSchema.index({ title: 'text', url: 'text' });

export default mongoose.model<IFeed>('Feed', feedSchema);