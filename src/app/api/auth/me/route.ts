import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serializeSessionUser, verifySessionToken } from '@/lib/auth';

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

    return NextResponse.json({
      success: true,
      user: serializeSessionUser({
        id: payload.userId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      }),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

