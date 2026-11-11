import { connectToDatabase } from '../lib/mongodb';
import { IOrganization, Organization } from '../models/Organization';

export class OrganizationService {
  static async getOrg(id: string): Promise<IOrganization | null> {
    await connectToDatabase();
    return Organization.findById(id);
  }

  static async updateOrg(id: string, updates: Partial<IOrganization>): Promise<IOrganization | null> {
    await connectToDatabase();
    return Organization.findByIdAndUpdate(id, updates, { new: true });
  }
}

