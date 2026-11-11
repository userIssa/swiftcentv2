import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMongoUri } from '../src/lib/mongodb';

test('resolveMongoUri requires MONGODB_URI in production and falls back cleanly in dev', () => {
  const originalUri = process.env.MONGODB_URI;
  const originalEnv = process.env.NODE_ENV;
  const mutableEnv = process.env as Record<string, string | undefined>;

  try {
    delete mutableEnv.MONGODB_URI;
    mutableEnv.NODE_ENV = 'development';
    assert.equal(resolveMongoUri(), 'mongodb://127.0.0.1:27017/swiftcent');

    mutableEnv.NODE_ENV = 'production';
    assert.throws(() => resolveMongoUri(), /MONGODB_URI environment variable is not set in production/);

    mutableEnv.MONGODB_URI = '  mongodb+srv://user:pass@cluster.mongodb.net/swiftcent  ';
    assert.equal(resolveMongoUri(), 'mongodb+srv://user:pass@cluster.mongodb.net/swiftcent');
  } finally {
    if (originalUri === undefined) {
      delete mutableEnv.MONGODB_URI;
    } else {
      mutableEnv.MONGODB_URI = originalUri;
    }
    if (originalEnv === undefined) {
      delete mutableEnv.NODE_ENV;
    } else {
      mutableEnv.NODE_ENV = originalEnv;
    }
  }
});

