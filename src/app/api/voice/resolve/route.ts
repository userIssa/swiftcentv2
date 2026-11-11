import { NextResponse } from 'next/server';
import { Client } from '@/models/Client';
import { Product } from '@/models/Product';
import { resolveAuthorizedOrganization } from '@/lib/voice/server-auth';
import { rankCatalogMatches } from '@/lib/voice/catalog-matcher';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const organizationId = typeof body.organizationId === 'string' ? body.organizationId : null;
    const clientQuery = typeof body.clientQuery === 'string' ? body.clientQuery : undefined;
    const productQuery = typeof body.productQuery === 'string' ? body.productQuery : undefined;

    const auth = await resolveAuthorizedOrganization(organizationId);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const orgId = auth.organization._id;

    const [allClients, allProducts] = await Promise.all([
      Client.find({ organizationId: orgId })
        .select('_id name email currency paymentTermsDays')
        .sort({ name: 1 })
        .lean(),
      Product.find({ organizationId: orgId })
        .select('_id name description unitPriceCents taxRate taxMethod')
        .sort({ name: 1 })
        .lean(),
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

    return NextResponse.json({
      success: true,
      clients: matchedClients,
      products: matchedProducts,
    });
  } catch (err: any) {
    console.error('Voice catalog resolve error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to resolve workspace catalog' },
      { status: 500 }
    );
  }
}

