import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Quote } from '@/models/Quote';
import { QuoteService } from '@/services/quote-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();
    const { token } = await params;
    const body = await request.json().catch(() => ({}));

    const quote = await Quote.findOne({ publicAccessToken: token });
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
    }

    const approvedQuote = await QuoteService.approveQuote(
      quote._id.toString(),
      body.clientName ? `client (${body.clientName})` : 'client_portal'
    );

    return NextResponse.json({
      success: true,
      message: 'Quote approved successfully',
      quote: approvedQuote,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

