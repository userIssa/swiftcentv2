import test from 'node:test';
import assert from 'node:assert/strict';
import { isSampleDataEnabledForEmail, serializeSessionUser } from '../src/lib/auth';
import {
  LEGACY_DEMO_CLIENT_EMAILS,
  SAMPLE_CLIENT_EMAILS,
  SAMPLE_CLIENTS,
  SAMPLE_PRODUCT_NAMES,
  SAMPLE_PRODUCTS,
} from '../src/lib/sample-data-definitions';

test('isSampleDataEnabledForEmail allows only explicitly allowlisted accounts', () => {
  const original = process.env.DEV_SAMPLE_ACCOUNT_EMAILS;
  try {
    delete process.env.DEV_SAMPLE_ACCOUNT_EMAILS;
    assert.equal(isSampleDataEnabledForEmail('tessthetester@testing.com'), false);

    process.env.DEV_SAMPLE_ACCOUNT_EMAILS = '';
    assert.equal(isSampleDataEnabledForEmail('any@user.com'), false);

    process.env.DEV_SAMPLE_ACCOUNT_EMAILS = ' Dev@SwiftCent.com , presenter@company.io ';
    assert.equal(isSampleDataEnabledForEmail('dev@swiftcent.com'), true);
    assert.equal(isSampleDataEnabledForEmail('PRESENTER@COMPANY.IO'), true);
    assert.equal(isSampleDataEnabledForEmail('customer@acme.com'), false);
    assert.equal(isSampleDataEnabledForEmail(null), false);

    const allowedUser = serializeSessionUser({
      id: '1',
      name: 'Dev',
      email: 'dev@swiftcent.com',
      role: 'admin',
    });
    const regularUser = serializeSessionUser({
      id: '2',
      name: 'Customer',
      email: 'customer@acme.com',
      role: 'admin',
    });
    assert.equal(allowedUser.canLoadSampleData, true);
    assert.equal(regularUser.canLoadSampleData, false);
  } finally {
    if (original === undefined) {
      delete process.env.DEV_SAMPLE_ACCOUNT_EMAILS;
    } else {
      process.env.DEV_SAMPLE_ACCOUNT_EMAILS = original;
    }
  }
});

test('sample data definitions maintain consistent client/product sets without legacy overlap', () => {
  assert.deepEqual(
    SAMPLE_CLIENT_EMAILS,
    SAMPLE_CLIENTS.map((c) => c.email)
  );
  assert.deepEqual(
    SAMPLE_PRODUCT_NAMES,
    SAMPLE_PRODUCTS.map((p) => p.name)
  );
  const currentSet = new Set(SAMPLE_CLIENT_EMAILS);
  for (const legacyEmail of LEGACY_DEMO_CLIENT_EMAILS) {
    assert.equal(currentSet.has(legacyEmail), false);
  }
});

