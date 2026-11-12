import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { getPlatformAdminOverview } from '@/services/admin-service';

export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const overview = await getPlatformAdminOverview();
    return NextResponse.json({
      success: true,
      overview,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load platform overview' },
      { status: 500 }
    );
  }
}

