import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Organization } from '@/models/Organization';
import { Invoice } from '@/models/Invoice';
import { Quote } from '@/models/Quote';
import { Client } from '@/models/Client';
import { Payment } from '@/models/Payment';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const organization = await Organization.findById(id);

    if (!organization) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    if (!organization.ownerId || organization.ownerId.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, organization });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await Organization.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    if (!existing.ownerId || existing.ownerId.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const updateData: any = { ...body };
    if (body.logoUrl !== undefined || body.branding?.logoUrl !== undefined) {
      updateData['branding.logoUrl'] = body.logoUrl !== undefined ? body.logoUrl : body.branding?.logoUrl;
      delete updateData.logoUrl;
    }
    if (body.primaryColor !== undefined || body.branding?.primaryColor !== undefined) {
      updateData['branding.primaryColor'] = body.primaryColor !== undefined ? body.primaryColor : body.branding?.primaryColor;
    }

    const organization = await Organization.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({ success: true, organization });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const organization = await Organization.findById(id);
    if (!organization) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    if (!organization.ownerId || organization.ownerId.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Clean up associated quotes, invoices, and payments for this business
    await Invoice.deleteMany({ organizationId: id });
    await Quote.deleteMany({ organizationId: id });
    await Client.deleteMany({ organizationId: id });
    await Payment.deleteMany({ organizationId: id });
    await Organization.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Business "${organization.name}" and associated records deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
