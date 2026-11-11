import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBankingPreset,
  getWireDisplayLabels,
  inferDefaultBankingRegion,
} from '../src/lib/banking-regions';

test('inferDefaultBankingRegion maps regional currencies appropriately and defaults globally', () => {
  assert.equal(inferDefaultBankingRegion('NGN'), 'ng_africa');
  assert.equal(inferDefaultBankingRegion('GHS'), 'ng_africa');
  assert.equal(inferDefaultBankingRegion('GBP'), 'uk');
  assert.equal(inferDefaultBankingRegion('EUR'), 'eu_sepa');
  assert.equal(inferDefaultBankingRegion('CAD'), 'ca');
  assert.equal(inferDefaultBankingRegion('AUD'), 'au');
  assert.equal(inferDefaultBankingRegion('INR'), 'in');
  assert.equal(inferDefaultBankingRegion('USD'), 'global');
  assert.equal(inferDefaultBankingRegion(null), 'global');
});

test('getBankingPreset and getWireDisplayLabels adapt banking fields per region without US lock-in', () => {
  const uk = getBankingPreset('uk', 'GBP');
  assert.equal(uk.routingShortLabel, 'Sort Code');

  const ng = getBankingPreset(undefined, 'NGN');
  assert.equal(ng.accountShortLabel, 'Account / NUBAN');

  const eu = getBankingPreset('eu_sepa', 'EUR');
  assert.equal(eu.accountShortLabel, 'IBAN');

  const au = getWireDisplayLabels({ bankRegion: 'au' }, 'AUD');
  assert.equal(au.routingShortLabel, 'BSB Code');

  const us = getWireDisplayLabels({ bankRegion: 'us' }, 'USD');
  assert.equal(us.routingShortLabel, 'ABA Routing');
});

