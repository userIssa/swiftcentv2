import mongoose, { Document, Model, Schema } from 'mongoose';
import type { CustomTemplateConfig } from '../lib/custom-template';

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'approved'
  | 'converted'
  | 'declined';

export interface IQuoteItem {
  id?: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  grossBeforeDiscountCents: number;
  discountCents: number;
  netSubtotalCents: number;
  lineTaxCents: number;
  lineTotalCents: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  taxRates?: Array<{
    name: string;
    rate: number;
    method: 'exclusive' | 'inclusive';
  }>;
}

export interface IQuoteAuditLog {
  action: string;
  fromStatus: QuoteStatus;
  toStatus: QuoteStatus;
  timestamp: Date;
  actor: string;
  notes?: string;
}

export interface IQuote extends Document {
  organizationId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  quoteNumber: string;
  status: QuoteStatus;
  issueDate: Date;
  validUntil: Date;
  currency: string;
  publicAccessToken: string;

  // Point-in-time immutable company & client snapshots
  organizationSnapshot: {
    name: string;
    email: string;
    phone?: string;
    website?: string;
    tagline?: string;
    taxId?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    branding?: {
      logoUrl?: string;
      primaryColor?: string;
      customTemplate?: CustomTemplateConfig | null;
    };
  };

  clientSnapshot: {
    name: string;
    email: string;
    phone?: string;
    taxId?: string;
    billingAddress?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };

  items: IQuoteItem[];

  subtotalCents: number;
  totalDiscountCents: number;
  totalTaxCents: number;
  grandTotalCents: number;

  notes?: string;
  terms?: string;

  convertedInvoiceId?: mongoose.Types.ObjectId;
  activityLog: IQuoteAuditLog[];

  createdAt: Date;
  updatedAt: Date;
}

const QuoteItemSchema = new Schema<IQuoteItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.0001 },
    unitPriceCents: { type: Number, required: true, min: 0 },
    grossBeforeDiscountCents: { type: Number, required: true },
    discountCents: { type: Number, default: 0 },
    netSubtotalCents: { type: Number, required: true },
    lineTaxCents: { type: Number, default: 0 },
    lineTotalCents: { type: Number, required: true },
    discount: {
      type: { type: String, enum: ['percentage', 'fixed'] },
      value: { type: Number, default: 0 },
    },
    taxRates: [
      {
        name: String,
        rate: Number,
        method: { type: String, enum: ['exclusive', 'inclusive'], default: 'exclusive' },
      },
    ],
  },
  { _id: true }
);

const QuoteAuditLogSchema = new Schema<IQuoteAuditLog>(
  {
    action: { type: String, required: true },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    actor: { type: String, default: 'system' },
    notes: String,
  },
  { _id: false }
);

const QuoteSchema = new Schema<IQuote>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    quoteNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'approved', 'converted', 'declined'],
      default: 'draft',
      index: true,
    },
    issueDate: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date, required: true },
    currency: { type: String, default: 'USD', uppercase: true },
    publicAccessToken: { type: String, required: true, unique: true, index: true },

    organizationSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: String,
      website: String,
      tagline: String,
      taxId: String,
      address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
      },
      branding: {
        logoUrl: String,
        primaryColor: String,
        customTemplate: { type: Schema.Types.Mixed, default: undefined },
      },
    },

    clientSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: String,
      taxId: String,
      billingAddress: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
      },
    },

    items: [QuoteItemSchema],

    subtotalCents: { type: Number, required: true, default: 0 },
    totalDiscountCents: { type: Number, required: true, default: 0 },
    totalTaxCents: { type: Number, required: true, default: 0 },
    grandTotalCents: { type: Number, required: true, default: 0 },

    notes: String,
    terms: String,

    convertedInvoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    activityLog: [QuoteAuditLogSchema],
  },
  { timestamps: true }
);

QuoteSchema.index({ organizationId: 1, quoteNumber: 1 }, { unique: true });

export const Quote: Model<IQuote> =
  (mongoose.models &&
  mongoose.models.Quote &&
  mongoose.models.Quote.schema.paths['organizationSnapshot.phone'] &&
  mongoose.models.Quote.schema.paths['organizationSnapshot.branding.customTemplate']
    ? mongoose.models.Quote
    : null) ||
  (() => {
    if (mongoose.models && mongoose.models.Quote) {
      delete mongoose.models.Quote;
    }
    return mongoose.model<IQuote>('Quote', QuoteSchema);
  })();

