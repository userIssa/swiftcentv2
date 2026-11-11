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
    const body = await request.json();

    const result = await InvoiceService.recordPayment(id, {
      amountCents: Number(body.amountCents),
      paymentMethod: body.paymentMethod,
      transactionReference: body.transactionReference,
      notes: body.notes,
      actor: body.actor || 'admin',
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

