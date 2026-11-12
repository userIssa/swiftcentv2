import { connectToDatabase } from '@/lib/mongodb';
import { getSessionUser, isPlatformAdminUser } from '@/lib/auth';
import { User } from '@/models/User';

export type PlatformAdminCheck =
  | {
      ok: true;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
    }
  | {
      ok: false;
      status: 401 | 403;
      error: string;
    };

/**
 * Verifies both the signed session cookie and live database user record
 * so demoted or removed accounts cannot retain platform admin access.
 */
export async function requirePlatformAdmin(): Promise<PlatformAdminCheck> {
  const session = await getSessionUser();
  if (!session) {
    return {
      ok: false,
      status: 401,
      error: 'Authentication required',
    };
  }

  await connectToDatabase();
  const dbUser = await User.findById(session.userId)
    .select('name email role')
    .lean();

  if (!dbUser || !isPlatformAdminUser(dbUser)) {
    return {
      ok: false,
      status: 403,
      error: 'Platform administrator access required',
    };
  }

  return {
    ok: true,
    user: {
      id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
    },
  };
}

