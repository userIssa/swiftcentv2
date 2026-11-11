/**
 * SwiftCent Core Financial Types
 * All monetary amounts are represented as integers in the smallest currency unit (e.g. Cents).
 * e.g., $12.50 = 1250 cents.
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF' | string;

export type DiscountType = 'percentage' | 'fixed';

export interface Discount {
  type: DiscountType;
  /** Value: e.g. 10 for 10%, or 500 for $5.00 */
  value: number;
}

export type TaxCalculationMethod = 'exclusive' | 'inclusive';

export interface TaxRate {
  id?: string;
  name: string;
  /** Percentage rate: e.g. 20 for 20%, 8.25 for 8.25% */
  rate: number;
  /**
   * exclusive: Tax is added on top of the net amount.
   * inclusive: Tax is already included in the line item price.
   */
  method: TaxCalculationMethod;
}

export interface RawLineItem {
  id?: string;
  description: string;
  quantity: number;
  /** Unit price in smallest currency unit (cents) */
  unitPriceCents: number;
  discount?: Discount;
  taxRates?: TaxRate[];
}

export interface CalculatedTaxDetail {
  name: string;
  rate: number;
  method: TaxCalculationMethod;
  /** Tax amount in cents */
  taxAmountCents: number;
  /** The taxable base amount in cents on which this tax was computed */
  taxableBaseCents: number;
}

export interface CalculatedLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  /** Raw subtotal before discount: quantity * unitPriceCents */
  grossBeforeDiscountCents: number;
  /** Calculated discount in cents */
  discountCents: number;
  /** Net subtotal after discount */
  netSubtotalCents: number;
  /** Breakdown of each tax applied to this line */
  taxes: CalculatedTaxDetail[];
  /** Total tax for this line in cents */
  lineTaxCents: number;
  /** Final line total including tax (or net + exclusive tax) in cents */
  lineTotalCents: number;
}

export interface InvoiceCalculationSummary {
  /** Sum of net amounts before exclusive taxes */
  subtotalCents: number;
  /** Total discounts applied in cents */
  totalDiscountCents: number;
  /** Total tax across all lines in cents */
  totalTaxCents: number;
  /** Consolidated tax breakdown by tax name/rate */
  taxBreakdown: Record<string, { rate: number; method: TaxCalculationMethod; amountCents: number }>;
  /** Final payable amount (subtotal + exclusive taxes) in cents */
  grandTotalCents: number;
  /** Total paid so far in cents */
  paidCents: number;
  /** Remaining balance due in cents (grandTotalCents - paidCents) */
  balanceDueCents: number;
}

export interface InvoiceCalculationResult {
  items: CalculatedLineItem[];
  summary: InvoiceCalculationSummary;
}

