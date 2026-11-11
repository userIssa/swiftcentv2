import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Client } from '@/models/Client';
import { Invoice } from '@/models/Invoice';
import { Quote } from '@/models/Quote';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, client });
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

    const client = await Client.findByIdAndUpdate(id, body, { new: true });
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, client });
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

    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Check if client has active invoices or quotes
    const invoiceCount = await Invoice.countDocuments({ clientId: id });
    const quoteCount = await Quote.countDocuments({ clientId: id });

    if (invoiceCount > 0 || quoteCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete client with active records (${invoiceCount} invoices, ${quoteCount} quotes). Please delete the associated records first.`,
        },
        { status: 400 }
      );
    }

    await Client.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Client "${client.name}" deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

