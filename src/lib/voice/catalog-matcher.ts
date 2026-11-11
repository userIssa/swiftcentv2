import { calculateInvoice, formatCurrency } from '@/engine/calculator';
import { RawLineItem, TaxRate } from '@/types/financial';
import {
  VoiceDocumentDraft,
  VoiceDocumentType,
  VoiceDraftSummarySnapshot,
  VoiceFormLineItem,
} from './types';

const STARTER_INVOICE_DESCRIPTIONS = new Set([
  'professional consulting / engineering services',
  '',
]);

const STARTER_QUOTE_DESCRIPTIONS = new Set([
  'discovery, strategic architecture & prototype development',
  '',
]);

/**
 * Normalizes strings for fuzzy matching against tenant client & product names.
 */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Scores similarity (0 to 1) between a spoken query and one or more candidate text fields.
 */
export function scoreTextMatch(query: string, fields: Array<string | undefined>): number {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return 0;

  const queryTokens = normQuery.split(' ').filter((t) => t.length > 0);
  let bestScore = 0;

  for (const raw of fields) {
    if (!raw) continue;
    const normTarget = normalizeSearchText(raw);
    if (!normTarget) continue;

    if (normTarget === normQuery) {
      bestScore = Math.max(bestScore, 1.0);
      continue;
    }

    if (normTarget.startsWith(normQuery)) {
      bestScore = Math.max(bestScore, 0.92);
      continue;
    }

    if (normTarget.includes(normQuery)) {
      bestScore = Math.max(bestScore, 0.85);
      continue;
    }

    const targetTokens = new Set(normTarget.split(' '));
    let matchedTokens = 0;
    for (const qToken of queryTokens) {
      if (targetTokens.has(qToken)) {
        matchedTokens += 1;
      } else {
        for (const tToken of targetTokens) {
          if (tToken.includes(qToken) || (qToken.length >= 3 && qToken.includes(tToken))) {
            matchedTokens += 0.7;
            break;
          }
        }
      }
    }

    if (queryTokens.length > 0) {
      const tokenRatio = matchedTokens / queryTokens.length;
      bestScore = Math.max(bestScore, Math.min(0.8, tokenRatio * 0.78));
    }
  }

  return Number(bestScore.toFixed(3));
}

/**
 * Ranks items by match score and filters out unrelated records when query is provided.
 */
export function rankCatalogMatches<T>(
  query: string | undefined,
  records: T[],
  getFields: (item: T) => Array<string | undefined>,
  limit = 6
): Array<T & { score: number }> {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return records.slice(0, limit).map((item) => ({ ...item, score: 1 }));
  }

  const scored = records
    .map((item) => ({
      ...item,
      score: scoreTextMatch(trimmed, getFields(item)),
    }))
    .filter((item) => item.score >= 0.25)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

/**
 * Computes YYYY-MM-DD by adding integer days to an ISO date string.
 */
export function computeDueDateIso(issueDateIso: string, paymentTermsDays: number): string {
  const parsed = new Date(`${issueDateIso}T00:00:00Z`);
  const baseMs = Number.isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
  const safeDays = Math.max(0, Math.min(365, Math.round(paymentTermsDays)));
  const target = new Date(baseMs + safeDays * 86400000);
  return target.toISOString().split('T')[0];
}

/**
 * Detects whether a single existing line item is the untouched page template default,
 * allowing voice dictation to replace it cleanly rather than leaving dummy sample data behind.
 */
export function isStarterPlaceholderItem(
  item: VoiceFormLineItem,
  documentType: VoiceDocumentType
): boolean {
  const desc = item.description.trim().toLowerCase();
  if (documentType === 'invoice') {
    return (
      STARTER_INVOICE_DESCRIPTIONS.has(desc) &&
      item.quantity === '10' &&
      item.unitPrice === '150'
    ) || desc === '';
  }

  return (
    STARTER_QUOTE_DESCRIPTIONS.has(desc) &&
    item.quantity === '1' &&
    item.unitPrice === '2500'
  ) || desc === '';
}

/**
 * Converts UI form items into strict integer-cent RawLineItems and computes authoritative totals.
 */
export function draftItemsToRawLineItems(items: VoiceFormLineItem[]): RawLineItem[] {
  return items.map((it) => {
    const taxRates: TaxRate[] = [];
    const taxRateNum = parseFloat(it.taxRate) || 0;
    if (taxRateNum > 0) {
      taxRates.push({
        name: it.taxName || 'Tax',
        rate: taxRateNum,
        method: it.taxMethod,
      });
    }

    const qtyNum = parseFloat(it.quantity) || 0;
    const unitPriceNum = parseFloat(it.unitPrice) || 0;
    const discountNum = parseFloat(it.discountValue) || 0;

    return {
      id: it.id,
      description: it.description,
      quantity: qtyNum,
      unitPriceCents: Math.round(unitPriceNum * 100),
      discount:
        discountNum > 0
          ? {
              type: it.discountType,
              value:
                it.discountType === 'percentage'
                  ? discountNum
                  : Math.round(discountNum * 100),
            }
          : undefined,
      taxRates,
    };
  });
}

/**
 * Builds an engine-verified summary snapshot to send back to Gemini Live tool responses.
 */
export function buildLiveDraftSummary(
  draft: VoiceDocumentDraft,
  clientName: string | null
): VoiceDraftSummarySnapshot {
  const raw = draftItemsToRawLineItems(draft.items);
  const calc = calculateInvoice(raw, 0);

  return {
    documentType: draft.documentType,
    clientName,
    currency: draft.currency,
    issueDate: draft.issueDate,
    dueOrValidDate: draft.dueOrValidDate,
    itemCount: calc.items.length,
    items: calc.items.map((line, index) => ({
      id: draft.items[index]?.id || String(index),
      description: line.description,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      lineTotalCents: line.lineTotalCents,
    })),
    subtotalCents: calc.summary.subtotalCents,
    totalDiscountCents: calc.summary.totalDiscountCents,
    totalTaxCents: calc.summary.totalTaxCents,
    grandTotalCents: calc.summary.grandTotalCents,
    formattedGrandTotal: formatCurrency(calc.summary.grandTotalCents, draft.currency),
    notes: draft.notes,
    terms: draft.terms,
  };
}

