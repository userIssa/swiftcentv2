import { NextResponse } from 'next/server';
import { Client, IClient } from '@/models/Client';
import { Invoice } from '@/models/Invoice';
import { Payment } from '@/models/Payment';
import { Product } from '@/models/Product';
import { Quote } from '@/models/Quote';
import { ClientService } from '@/services/client-service';
import { InvoiceService } from '@/services/invoice-service';
import { QuoteService } from '@/services/quote-service';
import { createAuditEvent } from '@/engine/state-machine';
import { isSampleDataEnabledForEmail } from '@/lib/auth';
import { resolveAuthorizedOrganization } from '@/lib/voice/server-auth';
import {
  LEGACY_DEMO_CLIENT_EMAILS,
  SAMPLE_CLIENTS,
  SAMPLE_CLIENT_EMAILS,
  SAMPLE_INVOICE_DESCRIPTIONS,
  SAMPLE_PRODUCTS,
  SAMPLE_PRODUCT_NAMES,
  SAMPLE_QUOTE_DESCRIPTIONS,
} from '@/lib/sample-data-definitions';

async function authorizeSampleRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  let organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    const body = await request.json().catch(() => ({}));
    if (typeof body.organizationId === 'string') {
      organizationId = body.organizationId;
    }
  }

  const auth = await resolveAuthorizedOrganization(organizationId);
  if (auth.errorResponse) {
    return { errorResponse: auth.errorResponse };
  }

  if (!isSampleDataEnabledForEmail(auth.session.email)) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Sample workspace controls are restricted to authorized developer accounts.',
        },
        { status: 403 }
      ),
    };
  }

  return { session: auth.session, organization: auth.organization };
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeSampleRequest(request);
    if ('errorResponse' in auth) {
      return auth.errorResponse;
    }

    const org = auth.organization;
    const orgIdStr = org._id.toString();
    const currency = org.currency || 'USD';

    const getOrCreateClient = async (seedClient: (typeof SAMPLE_CLIENTS)[number]): Promise<IClient> => {
      const existing = await Client.findOne({
        organizationId: orgIdStr,
        email: seedClient.email.toLowerCase(),
      });
      if (existing) {
        return existing;
      }
      return ClientService.createClient({
        ...seedClient,
        currency,
        organizationId: orgIdStr,
      });
    };

    const [client1, client2, client3] = await Promise.all(
      SAMPLE_CLIENTS.map((c) => getOrCreateClient(c))
    );

    const dayMs = 86400000;
    let invoicesCreated = 0;

    // 1. Paid Invoice ($4,500.00)
    const invPaid = await InvoiceService.createInvoice({
      organizationId: orgIdStr,
      clientId: client1._id.toString(),
      currency,
      issueDate: new Date(Date.now() - 20 * dayMs),
      dueDate: new Date(Date.now() - 6 * dayMs),
      items: [
        {
          description: SAMPLE_INVOICE_DESCRIPTIONS[0],
          quantity: 1,
          unitPriceCents: 450000,
          taxRates: [],
        },
      ],
      notes: 'Thank you for your business.',
      terms: 'Payment due within 14 days of issue.',
      actor: auth.session.email,
    });
    await InvoiceService.markAsSent(invPaid._id.toString(), auth.session.email);
    await InvoiceService.recordPayment(invPaid._id.toString(), {
      amountCents: 450000,
      paymentMethod: 'bank_transfer',
      transactionReference: 'WIRE-2026-0891',
      notes: 'Cleared via ACH transfer',
      actor: auth.session.email,
    });
    invoicesCreated += 1;

    // 2. Partially Paid Invoice ($5,000.00 with $1,500.00 deposit)
    const invPartial = await InvoiceService.createInvoice({
      organizationId: orgIdStr,
      clientId: client2._id.toString(),
      currency,
      issueDate: new Date(Date.now() - 10 * dayMs),
      dueDate: new Date(Date.now() + 20 * dayMs),
      items: [
        {
          description: SAMPLE_INVOICE_DESCRIPTIONS[1],
          quantity: 1,
          unitPriceCents: 500000,
          taxRates: [],
        },
      ],
      notes: 'Initial 30% sprint deposit received.',
      terms: 'Balance due upon sprint delivery.',
      actor: auth.session.email,
    });
    await InvoiceService.markAsSent(invPartial._id.toString(), auth.session.email);
    await InvoiceService.recordPayment(invPartial._id.toString(), {
      amountCents: 150000,
      paymentMethod: 'bank_transfer',
      transactionReference: 'WIRE-2026-0914',
      notes: '30% project kickoff retainer',
      actor: auth.session.email,
    });
    invoicesCreated += 1;

    // 3. Overdue Invoice ($1,260.00 including 5% tax, due 18 days ago)
    const invOverdue = await InvoiceService.createInvoice({
      organizationId: orgIdStr,
      clientId: client3._id.toString(),
      currency,
      issueDate: new Date(Date.now() - 32 * dayMs),
      dueDate: new Date(Date.now() - 18 * dayMs),
      items: [
        {
          description: SAMPLE_INVOICE_DESCRIPTIONS[2],
          quantity: 1,
          unitPriceCents: 120000,
          taxRates: [{ name: 'Sales Tax', rate: 5, method: 'exclusive' }],
        },
      ],
      notes: 'Follow-up reminder scheduled.',
      terms: 'Net 14 days from issue.',
      actor: auth.session.email,
    });
    await InvoiceService.markAsSent(invOverdue._id.toString(), auth.session.email);
    await Invoice.findByIdAndUpdate(invOverdue._id, {
      $set: { status: 'overdue' },
      $push: {
        activityLog: createAuditEvent(
          'sent',
          'overdue',
          'Invoice marked overdue past due date',
          'system'
        ),
      },
    });
    invoicesCreated += 1;

    // 4. Open Current Invoice ($2,400.00 due in 14 days)
    const invCurrent = await InvoiceService.createInvoice({
      organizationId: orgIdStr,
      clientId: client1._id.toString(),
      currency,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * dayMs),
      items: [
        {
          description: SAMPLE_INVOICE_DESCRIPTIONS[3],
          quantity: 1,
          unitPriceCents: 240000,
          taxRates: [],
        },
      ],
      notes: 'Standard monthly retainer.',
      terms: 'Net 14 payment terms.',
      actor: auth.session.email,
    });
    await InvoiceService.markAsSent(invCurrent._id.toString(), auth.session.email);
    invoicesCreated += 1;

    // 5. Sent Proposal / Quote ($6,000.00)
    const quote = await QuoteService.createQuote({
      organizationId: orgIdStr,
      clientId: client2._id.toString(),
      currency,
      issueDate: new Date(),
      validUntil: new Date(Date.now() + 30 * dayMs),
      items: [
        {
          description: SAMPLE_QUOTE_DESCRIPTIONS[0],
          quantity: 1,
          unitPriceCents: 450000,
          taxRates: [],
        },
        {
          description: SAMPLE_QUOTE_DESCRIPTIONS[1],
          quantity: 1,
          unitPriceCents: 150000,
          taxRates: [],
        },
      ],
      notes: 'Includes TestFlight & staging rollout validation.',
      terms: 'Valid for 30 days. 50% upon kickoff, 50% on delivery.',
      actor: auth.session.email,
    });
    await QuoteService.markAsSent(quote._id.toString(), auth.session.email);

    // 6. Reusable Catalog Products
    for (const prod of SAMPLE_PRODUCTS) {
      const exists = await Product.findOne({ organizationId: orgIdStr, name: prod.name });
      if (!exists) {
        await Product.create({
          ...prod,
          organizationId: orgIdStr,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Loaded ${invoicesCreated} sample invoices, 3 clients, 1 quote, and ${SAMPLE_PRODUCTS.length} catalog items into ${org.name}.`,
      organizationId: orgIdStr,
    });
  } catch (err: any) {
    console.error('Sample data load error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to populate sample data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authorizeSampleRequest(request);
    if ('errorResponse' in auth) {
      return auth.errorResponse;
    }

    const org = auth.organization;
    const orgIdStr = org._id.toString();

    const allSampleEmails = [...SAMPLE_CLIENT_EMAILS, ...LEGACY_DEMO_CLIENT_EMAILS];
    const sampleClients = await Client.find({
      organizationId: orgIdStr,
      email: { $in: allSampleEmails },
    }).select('_id email');

    const sampleClientIds = sampleClients.map((c) => c._id);
    const legacyClientIds = sampleClients
      .filter((c) => LEGACY_DEMO_CLIENT_EMAILS.includes(c.email.toLowerCase()))
      .map((c) => c._id);

    // Match sample quotes (preserving manually created quotes on real clients)
    const sampleQuotes = await Quote.find({
      organizationId: orgIdStr,
      $or: [
        { clientId: { $in: sampleClientIds }, 'items.0.description': { $in: SAMPLE_QUOTE_DESCRIPTIONS } },
        ...(legacyClientIds.length > 0 ? [{ clientId: { $in: legacyClientIds } }] : []),
      ],
    }).select('_id convertedInvoiceId');

    const sampleQuoteIds = sampleQuotes.map((q) => q._id);
    const convertedInvoiceIds = sampleQuotes
      .map((q) => q.convertedInvoiceId)
      .filter(Boolean);

    // Match sample invoices (plus any converted from sample quotes or legacy showcase records)
    const sampleInvoices = await Invoice.find({
      organizationId: orgIdStr,
      $or: [
        { clientId: { $in: sampleClientIds }, 'items.0.description': { $in: SAMPLE_INVOICE_DESCRIPTIONS } },
        ...(convertedInvoiceIds.length > 0 ? [{ _id: { $in: convertedInvoiceIds } }] : []),
        ...(legacyClientIds.length > 0 ? [{ clientId: { $in: legacyClientIds } }] : []),
      ],
    }).select('_id');

    const sampleInvoiceIds = sampleInvoices.map((inv) => inv._id);

    let deletedPayments = 0;
    let deletedInvoices = 0;
    if (sampleInvoiceIds.length > 0) {
      const payRes = await Payment.deleteMany({
        organizationId: orgIdStr,
        invoiceId: { $in: sampleInvoiceIds },
      });
      deletedPayments = payRes.deletedCount || 0;

      const invRes = await Invoice.deleteMany({
        _id: { $in: sampleInvoiceIds },
      });
      deletedInvoices = invRes.deletedCount || 0;
    }

    let deletedQuotes = 0;
    if (sampleQuoteIds.length > 0) {
      const quoteRes = await Quote.deleteMany({
        _id: { $in: sampleQuoteIds },
      });
      deletedQuotes = quoteRes.deletedCount || 0;
    }

    // Delete each sample client only if no remaining real invoices or quotes depend on them
    let deletedClients = 0;
    for (const client of sampleClients) {
      const [hasInvoice, hasQuote] = await Promise.all([
        Invoice.exists({ organizationId: orgIdStr, clientId: client._id }),
        Quote.exists({ organizationId: orgIdStr, clientId: client._id }),
      ]);
      if (!hasInvoice && !hasQuote) {
        await Client.findByIdAndDelete(client._id);
        deletedClients += 1;
      }
    }

    const prodRes = await Product.deleteMany({
      organizationId: orgIdStr,
      name: { $in: SAMPLE_PRODUCT_NAMES },
    });
    const deletedProducts = prodRes.deletedCount || 0;

    return NextResponse.json({
      success: true,
      message: `Cleared sample data from ${org.name}: removed ${deletedInvoices} invoices, ${deletedQuotes} quotes, ${deletedClients} clients, ${deletedProducts} products, and ${deletedPayments} payment records.`,
      deleted: {
        invoices: deletedInvoices,
        quotes: deletedQuotes,
        clients: deletedClients,
        products: deletedProducts,
        payments: deletedPayments,
      },
    });
  } catch (err: any) {
    console.error('Sample data clear error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to clear sample data' },
      { status: 500 }
    );
  }
}
