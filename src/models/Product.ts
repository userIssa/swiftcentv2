import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProduct extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  unitPriceCents: number;
  taxRate?: number;
  taxMethod?: 'exclusive' | 'inclusive';
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    unitPriceCents: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    taxMethod: { type: String, enum: ['exclusive', 'inclusive'], default: 'exclusive' },
  },
  { timestamps: true }
);

ProductSchema.index({ organizationId: 1, name: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

