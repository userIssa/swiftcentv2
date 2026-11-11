import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDiscountCents,
  calculateLineItem,
  calculateInvoice,
  formatCurrency,
} from '../src/engine/calculator';
import {
  canTransition,
  resolvePaymentStatus,
  isInvoiceLocked,
} from '../src/engine/state-machine';

test('calculateDiscountCents - percentage and fixed rounding', () => {
  // 10% on $12.55 (1255 cents) = 125.5 -> rounded to 126 cents ($1.26)
  assert.equal(calculateDiscountCents(1255, { type: 'percentage', value: 10 }), 126);

  // 15% on $100.00 (10000 cents) = 1500 cents
  assert.equal(calculateDiscountCents(10000, { type: 'percentage', value: 15 }), 1500);

  // Fixed discount of $5.00 (500 cents)
  assert.equal(calculateDiscountCents(1255, { type: 'fixed', value: 500 }), 500);

  // Fixed discount exceeding gross is capped at gross
  assert.equal(calculateDiscountCents(300, { type: 'fixed', value: 500 }), 300);
});

test('calculateLineItem - exclusive tax', () => {
  // 2 items @ $50.00 (5000 cents) = $100.00
  // Exclusive VAT 20%
  const item = calculateLineItem({
    description: 'Web Development Services',
    quantity: 2,
    unitPriceCents: 5000,
    taxRates: [{ name: 'VAT', rate: 20, method: 'exclusive' }],
  });

  assert.equal(item.grossBeforeDiscountCents, 10000);
  assert.equal(item.discountCents, 0);
  assert.equal(item.netSubtotalCents, 10000);
  assert.equal(item.lineTaxCents, 2000); // 20% of $100 = $20.00
  assert.equal(item.lineTotalCents, 12000); // $100 + $20 = $120.00
});

test('calculateLineItem - inclusive tax', () => {
  // 1 item @ $120.00 (12000 cents) inclusive of 20% VAT
  // Pre-tax base = 12000 / 1.2 = 10000 ($100.00)
  // Tax = 2000 ($20.00)
  const item = calculateLineItem({
    description: 'Software Subscription (Tax Inclusive)',
    quantity: 1,
    unitPriceCents: 12000,
    taxRates: [{ name: 'VAT', rate: 20, method: 'inclusive' }],
  });

  assert.equal(item.grossBeforeDiscountCents, 12000);
  assert.equal(item.netSubtotalCents, 12000);
  assert.equal(item.lineTaxCents, 2000);
  assert.equal(item.lineTotalCents, 12000); // stays 12000 because tax is included
  assert.equal(item.taxes[0].taxableBaseCents, 10000);
});

test('calculateInvoice - full summary with mixed taxes & payments', () => {
  const result = calculateInvoice(
    [
      {
        description: 'Design consulting',
        quantity: 10,
        unitPriceCents: 10000, // 10 * $100 = $1000.00
        discount: { type: 'percentage', value: 10 }, // 10% off -> $900.00 net
        taxRates: [{ name: 'Sales Tax', rate: 8.25, method: 'exclusive' }], // 8.25% of $900 = $74.25 (7425 cents)
      },
      {
        description: 'Cloud Hosting (Inclusive)',
        quantity: 1,
        unitPriceCents: 6000, // $60.00 inclusive of 20% VAT
        taxRates: [{ name: 'VAT', rate: 20, method: 'inclusive' }], // $10.00 tax, $50 base
      },
    ],
    50000 // $500.00 already paid
  );

  // Line 1: Net $900.00 (90000), Tax $74.25 (7425), Line total $974.25 (97425)
  // Line 2: Net $60.00 (6000), Pre-tax base $50.00 (5000), Tax $10.00 (1000), Line total $60.00 (6000)
  // Grand total: $974.25 + $60.00 = $1034.25 (103425 cents)
  // Balance due: 103425 - 50000 = 53425 ($534.25)
  assert.equal(result.summary.grandTotalCents, 103425);
  assert.equal(result.summary.paidCents, 50000);
  assert.equal(result.summary.balanceDueCents, 53425);
  assert.equal(result.summary.totalDiscountCents, 10000); // $100 discount
});

test('calculateInvoice - exact subtotal discount tax equation consistency', () => {
  // Scenario matching user's invoice:
  // Line 1: 10 @ $1500 = $15,000, 0% disc, 7.5% tax
  // Line 2: 1 @ $20000 = $20,000, 10% disc ($2,000), 7.5% tax ($1,350)
  const result = calculateInvoice([
    {
      description: 'Professional Consulting / Engineering Services',
      quantity: 10,
      unitPriceCents: 150000,
      discount: { type: 'percentage', value: 0 },
      taxRates: [{ name: 'Tax', rate: 7.5, method: 'exclusive' }],
    },
    {
      description: 'Website Development',
      quantity: 1,
      unitPriceCents: 2000000,
      discount: { type: 'percentage', value: 10 },
      taxRates: [{ name: 'Tax', rate: 7.5, method: 'exclusive' }],
    },
  ]);

  // Gross Subtotal: $15,000 + $20,000 = $35,000.00
  assert.equal(result.summary.subtotalCents, 3500000);
  // Total Discount: $2,000.00
  assert.equal(result.summary.totalDiscountCents, 200000);
  // Total Tax: 7.5% of $33,000 = $2,475.00
  assert.equal(result.summary.totalTaxCents, 247500);
  // Grand Total: $35,000 - $2,000 + $2,475 = $35,475.00
  assert.equal(result.summary.grandTotalCents, 3547500);

  // Invariant: Subtotal - Discount + Tax must exactly equal Grand Total
  assert.equal(
    result.summary.subtotalCents - result.summary.totalDiscountCents + result.summary.totalTaxCents,
    result.summary.grandTotalCents
  );
});

test('formatCurrency utility', () => {
  assert.equal(formatCurrency(1250, 'USD'), '$12.50');
  assert.equal(formatCurrency(100000, 'USD'), '$1,000.00');
  assert.equal(formatCurrency(0, 'USD'), '$0.00');
});

test('State Machine - transition validation and lock guards', () => {
  assert.equal(canTransition('draft', 'sent'), true);
  assert.equal(canTransition('draft', 'paid'), false); // Cannot jump straight to paid without sending
  assert.equal(canTransition('sent', 'viewed'), true);
  assert.equal(canTransition('viewed', 'paid'), true);
  assert.equal(canTransition('paid', 'draft'), false); // Terminal, immutable

  assert.equal(isInvoiceLocked('draft'), false);
  assert.equal(isInvoiceLocked('sent'), true);
  assert.equal(isInvoiceLocked('paid'), true);
});

test('State Machine - auto-resolve payment status', () => {
  // Fully paid
  assert.equal(resolvePaymentStatus('sent', 10000, 10000), 'paid');

  // Partially paid
  assert.equal(resolvePaymentStatus('sent', 10000, 5000), 'partially_paid');

  // Overdue if past due date
  const yesterday = new Date(Date.now() - 86400000);
  assert.equal(resolvePaymentStatus('sent', 10000, 0, yesterday), 'overdue');
  assert.equal(resolvePaymentStatus('draft', 10000, 0, yesterday), 'draft'); // drafts don't become overdue
});

