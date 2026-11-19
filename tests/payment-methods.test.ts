import test from 'node:test';
import assert from 'node:assert/strict';

export type PaymentMethodOption = 'both' | 'online' | 'bank_transfer';

export function isOnlinePaymentAllowed(option?: PaymentMethodOption | string | null): boolean {
  return option !== 'bank_transfer';
}

export function isBankTransferAllowed(option?: PaymentMethodOption | string | null): boolean {
  return option !== 'online';
}

test('isOnlinePaymentAllowed hides online card payment for bank_transfer mode', () => {
  assert.equal(isOnlinePaymentAllowed('bank_transfer'), false);
  assert.equal(isOnlinePaymentAllowed('online'), true);
  assert.equal(isOnlinePaymentAllowed('both'), true);
  assert.equal(isOnlinePaymentAllowed(undefined), true);
  assert.equal(isOnlinePaymentAllowed(null), true);
});

test('isBankTransferAllowed checks wire eligibility per payment method option', () => {
  assert.equal(isBankTransferAllowed('bank_transfer'), true);
  assert.equal(isBankTransferAllowed('online'), false);
  assert.equal(isBankTransferAllowed('both'), true);
  assert.equal(isBankTransferAllowed(undefined), true);
  assert.equal(isBankTransferAllowed(null), true);
});

