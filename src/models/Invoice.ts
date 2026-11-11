import mongoose, { Document, Model, Schema } from 'mongoose';
import { InvoiceStatus } from '../engine/state-machine';

export interface IInvoiceItem {
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

export interface IInvoiceAuditLog {
  action: string;
  fromStatus: InvoiceStatus;
  toStatus: InvoiceStatus;
  timestamp: Date;
  actor: string;
  notes?: string;
}

export interface IInvoice extends Document {
  organizationId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  publicAccessToken: string;

  // Point-in-time immutable snapshots
  organizationSnapshot: {
    name: string;
    email: string;
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
    };
    wireInstructions?: {
      bankRegion?: string;
      bankName?: string;
      accountName?: string;
      accountNumber?: string;
      routingNumber?: string;
      swiftCode?: string;
      instructions?: string;
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

  items: IInvoiceItem[];

  // Financial summary in cents
  subtotalCents: number;
  totalDiscountCents: number;
  totalTaxCents: number;
  grandTotalCents: number;
  paidCents: number;
  balanceDueCents: number;

  notes?: string;
  terms?: string;
  activityLog: IInvoiceAuditLog[];

  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
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

const InvoiceAuditLogSchema = new Schema<IInvoiceAuditLog>(
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

const InvoiceSchema = new Schema<IInvoice>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    invoiceNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void', 'refunded'],
      default: 'draft',
      index: true,
    },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    currency: { type: String, default: 'USD', uppercase: true },
    publicAccessToken: { type: String, required: true, unique: true, index: true },

    organizationSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
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
      },
      wireInstructions: {
        bankRegion: String,
        bankName: String,
        accountName: String,
        accountNumber: String,
        routingNumber: String,
        swiftCode: String,
        instructions: String,
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

    items: [InvoiceItemSchema],

    subtotalCents: { type: Number, required: true, default: 0 },
    totalDiscountCents: { type: Number, required: true, default: 0 },
    totalTaxCents: { type: Number, required: true, default: 0 },
    grandTotalCents: { type: Number, required: true, default: 0 },
    paidCents: { type: Number, required: true, default: 0 },
    balanceDueCents: { type: Number, required: true, default: 0 },

    notes: String,
    terms: String,
    activityLog: [InvoiceAuditLogSchema],
  },
  { timestamps: true }
);

InvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

