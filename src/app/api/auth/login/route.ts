import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  serializeSessionUser,
  safeSecretMatch,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    // Safely auto-provision the env-configured Platform Admin on first sign-in
    if (!user) {
      const configuredAdminEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
      const configuredAdminPassword = process.env.PLATFORM_ADMIN_PASSWORD;

      if (
        configuredAdminEmail &&
        configuredAdminPassword &&
        normalizedEmail === configuredAdminEmail &&
        safeSecretMatch(String(password), configuredAdminPassword)
      ) {
        const { salt, hash } = hashPassword(String(password));
        const adminName = process.env.PLATFORM_ADMIN_NAME?.trim() || 'Platform Admin';
        user = await User.create({
          name: adminName,
          email: normalizedEmail,
          salt,
          passwordHash: hash,
          role: 'superadmin',
          lastLoginAt: new Date(),
        });
      } else {
        return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }
    } else {
      const isValid = verifyPassword(password, user.salt, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }
      await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
    }

    const token = createSessionToken(user);

    const response = NextResponse.json({
      success: true,
      user: serializeSessionUser({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      }),
    });

    response.cookies.set('swiftcent_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

