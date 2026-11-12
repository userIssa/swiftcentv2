import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { evaluateAdminRoleChange, isPlatformAdminUser } from '@/lib/auth';
import { User } from '@/models/User';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid user id' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.makeAdmin !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'makeAdmin boolean is required' },
        { status: 400 }
      );
    }

    const target = await User.findById(id).select('name email role');
    if (!target) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const decision = evaluateAdminRoleChange({
      actorUserId: auth.user.id,
      targetUserId: target._id.toString(),
      targetEmail: target.email,
      makeAdmin: body.makeAdmin,
    });

    if (!decision.allowed) {
      return NextResponse.json(
        { success: false, error: decision.error },
        { status: decision.status }
      );
    }

    await User.updateOne({ _id: id }, { $set: { role: decision.nextRole } });

    return NextResponse.json({
      success: true,
      user: {
        id: target._id.toString(),
        name: target.name,
        email: target.email,
        role: decision.nextRole,
        isPlatformAdmin: isPlatformAdminUser({
          email: target.email,
          role: decision.nextRole,
        }),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update admin role' },
      { status: 500 }
    );
  }
}

