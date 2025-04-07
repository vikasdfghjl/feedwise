import mongoose, { Document, Schema } from 'mongoose';

// Category interface
export interface ICategory extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Category schema
const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      trim: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICategory>('Category', categorySchema);