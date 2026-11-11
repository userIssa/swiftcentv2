import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { QuoteService } from '@/services/quote-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const quote = await QuoteService.markAsSent(id, body.actor || 'admin');

    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

