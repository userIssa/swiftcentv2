import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Quote } from '@/models/Quote';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const quote = await Quote.findById(id)
      .populate('clientId', 'name email phone')
      .populate('convertedInvoiceId', 'invoiceNumber');
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const quote = await Quote.findByIdAndDelete(id);
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Quote ${quote.quoteNumber} deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
