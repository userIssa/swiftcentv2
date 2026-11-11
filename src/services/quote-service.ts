import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/mongodb';
import { Organization } from '../models/Organization';
import { Client } from '../models/Client';
import { IQuote, IQuoteItem, Quote } from '../models/Quote';
import { Invoice } from '../models/Invoice';
import { calculateInvoice } from '../engine/calculator';
import { normalizeCurrencyCode } from '../lib/currencies';
import { RawLineItem } from '../types/financial';

export interface CreateQuoteInput {
  organizationId: string;
  clientId: string;
  quoteNumber?: string;
  issueDate?: Date | string;
  validUntil: Date | string;
  currency?: string;
  items: RawLineItem[];
  notes?: string;
  terms?: string;
  actor?: string;
}

export class QuoteService {
  static async createQuote(input: CreateQuoteInput): Promise<IQuote> {
    await connectToDatabase();

    const org = await Organization.findById(input.organizationId);
    if (!org) {
      throw new Error(`Organization ${input.organizationId} not found`);
    }

    const client = await Client.findById(input.clientId);
    if (!client) {
      throw new Error(`Client not found`);
    }

    // Safe collision-proof sequential numbering
    let quoteNumber = input.quoteNumber;
    if (!quoteNumber) {
      const existingQts = await Quote.find({ organizationId: org._id }).select('quoteNumber');
      const existingSet = new Set(existingQts.map((q) => q.quoteNumber));
      const prefix = org.quotePrefix || 'QTE';
      let currentSeq =
        typeof org.nextQuoteNumber === 'number' && !isNaN(org.nextQuoteNumber) && org.nextQuoteNumber >= 1
          ? org.nextQuoteNumber
          : 1001;

      while (existingSet.has(`${prefix}-${currentSeq.toString().padStart(5, '0')}`)) {
        currentSeq++;
      }
      quoteNumber = `${prefix}-${currentSeq.toString().padStart(5, '0')}`;

      await Organization.findByIdAndUpdate(input.organizationId, {
        $set: { nextQuoteNumber: currentSeq + 1 },
      });
    }

    // Calculate financials
    const calc = calculateInvoice(input.items, 0);

    // Unguessable token for public portal
    const publicAccessToken = crypto.randomBytes(24).toString('hex');

    // Freeze business branding snapshot with guaranteed fallbacks
    const organizationSnapshot = {
      name: org.name || 'SwiftCent Merchant',
      email: org.email || 'billing@swiftcent.dev',
      taxId: org.taxId,
      address: org.address,
      branding: org.branding,
    };

    const clientSnapshot = {
      name: client.name || 'Client',
      email: client.email || 'client@example.com',
      phone: client.phone,
      taxId: client.taxId,
      billingAddress: client.billingAddress,
    };

    const formattedItems: IQuoteItem[] = calc.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      grossBeforeDiscountCents: item.grossBeforeDiscountCents,
      discountCents: item.discountCents,
      netSubtotalCents: item.netSubtotalCents,
      lineTaxCents: item.lineTaxCents,
      lineTotalCents: item.lineTotalCents,
      taxRates: item.taxes.map((t) => ({
        name: t.name,
        rate: t.rate,
        method: t.method,
      })),
    }));

    const quote = new Quote({
      organizationId: org._id,
      clientId: client._id,
      quoteNumber,
      status: 'draft',
      issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
      validUntil: new Date(input.validUntil),
      currency: normalizeCurrencyCode(
        input.currency,
        normalizeCurrencyCode(org.currency, client.currency || 'USD')
      ),
      publicAccessToken,
      organizationSnapshot,
      clientSnapshot,
      items: formattedItems,
      subtotalCents: calc.summary.subtotalCents,
      totalDiscountCents: calc.summary.totalDiscountCents,
      totalTaxCents: calc.summary.totalTaxCents,
      grandTotalCents: calc.summary.grandTotalCents,
      notes: input.notes,
      terms: input.terms,
      activityLog: [
        {
          action: 'Quote created',
          fromStatus: 'draft',
          toStatus: 'draft',
          timestamp: new Date(),
          actor: input.actor || 'system',
          notes: `Created proposal ${quoteNumber}`,
        },
      ],
    });

    await quote.save();
    return quote;
  }

  static async updateDraft(
    quoteId: string,
    updates: {
      currency?: string;
      validUntil?: Date | string;
      notes?: string;
      terms?: string;
    },
    actor: string = 'system'
  ): Promise<IQuote> {
    await connectToDatabase();
    const quote = await Quote.findById(quoteId);
    if (!quote) throw new Error('Quote not found');

    if (quote.status !== 'draft') {
      throw new Error(
        `Cannot edit quote in '${quote.status}' status. Only draft quotes can be modified.`
      );
    }

    if (updates.currency !== undefined) {
      quote.currency = normalizeCurrencyCode(updates.currency, quote.currency || 'USD');
    }
    if (updates.validUntil) {
      quote.validUntil = new Date(updates.validUntil);
    }
    if (updates.notes !== undefined) quote.notes = updates.notes;
    if (updates.terms !== undefined) quote.terms = updates.terms;

    quote.activityLog.push({
      action: 'Quote updated',
      fromStatus: quote.status,
      toStatus: quote.status,
      timestamp: new Date(),
      actor,
      notes: updates.currency ? `Updated currency to ${quote.currency}` : 'Draft updated',
    });

    await quote.save();
    return quote;
  }

  static async markAsSent(quoteId: string, actor: string = 'system'): Promise<IQuote> {
    await connectToDatabase();
    const quote = await Quote.findById(quoteId);
    if (!quote) throw new Error('Quote not found');

    const prev = quote.status;
    quote.status = 'sent';
    quote.activityLog.push({
      action: 'Quote sent',
      fromStatus: prev,
      toStatus: 'sent',
      timestamp: new Date(),
      actor,
      notes: 'Proposal dispatched to client',
    });

    await quote.save();
    return quote;
  }

  static async getByPublicToken(token: string): Promise<IQuote> {
    await connectToDatabase();
    const quote = await Quote.findOne({ publicAccessToken: token });
    if (!quote) throw new Error('Quote not found or invalid link');

    if (quote.status === 'sent') {
      quote.status = 'viewed';
      quote.activityLog.push({
        action: 'Quote viewed',
        fromStatus: 'sent',
        toStatus: 'viewed',
        timestamp: new Date(),
        actor: 'client_portal',
        notes: 'Client reviewed proposal in portal',
      });
      await quote.save();
    }

    return quote;
  }

  static async approveQuote(quoteId: string, actor: string = 'client_portal'): Promise<IQuote> {
    await connectToDatabase();
    const quote = await Quote.findById(quoteId);
    if (!quote) throw new Error('Quote not found');

    if (quote.status === 'converted') {
      throw new Error('Quote has already been converted to an invoice');
    }

    const prev = quote.status;
    quote.status = 'approved';
    quote.activityLog.push({
      action: 'Quote approved',
      fromStatus: prev,
      toStatus: 'approved',
      timestamp: new Date(),
      actor,
      notes: 'Client accepted proposal terms',
    });

    await quote.save();
    return quote;
  }

  /**
   * 1-Click Conversion: Converts an approved (or active) Quote into an official Invoice!
   */
  static async convertQuoteToInvoice(quoteId: string, actor: string = 'system'): Promise<any> {
    await connectToDatabase();

    const quote = await Quote.findById(quoteId);
    if (!quote) throw new Error('Quote not found');

    if (quote.status === 'converted' && quote.convertedInvoiceId) {
      return Invoice.findById(quote.convertedInvoiceId);
    }

    const org = await Organization.findById(quote.organizationId);
    if (!org) throw new Error('Organization not found');

    // Safe sequential numbering that guarantees no undefined errors
    const currentSeq =
      typeof org.nextInvoiceNumber === 'number' && !isNaN(org.nextInvoiceNumber) && org.nextInvoiceNumber >= 1
        ? org.nextInvoiceNumber
        : 1001;

    await Organization.findByIdAndUpdate(org._id, {
      $set: { nextInvoiceNumber: currentSeq + 1 },
    });

    const prefix = org.invoicePrefix || 'INV';
    const invoiceNumber = `${prefix}-${currentSeq.toString().padStart(5, '0')}`;

    const invoicePublicToken = crypto.randomBytes(24).toString('hex');
    const dueDate = new Date(Date.now() + 14 * 86400000); // 14 days payment window

    const invoice = new Invoice({
      organizationId: quote.organizationId,
      clientId: quote.clientId,
      invoiceNumber,
      status: 'draft',
      issueDate: new Date(),
      dueDate,
      currency: quote.currency,
      publicAccessToken: invoicePublicToken,
      organizationSnapshot: {
        ...quote.organizationSnapshot,
        wireInstructions: org.wireInstructions,
      },
      clientSnapshot: quote.clientSnapshot,
      items: quote.items,
      subtotalCents: quote.subtotalCents,
      totalDiscountCents: quote.totalDiscountCents,
      totalTaxCents: quote.totalTaxCents,
      grandTotalCents: quote.grandTotalCents,
      paidCents: 0,
      balanceDueCents: quote.grandTotalCents,
      notes: quote.notes ? `Converted from Quote ${quote.quoteNumber}\n\n${quote.notes}` : `Converted from Quote ${quote.quoteNumber}`,
      terms: quote.terms,
      activityLog: [
        {
          action: 'Invoice generated from quote',
          fromStatus: 'draft',
          toStatus: 'draft',
          timestamp: new Date(),
          actor,
          notes: `Created from Quote ${quote.quoteNumber}`,
        },
      ],
    });

    await invoice.save();

    // Mark quote as converted
    const prevQuoteStatus = quote.status;
    quote.status = 'converted';
    quote.convertedInvoiceId = invoice._id;
    quote.activityLog.push({
      action: 'Converted to invoice',
      fromStatus: prevQuoteStatus,
      toStatus: 'converted',
      timestamp: new Date(),
      actor,
      notes: `Generated official Invoice ${invoiceNumber}`,
    });
    await quote.save();

    return invoice;
  }
}

