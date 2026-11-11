import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { InvoiceService } from '@/services/invoice-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();
    const { token } = await params;
    const invoice = await InvoiceService.getByPublicToken(token);
    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  }
}

