import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Organization } from '@/models/Organization';
import { getSessionUser } from '@/lib/auth';
import { normalizeCurrencyCode } from '@/lib/currencies';

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ success: true, organizations: [] });
    }

    // Find organizations owned by the authenticated user
    let organizations = await Organization.find({ ownerId: session.userId }).sort({ createdAt: -1 });

    // If none found by ownerId, claim any matching user's email before creating duplicates
    if (organizations.length === 0) {
      await Organization.updateMany(
        { email: session.email, $or: [{ ownerId: { $exists: false } }, { ownerId: null }] },
        { $set: { ownerId: session.userId } }
      );
      organizations = await Organization.find({ ownerId: session.userId }).sort({ createdAt: -1 });
    }

    // Auto-provision a fresh, isolated workspace for first-time users
    if (organizations.length === 0) {
      const firstName = (session.name || '').trim().split(' ')[0] || 'My';
      const orgName = `${firstName}'s Workspace`;
      const prefix = firstName.slice(0, 3).toUpperCase() || 'INV';

      const freshOrg = new Organization({
        name: orgName,
        email: session.email,
        ownerId: session.userId,
        currency: 'USD',
        invoicePrefix: prefix,
        nextInvoiceNumber: 1001,
        quotePrefix: 'QTE',
        nextQuoteNumber: 1001,
        branding: {
          primaryColor: '#2563eb',
        },
      });

      await freshOrg.save();
      organizations = [freshOrg];
    }

    return NextResponse.json({ success: true, organizations });
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

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Business name is required' }, { status: 400 });
    }

    if (!body.email || !body.email.trim()) {
      return NextResponse.json({ success: false, error: 'Business email is required' }, { status: 400 });
    }

    const org = new Organization({
      name: body.name.trim(),
      email: body.email.trim(),
      ownerId: session.userId,
      currency: normalizeCurrencyCode(body.currency, 'USD'),
      invoicePrefix: body.invoicePrefix || 'INV',
      nextInvoiceNumber: 1001,
      quotePrefix: body.quotePrefix || 'QTE',
      nextQuoteNumber: 1001,
      taxId: body.taxId?.trim(),
      address: body.address || {},
      branding: {
        logoUrl: body.logoUrl || body.branding?.logoUrl || '',
        primaryColor: body.primaryColor || body.branding?.primaryColor || '#2563eb',
      },
    });

    await org.save();
    return NextResponse.json({ success: true, organization: org }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
