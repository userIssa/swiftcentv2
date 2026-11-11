import { connectToDatabase } from '../lib/mongodb';
import { Client, IClient } from '../models/Client';

export class ClientService {
  static async listClients(organizationId: string): Promise<IClient[]> {
    await connectToDatabase();
    return Client.find({ organizationId }).sort({ name: 1 });
  }

  static async getClient(id: string): Promise<IClient | null> {
    await connectToDatabase();
    return Client.findById(id);
  }

  static async createClient(data: {
    organizationId: string;
    name: string;
    email: string;
    phone?: string;
    currency?: string;
    taxId?: string;
    billingAddress?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    paymentTermsDays?: number;
    notes?: string;
  }): Promise<IClient> {
    await connectToDatabase();
    const client = new Client(data);
    await client.save();
    return client;
  }

  static async updateClient(id: string, updates: Partial<IClient>): Promise<IClient | null> {
    await connectToDatabase();
    return Client.findByIdAndUpdate(id, updates, { new: true });
  }
}

