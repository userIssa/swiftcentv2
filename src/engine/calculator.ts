import {
  CalculatedLineItem,
  CalculatedTaxDetail,
  Discount,
  InvoiceCalculationResult,
  InvoiceCalculationSummary,
  RawLineItem,
  TaxRate,
} from '../types/financial';

/**
 * Calculates line-level discount in integer cents.
 */
export function calculateDiscountCents(grossCents: number, discount?: Discount): number {
  if (!discount || discount.value <= 0) return 0;

  if (discount.type === 'percentage') {
    // Round to nearest integer cent
    const calculated = Math.round((grossCents * discount.value) / 100);
    return Math.min(grossCents, Math.max(0, calculated));
  }

  // Fixed discount cannot exceed gross
  return Math.min(grossCents, Math.max(0, Math.round(discount.value)));
}

/**
 * Calculates tax details for a given line amount.
 */
export function calculateLineTaxes(
  taxableNetCents: number,
  taxRates: TaxRate[] = []
): { taxes: CalculatedTaxDetail[]; lineExclusiveTaxCents: number; lineInclusiveTaxCents: number } {
  let lineExclusiveTaxCents = 0;
  let lineInclusiveTaxCents = 0;
  const taxes: CalculatedTaxDetail[] = [];

  for (const tax of taxRates) {
    if (tax.rate <= 0) continue;

    if (tax.method === 'inclusive') {
      // Inclusive formula: NetBase = Total / (1 + r/100)
      // TaxAmount = Total - NetBase
      const rateFactor = 1 + tax.rate / 100;
      const netBaseCents = Math.round(taxableNetCents / rateFactor);
      const taxAmountCents = taxableNetCents - netBaseCents;

      lineInclusiveTaxCents += taxAmountCents;
      taxes.push({
        name: tax.name,
        rate: tax.rate,
        method: 'inclusive',
        taxAmountCents,
        taxableBaseCents: netBaseCents,
      });
    } else {
      // Exclusive formula: TaxAmount = (TaxableNet * rate) / 100
      const taxAmountCents = Math.round((taxableNetCents * tax.rate) / 100);
      lineExclusiveTaxCents += taxAmountCents;
      taxes.push({
        name: tax.name,
        rate: tax.rate,
        method: 'exclusive',
        taxAmountCents,
        taxableBaseCents: taxableNetCents,
      });
    }
  }

  return { taxes, lineExclusiveTaxCents, lineInclusiveTaxCents };
}

/**
 * Calculates all financials for an individual line item.
 */
export function calculateLineItem(item: RawLineItem): CalculatedLineItem {
  const grossBeforeDiscountCents = Math.round(item.quantity * item.unitPriceCents);
  const discountCents = calculateDiscountCents(grossBeforeDiscountCents, item.discount);
  const netSubtotalCents = Math.max(0, grossBeforeDiscountCents - discountCents);

  const { taxes, lineExclusiveTaxCents, lineInclusiveTaxCents } = calculateLineTaxes(
    netSubtotalCents,
    item.taxRates
  );

  const totalLineTaxCents = lineExclusiveTaxCents + lineInclusiveTaxCents;
  // If taxes are exclusive, they add to line total. If inclusive, they are already part of netSubtotal.
  const lineTotalCents = netSubtotalCents + lineExclusiveTaxCents;

  return {
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    grossBeforeDiscountCents,
    discountCents,
    netSubtotalCents,
    taxes,
    lineTaxCents: totalLineTaxCents,
    lineTotalCents,
  };
}

/**
 * Aggregates all line items into a finalized invoice calculation.
 */
export function calculateInvoice(
  items: RawLineItem[],
  paidCents: number = 0
): InvoiceCalculationResult {
  const calculatedItems = items.map(calculateLineItem);

  let subtotalCents = 0;
  let totalDiscountCents = 0;
  let totalTaxCents = 0;
  let grandTotalCents = 0;

  const taxBreakdown: Record<string, { rate: number; method: TaxRate['method']; amountCents: number }> = {};

  for (const line of calculatedItems) {
    // Subtotal represents gross pre-tax amount before discounts
    let linePreTaxGross = line.grossBeforeDiscountCents;
    for (const tax of line.taxes) {
      if (tax.method === 'inclusive') {
        linePreTaxGross -= tax.taxAmountCents;
      }
    }

    subtotalCents += linePreTaxGross;
    totalDiscountCents += line.discountCents;
    totalTaxCents += line.lineTaxCents;
    grandTotalCents += line.lineTotalCents;

    for (const tax of line.taxes) {
      const key = `${tax.name}_${tax.rate}_${tax.method}`;
      if (!taxBreakdown[key]) {
        taxBreakdown[key] = {
          rate: tax.rate,
          method: tax.method,
          amountCents: 0,
        };
      }
      taxBreakdown[key].amountCents += tax.taxAmountCents;
    }
  }

  const safePaidCents = Math.max(0, Math.round(paidCents));
  const balanceDueCents = Math.max(0, grandTotalCents - safePaidCents);

  const summary: InvoiceCalculationSummary = {
    subtotalCents,
    totalDiscountCents,
    totalTaxCents,
    taxBreakdown,
    grandTotalCents,
    paidCents: safePaidCents,
    balanceDueCents,
  };

  return {
    items: calculatedItems,
    summary,
  };
}

/**
 * Formats integer cents into standard decimal string representation.
 * e.g. 1250 cents with USD -> "$12.50"
 */
export function formatCurrency(
  cents: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}
