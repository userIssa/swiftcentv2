import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { InvoiceService } from '@/services/invoice-service';

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured on this instance' },
      { status: 400 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing Stripe signature or secret' }, { status: 400 });
  }

  let event: any;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook verification error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoiceId;
    const amountCents = session.amount_total;

    if (invoiceId && amountCents) {
      try {
        await InvoiceService.recordPayment(invoiceId, {
          amountCents,
          paymentMethod: 'stripe',
          transactionReference: session.payment_intent as string,
          notes: `Automatic Stripe Checkout reconciliation (Session: ${session.id})`,
          actor: 'stripe_webhook',
        });
      } catch (err: any) {
        console.error('Failed to record payment from webhook:', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}

