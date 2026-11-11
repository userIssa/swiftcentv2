import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice } from '@/models/Invoice';
import { createCheckoutSession, stripe } from '@/lib/stripe';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();
    const { token } = await params;

    const invoice = await Invoice.findOne({ publicAccessToken: token });
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.balanceDueCents <= 0) {
      return NextResponse.json({ success: false, error: 'Invoice is already paid in full' }, { status: 400 });
    }

    // If Stripe is not configured with live/test secret key, inform frontend to use embedded modal
    if (!stripe) {
      return NextResponse.json({
        success: true,
        useMock: true,
        message: 'Stripe keys not set; using instant embedded checkout.',
      });
    }

    const origin = request.headers.get('origin') || new URL(request.url).origin;
    const successUrl = `${origin}/portal/${token}?status=paid_success`;
    const cancelUrl = `${origin}/portal/${token}?status=cancelled`;

    const checkoutUrl = await createCheckoutSession({
      invoiceId: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      amountCents: invoice.balanceDueCents,
      currency: invoice.currency,
      clientEmail: invoice.clientSnapshot?.email,
      businessName: invoice.organizationSnapshot?.name || 'SwiftCent Merchant',
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      success: true,
      useMock: false,
      checkoutUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

