import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia' as any,
    })
  : null;

export async function createCheckoutSession(params: {
  invoiceId: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  clientEmail?: string;
  businessName: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string | null> {
  if (!stripe) {
    return null;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.clientEmail,
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: `Invoice ${params.invoiceNumber}`,
            description: `Payment for ${params.businessName}`,
          },
          unit_amount: params.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoiceId: params.invoiceId,
      invoiceNumber: params.invoiceNumber,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session.url;
}
