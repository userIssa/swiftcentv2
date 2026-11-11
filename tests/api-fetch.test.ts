import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchJsonWithBuffer,
  isTransientRetryStatus,
  shouldRetryRequest,
} from '../src/lib/api-fetch';

test('shouldRetryRequest defaults to safe retries on GET and opts in explicitly for POST reads', () => {
  assert.equal(shouldRetryRequest('GET'), true);
  assert.equal(shouldRetryRequest(undefined), true);
  assert.equal(shouldRetryRequest('POST'), false);
  assert.equal(shouldRetryRequest('POST', true), true);
  assert.equal(shouldRetryRequest('GET', false), false);
});

test('isTransientRetryStatus identifies cold-start gateway & rate-limit status codes', () => {
  assert.equal(isTransientRetryStatus(504), true);
  assert.equal(isTransientRetryStatus(503), true);
  assert.equal(isTransientRetryStatus(502), true);
  assert.equal(isTransientRetryStatus(429), true);
  assert.equal(isTransientRetryStatus(408), true);
  assert.equal(isTransientRetryStatus(400), false);
  assert.equal(isTransientRetryStatus(404), false);
});

test('fetchJsonWithBuffer retries transient 504 HTML gateway responses and recovers when API responds', async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  try {
    globalThis.fetch = (async () => {
      attempts += 1;
      if (attempts === 1) {
        return new Response('<HTML><HEAD><TITLE>Inactivity Timeout</TITLE></HEAD></HTML>', {
          status: 504,
          headers: { 'Content-Type': 'text/html' },
        });
      }
      return new Response(JSON.stringify({ success: true, items: [1, 2] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const result = await fetchJsonWithBuffer('/api/invoices', {
      timeoutMs: 2000,
      retries: 1,
    });
    assert.equal(attempts, 2);
    assert.equal(result.success, true);
    assert.deepEqual(result.items, [1, 2]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchJsonWithBuffer surfaces clear message instead of JSON parse crash on final non-JSON 502', async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () =>
      new Response('<html><body>Bad Gateway</body></html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      })) as typeof fetch;

    const result = await fetchJsonWithBuffer('/api/auth/login', {
      method: 'POST',
      retries: 0,
    });
    assert.equal(result.success, false);
    assert.match(result.error, /HTTP 502/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

