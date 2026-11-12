import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serializeSessionUser, verifySessionToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('swiftcent_session')?.value;

    if (!token) {
      return NextResponse.json({ success: true, user: null });
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ success: true, user: null });
    }

    await connectToDatabase();
    const dbUser = await User.findById(payload.userId)
      .select('name email role')
      .lean();

    if (!dbUser) {
      return NextResponse.json({ success: true, user: null });
    }

    return NextResponse.json({
      success: true,
      user: serializeSessionUser({
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      }),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
