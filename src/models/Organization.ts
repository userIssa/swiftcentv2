import mongoose, { Document, Model, Schema } from 'mongoose';
import type { CustomTemplateConfig } from '../lib/custom-template';

export interface IOrganization extends Document {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  tagline?: string;
  ownerId?: mongoose.Types.ObjectId | string;
  currency: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  quotePrefix: string;
  nextQuoteNumber: number;
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
  paymentGateways?: {
    stripeEnabled?: boolean;
    stripePublishableKey?: string;
    stripeSecretKey?: string;
    stripeWebhookSecret?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    tagline: { type: String, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    currency: { type: String, default: 'USD', uppercase: true },
    invoicePrefix: { type: String, default: 'INV', trim: true },
    nextInvoiceNumber: { type: Number, default: 1001 },
    quotePrefix: { type: String, default: 'QTE', trim: true },
    nextQuoteNumber: { type: Number, default: 1001 },
    taxId: { type: String, trim: true },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    branding: {
      logoUrl: String,
      primaryColor: { type: String, default: '#2563eb' },
      customTemplate: { type: Schema.Types.Mixed, default: undefined },
    },
    paymentGateways: {
      stripeEnabled: { type: Boolean, default: false },
      stripePublishableKey: String,
      stripeSecretKey: String,
      stripeWebhookSecret: String,
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
  { timestamps: true }
);

export const Organization: Model<IOrganization> =
  (mongoose.models &&
  mongoose.models.Organization &&
  mongoose.models.Organization.schema.paths.ownerId &&
  mongoose.models.Organization.schema.paths.phone &&
  mongoose.models.Organization.schema.paths['wireInstructions.bankRegion'] &&
  mongoose.models.Organization.schema.paths['branding.customTemplate']
    ? mongoose.models.Organization
    : null) ||
  (() => {
    if (mongoose.models && mongoose.models.Organization) {
      delete mongoose.models.Organization;
    }
    return mongoose.model<IOrganization>('Organization', OrganizationSchema);
  })();

