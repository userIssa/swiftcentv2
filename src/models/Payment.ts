import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPayment extends Document {
  organizationId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  amountCents: number;
  currency: string;
  paymentMethod: 'stripe' | 'credit_card' | 'bank_transfer' | 'cash' | 'manual';
  transactionReference?: string;
  notes?: string;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    amountCents: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'USD', uppercase: true },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'credit_card', 'bank_transfer', 'cash', 'manual'],
      default: 'manual',
    },
    transactionReference: { type: String, trim: true },
    notes: String,
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

