import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { InvoiceService } from '@/services/invoice-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const invoice = await InvoiceService.markAsSent(id, body.actor || 'admin');

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

