import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Client } from '@/models/Client';
import { Organization } from '@/models/Organization';
import { ClientService } from '@/services/client-service';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ success: true, clients: [] });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organizationId');

    const userOrgs = await Organization.find({ ownerId: session.userId }).select('_id');
    const userOrgIds = userOrgs.map((o) => o._id.toString());

    if (userOrgIds.length === 0) {
      return NextResponse.json({ success: true, clients: [] });
    }

    let clients;
    if (orgId && orgId !== 'all') {
      if (!userOrgIds.includes(orgId)) {
        return NextResponse.json({ success: true, clients: [] });
      }
      clients = await Client.find({ organizationId: orgId }).sort({ name: 1 });
    } else {
      clients = await Client.find({ organizationId: { $in: userOrgIds } }).sort({ name: 1 });
    }

    return NextResponse.json({ success: true, clients });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let orgId = body.organizationId;

    if (!orgId) {
      const userOrg = await Organization.findOne({ ownerId: session.userId });
      if (!userOrg) {
        return NextResponse.json({ success: false, error: 'No business workspace found for your account' }, { status: 400 });
      }
      orgId = userOrg._id.toString();
    } else {
      const allowed = await Organization.findOne({ _id: orgId, ownerId: session.userId });
      if (!allowed) {
        return NextResponse.json({ success: false, error: 'Unauthorized for this business' }, { status: 403 });
      }
    }

    const client = await ClientService.createClient({
      ...body,
      organizationId: orgId,
    });

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
