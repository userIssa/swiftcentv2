import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionUser, SessionPayload } from '@/lib/auth';
import { Organization, IOrganization } from '@/models/Organization';

export interface AuthorizedOrgResult {
  session: SessionPayload;
  organization: IOrganization;
  errorResponse?: never;
}

export interface UnauthorizedOrgResult {
  session?: never;
  organization?: never;
  errorResponse: NextResponse;
}

/**
 * Authenticates the active session user and verifies ownership of the target Organization workspace.
 */
export async function resolveAuthorizedOrganization(
  organizationId?: string | null
): Promise<AuthorizedOrgResult | UnauthorizedOrgResult> {
  await connectToDatabase();
  const session = await getSessionUser();

  if (!session) {
    return {
      errorResponse: NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  let organization: IOrganization | null = null;

  if (organizationId && typeof organizationId === 'string') {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return {
        errorResponse: NextResponse.json(
          { success: false, code: 'BAD_REQUEST', error: 'Invalid workspace organizationId' },
          { status: 400 }
        ),
      };
    }

    organization = await Organization.findOne({
      _id: organizationId,
      ownerId: session.userId,
    });

    if (!organization) {
      return {
        errorResponse: NextResponse.json(
          { success: false, code: 'FORBIDDEN', error: 'Not authorized for this business workspace' },
          { status: 403 }
        ),
      };
    }
  } else {
    organization = await Organization.findOne({ ownerId: session.userId }).sort({ createdAt: 1 });
    if (!organization) {
      return {
        errorResponse: NextResponse.json(
          { success: false, code: 'BAD_REQUEST', error: 'No active business workspace found' },
          { status: 400 }
        ),
      };
    }
  }

  return { session, organization };
}

