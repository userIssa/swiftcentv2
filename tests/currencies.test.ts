import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency } from '../src/engine/calculator';
import {
  getCurrencySelectOptions,
  getCurrencySymbol,
  normalizeCurrencyCode,
  searchCurrencies,
  SUPPORTED_CURRENCY_CODES,
} from '../src/lib/currencies';
import { findCountryOption, SUPPORTED_COUNTRIES } from '../src/lib/countries';
import {
  filterComboboxOptions,
  splitHighlightSegments,
} from '../src/components/SearchableCombobox';

test('normalizeCurrencyCode normalizes ISO 4217 codes and handles fallbacks safely', () => {
  assert.equal(normalizeCurrencyCode(' ngn '), 'NGN');
  assert.equal(normalizeCurrencyCode('gbp'), 'GBP');
  assert.equal(normalizeCurrencyCode('', 'EUR'), 'EUR');
  assert.equal(normalizeCurrencyCode('invalid-code', 'NGN'), 'NGN');
  assert.equal(normalizeCurrencyCode(null, 'bad-fallback'), 'USD');
});

test('currency helpers expose preferred currencies with flags beyond USD and append custom ISO codes cleanly', () => {
  assert.ok(SUPPORTED_CURRENCY_CODES.includes('NGN'));
  assert.ok(SUPPORTED_CURRENCY_CODES.includes('KES'));
  assert.ok(SUPPORTED_CURRENCY_CODES.includes('GHS'));
  assert.ok(SUPPORTED_CURRENCY_CODES.includes('ZAR'));

  assert.equal(getCurrencySymbol('USD'), '$');
  assert.equal(getCurrencySymbol('NGN'), '₦');
  assert.equal(getCurrencySymbol('EUR'), '€');
  assert.equal(getCurrencySymbol('GBP'), '£');

  const ngMatches = searchCurrencies('nigeria');
  assert.ok(ngMatches.some((c) => c.code === 'NGN' && c.flag === '🇳🇬'));

  const customOpts = getCurrencySelectOptions('RWF');
  assert.ok(customOpts.some((c) => c.code === 'RWF' && c.flag === '🌐'));
});

test('formatCurrency formats non-USD currencies using native symbols cleanly', () => {
  assert.equal(formatCurrency(125000, 'NGN'), '₦1,250.00');
  assert.equal(formatCurrency(125000, 'EUR'), '€1,250.00');
  assert.equal(formatCurrency(125000, 'GBP'), '£1,250.00');
  assert.equal(formatCurrency(125000, 'CAD'), 'CA$1,250.00');
});

test('country lookup and searchable combobox highlighting support multi-region filtering', () => {
  assert.ok(SUPPORTED_COUNTRIES.some((c) => c.name === 'Nigeria' && c.flag === '🇳🇬'));
  assert.equal(findCountryOption('USA')?.name, 'United States of America');
  assert.equal(findCountryOption('NG')?.flag, '🇳🇬');

  const segments = splitHighlightSegments('United States of America', 'United');
  assert.deepEqual(segments, [
    { text: 'United', matched: true },
    { text: ' States of America', matched: false },
  ]);

  const filtered = filterComboboxOptions(
    SUPPORTED_COUNTRIES.map((c) => ({ value: c.name, label: c.name, icon: c.flag })),
    'United'
  );
  assert.deepEqual(
    filtered.map((o) => o.label),
    ['United Kingdom', 'United Arab Emirates', 'United States of America']
  );
});
