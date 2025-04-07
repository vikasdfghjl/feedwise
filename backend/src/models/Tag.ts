import mongoose, { Document, Schema } from 'mongoose';

// Tag interface
export interface ITag extends Document {
  name: string;
  color: string;
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
      unique: true,
      lowercase: true,
    },
    color: {
      type: String,
      required: [true, 'Please add a color for the tag'],
      default: '#3b82f6', // Default blue color
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITag>('Tag', tagSchema);