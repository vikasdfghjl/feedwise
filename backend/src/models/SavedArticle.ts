import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedArticle extends Document {
  articleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  savedAt: Date;
}

const savedArticleSchema: Schema = new Schema(
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
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for faster lookups by user
savedArticleSchema.index({ userId: 1, articleId: 1 }, { unique: true });

export default mongoose.model<ISavedArticle>('SavedArticle', savedArticleSchema);