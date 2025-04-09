import mongoose, { Schema, Document } from 'mongoose';

export interface IArticleSummary extends Document {
  articleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const articleSummarySchema: Schema = new Schema(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for faster lookups
articleSummarySchema.index({ userId: 1, articleId: 1 }, { unique: true });

export default mongoose.model<IArticleSummary>('ArticleSummary', articleSummarySchema);