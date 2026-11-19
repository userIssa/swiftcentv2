import { NextResponse } from 'next/server';
import { Client } from '@/models/Client';
import { Product } from '@/models/Product';
import { Invoice } from '@/models/Invoice';
import { Quote } from '@/models/Quote';
import { resolveAuthorizedOrganization } from '@/lib/voice/server-auth';
import { rankCatalogMatches } from '@/lib/voice/catalog-matcher';
import { formatCurrency } from '@/engine/calculator';
import { VoiceBusinessOverview } from '@/lib/voice/types';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const organizationId = typeof body.organizationId === 'string' ? body.organizationId : null;
    const clientQuery = typeof body.clientQuery === 'string' ? body.clientQuery : undefined;
    const productQuery = typeof body.productQuery === 'string' ? body.productQuery : undefined;
    const includeOverview = Boolean(body.includeOverview);

    const auth = await resolveAuthorizedOrganization(organizationId);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const org = auth.organization;
    const orgId = org._id;
    const currency = org.currency || 'USD';

    const [allClients, allProducts, invoices, quotes] = await Promise.all([
      Client.find({ organizationId: orgId })
        .select('_id name email currency paymentTermsDays')
        .sort({ name: 1 })
        .lean(),
      Product.find({ organizationId: orgId })
        .select('_id name description unitPriceCents taxRate taxMethod')
        .sort({ name: 1 })
        .lean(),
      includeOverview
        ? Invoice.find({ organizationId: orgId })
            .select('status grandTotalCents paidCents balanceDueCents dueDate invoiceNumber clientSnapshot')
            .sort({ createdAt: -1 })
            .lean()
        : Promise.resolve([]),
      includeOverview
        ? Quote.find({ organizationId: orgId })
            .select('status grandTotalCents quoteNumber clientSnapshot')
            .sort({ createdAt: -1 })
            .lean()
        : Promise.resolve([]),
    ]);

    const matchedClients =
      clientQuery !== undefined
        ? rankCatalogMatches(
            clientQuery,
            allClients,
            (c) => [c.name, c.email],
            6
          ).map((c) => ({
            _id: c._id.toString(),
            name: c.name,
            email: c.email,
            currency: c.currency,
            paymentTermsDays: c.paymentTermsDays,
            score: c.score,
          }))
        : [];

    const matchedProducts =
      productQuery !== undefined
        ? rankCatalogMatches(
            productQuery,
            allProducts,
            (p) => [p.name, p.description],
            6
          ).map((p) => ({
            _id: p._id.toString(),
            name: p.name,
            description: p.description,
            unitPriceCents: p.unitPriceCents,
            taxRate: p.taxRate ?? 0,
            taxMethod: (p.taxMethod || 'exclusive') as 'exclusive' | 'inclusive',
            score: p.score,
          }))
        : [];

    let overview: VoiceBusinessOverview | undefined;
    if (includeOverview) {
      const now = new Date();
      let totalInvoicedCents = 0;
      let totalCollectedCents = 0;
      let outstandingCents = 0;
      let overdueCount = 0;
      let overdueAmountCents = 0;

      for (const inv of invoices as any[]) {
        if (inv.status === 'void') continue;
        totalInvoicedCents += inv.grandTotalCents || 0;
        totalCollectedCents += inv.paidCents || 0;
        const balance = inv.balanceDueCents || 0;
        outstandingCents += balance;

        if (balance > 0) {
          const isOverdue = inv.status === 'overdue' || (inv.dueDate && new Date(inv.dueDate) < now);
          if (isOverdue) {
            overdueCount += 1;
            overdueAmountCents += balance;
          }
        }
      }

      const activeQuotes = (quotes as any[]).filter(
        (q) => q.status === 'draft' || q.status === 'sent'
      );
      const activeQuotesTotalCents = activeQuotes.reduce(
        (acc, q) => acc + (q.grandTotalCents || 0),
        0
      );

      overview = {
        currency,
        totalInvoiced: formatCurrency(totalInvoicedCents, currency),
        totalCollected: formatCurrency(totalCollectedCents, currency),
        outstandingReceivables: formatCurrency(outstandingCents, currency),
        overdueCount,
        overdueAmount: formatCurrency(overdueAmountCents, currency),
        activeQuotesCount: activeQuotes.length,
        activeQuotesTotal: formatCurrency(activeQuotesTotalCents, currency),
        recentInvoices: (invoices as any[]).slice(0, 3).map((i) => ({
          invoiceNumber: i.invoiceNumber,
          clientName: i.clientSnapshot?.name || 'Unknown Client',
          status: i.status,
          balanceDue: formatCurrency(i.balanceDueCents || 0, currency),
        })),
        recentQuotes: (quotes as any[]).slice(0, 3).map((q) => ({
          quoteNumber: q.quoteNumber,
          clientName: q.clientSnapshot?.name || 'Unknown Client',
          status: q.status,
          amount: formatCurrency(q.grandTotalCents || 0, currency),
        })),
      };
    }

    return NextResponse.json({
      success: true,
      clients: matchedClients,
      products: matchedProducts,
      overview,
    });
  } catch (err: any) {
    console.error('Voice catalog resolve error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to resolve workspace catalog' },
      { status: 500 }
    );
  }
}

