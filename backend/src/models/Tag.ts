import mongoose, { Document, Schema } from 'mongoose';

// Tag interface
export interface ITag extends Document {
  name: string;
  color: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Tag schema
const tagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: [true, 'Please add a tag name'],
      trim: true,
      lowercase: true,
    },
    color: {
      type: String,
      required: [true, 'Please add a color for the tag'],
      default: '#3b82f6', // Default blue color
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

// Compound index to ensure uniqueness of name per user
tagSchema.index({ name: 1, userId: 1 }, { unique: true });

export default mongoose.model<ITag>('Tag', tagSchema);