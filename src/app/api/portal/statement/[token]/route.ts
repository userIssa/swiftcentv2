import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice } from '@/models/Invoice';
import { Quote } from '@/models/Quote';
import { Client } from '@/models/Client';
import { Organization } from '@/models/Organization';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();
    const { token } = await params;

    // Resolve by invoice public access token or quote public access token
    let invoice = await Invoice.findOne({ publicAccessToken: token });
    let clientId: any = null;
    let orgId: any = null;

    if (invoice) {
      clientId = invoice.clientId;
      orgId = invoice.organizationId;
    } else {
      const quote = await Quote.findOne({ publicAccessToken: token });
      if (quote) {
        clientId = quote.clientId;
        orgId = quote.organizationId;
      }
    }

    if (!clientId || !orgId) {
      return NextResponse.json({ success: false, error: 'Statement link expired or invalid' }, { status: 404 });
    }

    const [client, org, invoices, quotes] = await Promise.all([
      Client.findById(clientId),
      Organization.findById(orgId).select('name email currency address taxId branding wireInstructions'),
      Invoice.find({ organizationId: orgId, clientId: clientId, status: { $ne: 'void' } })
        .sort({ issueDate: -1 })
        .select('invoiceNumber status issueDate dueDate grandTotalCents paidCents balanceDueCents publicAccessToken'),
      Quote.find({ organizationId: orgId, clientId: clientId })
        .sort({ issueDate: -1 })
        .select('quoteNumber status issueDate validUntil grandTotalCents publicAccessToken'),
    ]);

    if (!client || !org) {
      return NextResponse.json({ success: false, error: 'Client or Business record not found' }, { status: 404 });
    }

    // Totals
    let totalInvoicedCents = 0;
    let totalPaidCents = 0;
    let totalBalanceCents = 0;

    for (const inv of invoices) {
      totalInvoicedCents += inv.grandTotalCents || 0;
      totalPaidCents += inv.paidCents || 0;
      totalBalanceCents += inv.balanceDueCents || 0;
    }

    return NextResponse.json({
      success: true,
      statement: {
        organization: org,
        client,
        invoices,
        quotes,
        summary: {
          totalInvoicedCents,
          totalPaidCents,
          totalBalanceCents,
          invoiceCount: invoices.length,
          quoteCount: quotes.length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

