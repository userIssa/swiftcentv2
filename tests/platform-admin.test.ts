import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateAdminRoleChange,
  isPlatformAdminEmail,
  isPlatformAdminUser,
  safeSecretMatch,
  serializeSessionUser,
} from '../src/lib/auth';
import {
  buildDailySeries,
  computePercentageRate,
  formatCompactTokens,
  formatDurationCompact,
} from '../src/lib/admin-metrics';
import { VoiceSessionUsageAccumulator } from '../src/lib/voice/usage-tracker';

test('isPlatformAdminUser distinguishes superadmins and allowlisted emails from customer accounts', () => {
  const origEmails = process.env.PLATFORM_ADMIN_EMAILS;
  const origEmail = process.env.PLATFORM_ADMIN_EMAIL;

  try {
    delete process.env.PLATFORM_ADMIN_EMAILS;
    delete process.env.PLATFORM_ADMIN_EMAIL;

    // Regular signed-up workspace owners default to role: 'admin' — must NOT get platform admin!
    assert.equal(
      isPlatformAdminUser({ email: 'customer@acme.com', role: 'admin' }),
      false
    );
    assert.equal(
      isPlatformAdminUser({ email: 'super@swiftcent.com', role: 'superadmin' }),
      true
    );

    process.env.PLATFORM_ADMIN_EMAILS = ' founder@swiftcent.com , Ops@SwiftCent.com ';
    process.env.PLATFORM_ADMIN_EMAIL = 'admin@swiftcent.com';

    assert.equal(isPlatformAdminEmail('FOUNDER@SWIFTCENT.COM'), true);
    assert.equal(isPlatformAdminEmail('admin@swiftcent.com'), true);
    assert.equal(isPlatformAdminEmail('random@acme.com'), false);

    const adminSerialized = serializeSessionUser({
      id: 'u1',
      name: 'Founder',
      email: 'ops@swiftcent.com',
      role: 'admin',
    });
    const regularSerialized = serializeSessionUser({
      id: 'u2',
      name: 'Client User',
      email: 'client@business.com',
      role: 'admin',
    });

    assert.equal(adminSerialized.isPlatformAdmin, true);
    assert.equal(regularSerialized.isPlatformAdmin, false);
  } finally {
    if (origEmails === undefined) {
      delete process.env.PLATFORM_ADMIN_EMAILS;
    } else {
      process.env.PLATFORM_ADMIN_EMAILS = origEmails;
    }
    if (origEmail === undefined) {
      delete process.env.PLATFORM_ADMIN_EMAIL;
    } else {
      process.env.PLATFORM_ADMIN_EMAIL = origEmail;
    }
  }
});

test('safeSecretMatch handles equal, unequal, and variable-length secrets cleanly', () => {
  assert.equal(safeSecretMatch('SwiftCentAdmin!2026', 'SwiftCentAdmin!2026'), true);
  assert.equal(safeSecretMatch('SwiftCentAdmin!2026', 'WrongPassword'), false);
  assert.equal(safeSecretMatch('short', 'much-longer-secret'), false);
});

test('buildDailySeries fills contiguous trailing UTC days and aggregates matching records', () => {
  const anchor = new Date('2026-11-12T10:30:00.000Z');
  const series = buildDailySeries(
    [
      { createdAt: '2026-11-12T08:00:00.000Z' },
      { createdAt: '2026-11-12T09:15:00.000Z' },
      { createdAt: '2026-11-10T23:59:00.000Z' },
      { createdAt: '2026-10-01T00:00:00.000Z' }, // outside 5-day window
      { createdAt: 'invalid-date' },
    ],
    5,
    anchor
  );

  assert.equal(series.length, 5);
  assert.deepEqual(
    series.map((p) => ({ date: p.date, count: p.count })),
    [
      { date: '2026-11-08', count: 0 },
      { date: '2026-11-09', count: 0 },
      { date: '2026-11-10', count: 1 },
      { date: '2026-11-11', count: 0 },
      { date: '2026-11-12', count: 2 },
    ]
  );
  assert.equal(computePercentageRate(3, 8), 38);
  assert.equal(computePercentageRate(5, 0), 0);
});

test('VoiceSessionUsageAccumulator tracks per-turn tokens monotonically without double-counting streaming chunks', () => {
  const acc = new VoiceSessionUsageAccumulator(10_000);

  // Intra-turn streaming chunks take max without double-counting
  acc.recordUsageMetadata({ promptTokenCount: 400, responseTokenCount: 50, totalTokenCount: 450 });
  acc.recordUsageMetadata({ promptTokenCount: 400, responseTokenCount: 120, totalTokenCount: 520 });
  acc.recordToolCalls(2);
  acc.commitTurn();

  // Second turn commits independently
  acc.recordUsageMetadata({ promptTokenCount: 600, responseTokenCount: 100, thoughtsTokenCount: 30, totalTokenCount: 730 });
  const midSnap = acc.getSnapshot(45_000);
  assert.equal(midSnap.durationSeconds, 35);
  assert.equal(midSnap.promptTokenCount, 1000);
  assert.equal(midSnap.responseTokenCount, 220);
  assert.equal(midSnap.thoughtsTokenCount, 30);
  assert.equal(midSnap.totalTokenCount, 1250);
  assert.equal(midSnap.toolCallCount, 2);
  assert.equal(midSnap.turnCount, 1);

  acc.commitTurn();
  const finalSnap = acc.getSnapshot(70_000);
  assert.equal(finalSnap.durationSeconds, 60);
  assert.equal(finalSnap.totalTokenCount, 1250);
  assert.equal(finalSnap.turnCount, 2);
});

test('formatDurationCompact and formatCompactTokens format admin metrics cleanly', () => {
  assert.equal(formatDurationCompact(0), '0s');
  assert.equal(formatDurationCompact(45), '45s');
  assert.equal(formatDurationCompact(125), '2m 5s');
  assert.equal(formatDurationCompact(3660), '1h 1m');

  assert.equal(formatCompactTokens(850), '850');
  assert.equal(formatCompactTokens(14250), '14.3K');
  assert.equal(formatCompactTokens(1250000), '1.25M');
});

test('evaluateAdminRoleChange guards self/env demotion and keeps sample data off upgraded admins', () => {
  const origAdminEmails = process.env.PLATFORM_ADMIN_EMAILS;
  const origSampleEmails = process.env.DEV_SAMPLE_ACCOUNT_EMAILS;

  try {
    process.env.PLATFORM_ADMIN_EMAILS = 'tessthetester@testing.com';
    process.env.DEV_SAMPLE_ACCOUNT_EMAILS = 'tessthetester@testing.com';

    // Promoting a regular user succeeds
    const promote = evaluateAdminRoleChange({
      actorUserId: 'admin-1',
      targetUserId: 'user-2',
      targetEmail: 'teammate@acme.com',
      makeAdmin: true,
    });
    assert.deepEqual(promote, { allowed: true, nextRole: 'superadmin' });

    // Promoted user gets isPlatformAdmin=true, while canLoadSampleData strictly stays false
    const promotedSession = serializeSessionUser({
      id: 'user-2',
      name: 'Teammate',
      email: 'teammate@acme.com',
      role: 'superadmin',
    });
    assert.equal(promotedSession.isPlatformAdmin, true);
    assert.equal(promotedSession.canLoadSampleData, false);

    // Self-demotion and env-protected demotion are blocked
    const selfDemote = evaluateAdminRoleChange({
      actorUserId: 'user-2',
      targetUserId: 'user-2',
      targetEmail: 'teammate@acme.com',
      makeAdmin: false,
    });
    assert.equal(selfDemote.allowed, false);

    const envDemote = evaluateAdminRoleChange({
      actorUserId: 'user-2',
      targetUserId: 'admin-1',
      targetEmail: 'tessthetester@testing.com',
      makeAdmin: false,
    });
    assert.equal(envDemote.allowed, false);
  } finally {
    if (origAdminEmails === undefined) {
      delete process.env.PLATFORM_ADMIN_EMAILS;
    } else {
      process.env.PLATFORM_ADMIN_EMAILS = origAdminEmails;
    }
    if (origSampleEmails === undefined) {
      delete process.env.DEV_SAMPLE_ACCOUNT_EMAILS;
    } else {
      process.env.DEV_SAMPLE_ACCOUNT_EMAILS = origSampleEmails;
    }
  }
});

