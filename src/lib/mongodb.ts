import mongoose from 'mongoose';

const DEFAULT_LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/swiftcent';

export function resolveMongoUri(): string {
  const configured = process.env.MONGODB_URI?.trim();
  if (configured) return configured;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'MONGODB_URI environment variable is not set in production. Configure it in your hosting environment settings.'
    );
  }

  return DEFAULT_LOCAL_MONGODB_URI;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = globalThis.mongooseCache;

if (!cached) {
  cached = globalThis.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const uri = resolveMongoUri();
    cached!.promise = mongoose.connect(uri, {
      bufferCommands: false,
      // Fail before serverless gateways (e.g. Netlify 10s-26s) time out with HTML 504 errors
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 15000,
      maxPoolSize: 10,
    }).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}
