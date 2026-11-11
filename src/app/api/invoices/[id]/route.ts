import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice } from '@/models/Invoice';
import { Payment } from '@/models/Payment';
import { InvoiceService } from '@/services/invoice-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const invoice = await Invoice.findById(id)
      .populate('clientId', 'name email phone')
      .populate('organizationId', 'name email branding');
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const invoice = await InvoiceService.updateDraft(id, body, body.actor || 'admin');
    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'void' or default permanent delete

    if (action === 'void') {
      const invoice = await InvoiceService.voidInvoice(id, 'Voided by user', 'admin');
      return NextResponse.json({ success: true, invoice });
    }

    // Permanent delete
    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    await Payment.deleteMany({ invoiceId: id });

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

