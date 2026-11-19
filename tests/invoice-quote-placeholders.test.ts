import test from 'node:test';
import assert from 'node:assert/strict';
import {
  draftItemsToRawLineItems,
  isStarterPlaceholderItem,
} from '../src/lib/voice/catalog-matcher';
import { calculateInvoice } from '../src/engine/calculator';
import { VoiceFormLineItem } from '../src/lib/voice/types';

test('draftItemsToRawLineItems handles empty string placeholders with $0.00 initial total', () => {
  const blankFormItem: VoiceFormLineItem = {
    id: '1',
    description: '',
    quantity: '',
    unitPrice: '',
    discountType: 'percentage',
    discountValue: '',
    taxName: 'Tax',
    taxRate: '',
    taxMethod: 'exclusive',
  };

  const raw = draftItemsToRawLineItems([blankFormItem]);
  assert.equal(raw.length, 1);
  assert.equal(raw[0].unitPriceCents, 0);

  const calc = calculateInvoice(raw, 0);
  assert.equal(calc.summary.subtotalCents, 0);
  assert.equal(calc.summary.totalTaxCents, 0);
  assert.equal(calc.summary.grandTotalCents, 0);
});

test('draftItemsToRawLineItems defaults empty quantity to 1 when user supplies unit price', () => {
  const itemWithPriceOnly: VoiceFormLineItem = {
    id: '1',
    description: 'Design Mockup',
    quantity: '', // user saw placeholder="1" and left it as default
    unitPrice: '150',
    discountType: 'percentage',
    discountValue: '',
    taxName: 'Tax',
    taxRate: '',
    taxMethod: 'exclusive',
  };

  const raw = draftItemsToRawLineItems([itemWithPriceOnly]);
  assert.equal(raw[0].quantity, 1);
  assert.equal(raw[0].unitPriceCents, 15000);

  const calc = calculateInvoice(raw, 0);
  assert.equal(calc.summary.subtotalCents, 15000);
  assert.equal(calc.summary.grandTotalCents, 15000);
});

test('isStarterPlaceholderItem recognizes blank placeholder items for both invoices and quotes', () => {
  const blankRow: VoiceFormLineItem = {
    id: '1',
    description: '',
    quantity: '',
    unitPrice: '',
    discountType: 'percentage',
    discountValue: '',
    taxName: 'Tax',
    taxRate: '',
    taxMethod: 'exclusive',
  };

  assert.equal(isStarterPlaceholderItem(blankRow, 'invoice'), true);
  assert.equal(isStarterPlaceholderItem(blankRow, 'quote'), true);
});
