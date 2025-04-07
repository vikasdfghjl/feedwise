import mongoose, { Document, Schema } from 'mongoose';

// Article interface
export interface IArticle extends Document {
  title: string;
  description: string;
  url: string;
  feedId: mongoose.Types.ObjectId;
  feedTitle: string;
  feedFavicon: string;
  author: string;
  publishDate: Date;
  tags: string[];
  imageUrl: string;
  isRead: boolean;
  isSaved: boolean;
  relevanceScore: number;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Article schema
const articleSchema = new Schema<IArticle>(
  {
    title: {
      type: String,
      required: [true, 'Please add an article title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Please add an article URL'],
      trim: true,
      unique: true,
    },
    feedId: {
      type: Schema.Types.ObjectId,
      ref: 'Feed',
      required: true,
    },
    feedTitle: {
      type: String,
      required: true,
    },
    feedFavicon: {
      type: String,
      default: '/placeholder.svg',
    },
    author: {
      type: String,
      default: 'Unknown',
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    tags: [{
      type: String,
      ref: 'Tag',
    }],
    imageUrl: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isSaved: {
      type: Boolean,
      default: false,
    },
    relevanceScore: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
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
articleSchema.index({ title: 'text', description: 'text' });
articleSchema.index({ publishDate: -1 }); // Index for sorting by publish date

export default mongoose.model<IArticle>('Article', articleSchema);