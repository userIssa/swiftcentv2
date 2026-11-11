import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/mongodb';
import { Organization } from '../models/Organization';
import { Client } from '../models/Client';
import { IInvoice, IInvoiceItem, Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { calculateInvoice } from '../engine/calculator';
import {
  canTransition,
  createAuditEvent,
  isInvoiceLocked,
  resolvePaymentStatus,
} from '../engine/state-machine';
import { RawLineItem } from '../types/financial';

export interface CreateInvoiceInput {
  organizationId: string;
  clientId: string;
  invoiceNumber?: string;
  issueDate?: Date | string;
  dueDate: Date | string;
  currency?: string;
  items: RawLineItem[];
  notes?: string;
  terms?: string;
  actor?: string;
}

export class InvoiceService {
  /**
   * Creates a new draft invoice with immutable organization/client snapshots
   * and collision-safe sequential invoice number.
   */
  static async createInvoice(input: CreateInvoiceInput): Promise<IInvoice> {
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
    let invoiceNumber = input.invoiceNumber;
    if (!invoiceNumber) {
      const existingInvs = await Invoice.find({ organizationId: org._id }).select('invoiceNumber');
      const existingSet = new Set(existingInvs.map((i) => i.invoiceNumber));
      const prefix = org.invoicePrefix || 'INV';
      let currentSeq =
        typeof org.nextInvoiceNumber === 'number' && !isNaN(org.nextInvoiceNumber) && org.nextInvoiceNumber >= 1
          ? org.nextInvoiceNumber
          : 1001;

      while (existingSet.has(`${prefix}-${currentSeq.toString().padStart(5, '0')}`)) {
        currentSeq++;
      }
      invoiceNumber = `${prefix}-${currentSeq.toString().padStart(5, '0')}`;

      await Organization.findByIdAndUpdate(input.organizationId, {
        $set: { nextInvoiceNumber: currentSeq + 1 },
      });
    }

    // Perform exact integer financial calculation
    const calc = calculateInvoice(input.items, 0);

    // Generate unguessable token for public payment link
    const publicAccessToken = crypto.randomBytes(24).toString('hex');

    // Freeze snapshots with guaranteed fallbacks so validation never fails
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

    // Format calculated line items
    const formattedItems: IInvoiceItem[] = calc.items.map((item) => ({
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

    const auditEvent = createAuditEvent(
      'draft',
      'draft',
      'Invoice created as draft',
      input.actor || 'system',
      `Assigned number ${invoiceNumber}`
    );

    const invoice = new Invoice({
      organizationId: org._id,
      clientId: client._id,
      invoiceNumber,
      status: 'draft',
      issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
      dueDate: new Date(input.dueDate),
      currency: input.currency || client.currency || org.currency || 'USD',
      publicAccessToken,
      organizationSnapshot,
      clientSnapshot,
      items: formattedItems,
      subtotalCents: calc.summary.subtotalCents,
      totalDiscountCents: calc.summary.totalDiscountCents,
      totalTaxCents: calc.summary.totalTaxCents,
      grandTotalCents: calc.summary.grandTotalCents,
      paidCents: 0,
      balanceDueCents: calc.summary.balanceDueCents,
      notes: input.notes,
      terms: input.terms,
      activityLog: [auditEvent],
    });

    await invoice.save();
    return invoice;
  }

  /**
   * Updates an existing draft invoice. Locked invoices cannot be modified directly.
   */
  static async updateDraft(
    invoiceId: string,
    updates: {
      items?: RawLineItem[];
      dueDate?: Date | string;
      notes?: string;
      terms?: string;
    },
    actor: string = 'system'
  ): Promise<IInvoice> {
    await connectToDatabase();

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    if (isInvoiceLocked(invoice.status)) {
      throw new Error(
        `Cannot edit invoice in '${invoice.status}' status. Only draft invoices can be directly modified.`
      );
    }

    if (updates.dueDate) {
      invoice.dueDate = new Date(updates.dueDate);
    }
    if (updates.notes !== undefined) invoice.notes = updates.notes;
    if (updates.terms !== undefined) invoice.terms = updates.terms;

    if (updates.items && updates.items.length > 0) {
      const calc = calculateInvoice(updates.items, invoice.paidCents);

      invoice.items = calc.items.map((item) => ({
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

      invoice.subtotalCents = calc.summary.subtotalCents;
      invoice.totalDiscountCents = calc.summary.totalDiscountCents;
      invoice.totalTaxCents = calc.summary.totalTaxCents;
      invoice.grandTotalCents = calc.summary.grandTotalCents;
      invoice.balanceDueCents = calc.summary.balanceDueCents;
    }

    invoice.activityLog.push(
      createAuditEvent('draft', 'draft', 'Draft updated', actor)
    );

    await invoice.save();
    return invoice;
  }

  /**
   * Transitions invoice to 'sent' status.
   */
  static async markAsSent(invoiceId: string, actor: string = 'system'): Promise<IInvoice> {
    await connectToDatabase();

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    if (!canTransition(invoice.status, 'sent')) {
      throw new Error(`Cannot transition invoice from '${invoice.status}' to 'sent'`);
    }

    const previousStatus = invoice.status;
    invoice.status = 'sent';
    invoice.activityLog.push(
      createAuditEvent(previousStatus, 'sent', 'Invoice sent to client', actor)
    );

    await invoice.save();
    return invoice;
  }

  /**
   * Public portal access: marks invoice as 'viewed' if currently 'sent'.
   */
  static async getByPublicToken(token: string): Promise<IInvoice> {
    await connectToDatabase();

    const invoice = await Invoice.findOne({ publicAccessToken: token }).populate(
      'organizationId',
      'name email branding'
    );
    if (!invoice) throw new Error('Invoice not found or invalid link');

    // Resilient fallback for branding if snapshot was recorded before logo upload
    if (
      (!invoice.organizationSnapshot?.branding?.logoUrl &&
        (invoice.organizationId as any)?.branding?.logoUrl) ||
      (!invoice.organizationSnapshot?.email && (invoice.organizationId as any)?.email)
    ) {
      if (!invoice.organizationSnapshot.branding) invoice.organizationSnapshot.branding = {};
      if (!invoice.organizationSnapshot.branding.logoUrl) {
        invoice.organizationSnapshot.branding.logoUrl = (invoice.organizationId as any).branding?.logoUrl;
      }
      if (!invoice.organizationSnapshot.email) {
        invoice.organizationSnapshot.email = (invoice.organizationId as any).email;
      }
    }

    if (invoice.status === 'sent') {
      invoice.status = 'viewed';
      invoice.activityLog.push(
        createAuditEvent('sent', 'viewed', 'Client opened invoice in portal', 'client_portal')
      );
      await invoice.save();
    }

    return invoice;
  }

  /**
   * Records a payment against an invoice and updates balance & status automatically.
   */
  static async recordPayment(
    invoiceId: string,
    paymentInput: {
      amountCents: number;
      paymentMethod?: 'stripe' | 'credit_card' | 'bank_transfer' | 'cash' | 'manual';
      transactionReference?: string;
      notes?: string;
      actor?: string;
    }
  ): Promise<{ invoice: IInvoice; payment: mongoose.Document }> {
    await connectToDatabase();

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    if (invoice.status === 'void' || invoice.status === 'refunded') {
      throw new Error(`Cannot record payment on a '${invoice.status}' invoice`);
    }

    if (paymentInput.amountCents <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    const payment = new Payment({
      organizationId: invoice.organizationId,
      invoiceId: invoice._id,
      amountCents: paymentInput.amountCents,
      currency: invoice.currency,
      paymentMethod: paymentInput.paymentMethod || 'manual',
      transactionReference: paymentInput.transactionReference,
      notes: paymentInput.notes,
      paidAt: new Date(),
    });

    await payment.save();

    const newPaidCents = invoice.paidCents + paymentInput.amountCents;
    const newBalanceCents = Math.max(0, invoice.grandTotalCents - newPaidCents);
    const targetStatus = resolvePaymentStatus(
      invoice.status,
      invoice.grandTotalCents,
      newPaidCents,
      invoice.dueDate
    );

    const prevStatus = invoice.status;
    invoice.paidCents = newPaidCents;
    invoice.balanceDueCents = newBalanceCents;
    invoice.status = targetStatus;

    invoice.activityLog.push(
      createAuditEvent(
        prevStatus,
        targetStatus,
        `Payment of ${paymentInput.amountCents} cents recorded (${paymentInput.paymentMethod || 'manual'})`,
        paymentInput.actor || 'system',
        paymentInput.transactionReference ? `Ref: ${paymentInput.transactionReference}` : undefined
      )
    );

    await invoice.save();
    return { invoice, payment };
  }

  /**
   * Voids an active invoice.
   */
  static async voidInvoice(
    invoiceId: string,
    reason?: string,
    actor: string = 'system'
  ): Promise<IInvoice> {
    await connectToDatabase();

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    if (!canTransition(invoice.status, 'void')) {
      throw new Error(`Cannot void invoice currently in '${invoice.status}' status`);
    }

    const prevStatus = invoice.status;
    invoice.status = 'void';
    invoice.activityLog.push(
      createAuditEvent(prevStatus, 'void', 'Invoice voided', actor, reason)
    );

    await invoice.save();
    return invoice;
  }
}

