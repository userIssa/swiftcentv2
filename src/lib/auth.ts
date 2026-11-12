import crypto from 'crypto';
import { cookies } from 'next/headers';

const DEFAULT_AUTH_SECRET = 'swiftcent-super-secure-jwt-hmac-secret-key-2026';
const AUTH_SECRET = process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET;

export function isCustomAuthSecretConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.trim().length > 0);
}

/**
 * Constant-time equality check for secret/password strings of arbitrary length.
 */
export function safeSecretMatch(candidate: string, expected: string): boolean {
  const candidateDigest = crypto.createHash('sha256').update(candidate).digest();
  const expectedDigest = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(candidateDigest, expectedDigest);
}

function parseEmailList(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

export function createSessionToken(user: { _id: any; email: string; name: string; role: string }): string {
  const payload: SessionPayload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role || 'admin',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(dataStr).digest('base64url');
  return `${dataStr}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [dataStr, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(dataStr).digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('swiftcent_session')?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Checks if an authenticated account is allowlisted via DEV_SAMPLE_ACCOUNT_EMAILS
 * to access sample workspace population tools for stakeholder walkthroughs.
 */
export function isSampleDataEnabledForEmail(email?: string | null): boolean {
  if (!email) return false;
  const allowlist = parseEmailList(process.env.DEV_SAMPLE_ACCOUNT_EMAILS);
  return allowlist.includes(email.trim().toLowerCase());
}

/**
 * Checks if an email is explicitly allowlisted via PLATFORM_ADMIN_EMAILS or PLATFORM_ADMIN_EMAIL.
 */
export function isPlatformAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const allowlist = [
    ...parseEmailList(process.env.PLATFORM_ADMIN_EMAILS),
    ...parseEmailList(process.env.PLATFORM_ADMIN_EMAIL),
  ];
  return allowlist.includes(normalized);
}

/**
 * Regular customer accounts default to role='admin' for their own workspaces,
 * so platform-level admin access requires explicit role='superadmin' or allowlisted email.
 */
export function isPlatformAdminUser(
  user?: { email?: string | null; role?: string | null } | null
): boolean {
  if (!user) return false;
  return user.role === 'superadmin' || isPlatformAdminEmail(user.email);
}

export function serializeSessionUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    canLoadSampleData: isSampleDataEnabledForEmail(user.email),
    isPlatformAdmin: isPlatformAdminUser(user),
  };
}

export type RoleChangeDecision =
  | { allowed: true; nextRole: 'superadmin' | 'admin' }
  | { allowed: false; status: 400; error: string };

/**
 * Enforces safety rules when an admin promotes or demotes another user account.
 */
export function evaluateAdminRoleChange(params: {
  actorUserId: string;
  targetUserId: string;
  targetEmail: string;
  makeAdmin: boolean;
}): RoleChangeDecision {
  if (!params.makeAdmin && params.actorUserId === params.targetUserId) {
    return {
      allowed: false,
      status: 400,
      error: 'You cannot remove your own platform admin access.',
    };
  }

  if (!params.makeAdmin && isPlatformAdminEmail(params.targetEmail)) {
    return {
      allowed: false,
      status: 400,
      error: 'This account is protected by PLATFORM_ADMIN_EMAILS environment configuration.',
    };
  }

  return {
    allowed: true,
    nextRole: params.makeAdmin ? 'superadmin' : 'admin',
  };
}

