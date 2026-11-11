import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { QuoteService } from '@/services/quote-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();
    const { token } = await params;
    const quote = await QuoteService.getByPublicToken(token);
    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  }
}

