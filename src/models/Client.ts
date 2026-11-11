import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IClient extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  currency: string;
  taxId?: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  paymentTermsDays: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    currency: { type: String, default: 'USD', uppercase: true },
    taxId: { type: String, trim: true },
    billingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    paymentTermsDays: { type: Number, default: 30 },
    notes: String,
  },
  { timestamps: true }
);

ClientSchema.index({ organizationId: 1, email: 1 });

export const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);

