import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth';
import { VoiceUsageLog } from '@/models/VoiceUsageLog';

function nonNegativeInt(val: unknown): number {
  const num = Number(val);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.usageLogId !== 'string' || !mongoose.Types.ObjectId.isValid(body.usageLogId)) {
      return NextResponse.json({ success: false, error: 'Invalid usageLogId' }, { status: 400 });
    }

    await connectToDatabase();

    const durationSeconds = Math.min(86400, nonNegativeInt(body.durationSeconds));
    const promptTokenCount = nonNegativeInt(body.promptTokenCount);
    const responseTokenCount = nonNegativeInt(body.responseTokenCount);
    const thoughtsTokenCount = nonNegativeInt(body.thoughtsTokenCount);
    const totalTokenCount = Math.max(
      nonNegativeInt(body.totalTokenCount),
      promptTokenCount + responseTokenCount + thoughtsTokenCount
    );
    const toolCallCount = nonNegativeInt(body.toolCallCount);
    const turnCount = nonNegativeInt(body.turnCount);

    const existing = await VoiceUsageLog.findOne({
      _id: body.usageLogId,
      userId: session.userId,
    }).select('status');

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Usage log not found' }, { status: 404 });
    }

    const nextStatus =
      existing.status === 'ended' || body.status === 'ended' ? 'ended' : 'active';

    const setFields: Record<string, unknown> = {
      status: nextStatus,
    };

    if (nextStatus === 'ended') {
      setFields.endedAt = new Date();
      if (typeof body.endReason === 'string' && body.endReason.trim()) {
        setFields.endReason = body.endReason.trim().slice(0, 64);
      }
    }

    await VoiceUsageLog.updateOne(
      { _id: body.usageLogId, userId: session.userId },
      {
        $max: {
          durationSeconds,
          promptTokenCount,
          responseTokenCount,
          thoughtsTokenCount,
          totalTokenCount,
          toolCallCount,
          turnCount,
        },
        $set: setFields,
      }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to record voice usage' },
      { status: 500 }
    );
  }
}

