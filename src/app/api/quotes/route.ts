import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Quote } from '@/models/Quote';
import { Organization } from '@/models/Organization';
import { QuoteService } from '@/services/quote-service';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ success: true, quotes: [] });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const orgId = searchParams.get('organizationId');

    const userOrgs = await Organization.find({ ownerId: session.userId }).select('_id');
    const userOrgIds = userOrgs.map((o) => o._id.toString());

    if (userOrgIds.length === 0) {
      return NextResponse.json({ success: true, quotes: [] });
    }

    const query: Record<string, unknown> = {};

    if (orgId && orgId !== 'all') {
      if (!userOrgIds.includes(orgId)) {
        return NextResponse.json({ success: true, quotes: [] });
      }
      query.organizationId = orgId;
    } else {
      query.organizationId = { $in: userOrgIds };
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const quotes = await Quote.find(query)
      .populate('clientId', 'name email')
      .populate('convertedInvoiceId', 'invoiceNumber')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, quotes });
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

    const quote = await QuoteService.createQuote({
      ...body,
      organizationId: orgId,
    });

    return NextResponse.json({ success: true, quote }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
