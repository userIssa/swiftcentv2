import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Organization } from '@/models/Organization';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ success: true, products: [] });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organizationId');

    const userOrgs = await Organization.find({ ownerId: session.userId }).select('_id');
    const userOrgIds = userOrgs.map((o) => o._id.toString());

    if (userOrgIds.length === 0) {
      return NextResponse.json({ success: true, products: [] });
    }

    let query: Record<string, unknown> = {};
    if (orgId && orgId !== 'all') {
      if (!userOrgIds.includes(orgId)) {
        return NextResponse.json({ success: true, products: [] });
      }
      query.organizationId = orgId;
    } else {
      query.organizationId = { $in: userOrgIds };
    }

    const products = await Product.find(query).sort({ name: 1 });
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let orgId = body.organizationId;

    if (!orgId) {
      const userOrg = await Organization.findOne({ ownerId: session.userId });
      if (!userOrg) {
        return NextResponse.json({ success: false, error: 'No business workspace found for your account' }, { status: 400 });
      }
      orgId = userOrg._id.toString();
    } else {
      const allowed = await Organization.findOne({ _id: orgId, ownerId: session.userId });
      if (!allowed) {
        return NextResponse.json({ success: false, error: 'Unauthorized for this business' }, { status: 403 });
      }
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Product/Service name is required' }, { status: 400 });
    }

    const product = new Product({
      organizationId: orgId,
      name: body.name.trim(),
      description: body.description?.trim(),
      unitPriceCents: Math.round((parseFloat(body.unitPrice) || 0) * 100),
      taxRate: parseFloat(body.taxRate) || 0,
      taxMethod: body.taxMethod || 'exclusive',
    });

    await product.save();
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
