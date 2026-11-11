import type { ComboboxOption } from '@/components/SearchableCombobox';
import { formatCurrency } from '@/engine/calculator';

export interface OrganizationSummary {
  _id: string;
  name: string;
  email?: string;
  currency?: string;
}

export interface ClientSummary {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface ProductSummary {
  _id: string;
  name: string;
  description?: string;
  unitPriceCents: number;
  taxRate?: number;
  taxMethod?: string;
}

export const PAYMENT_METHOD_OPTIONS: ComboboxOption[] = [
  {
    value: 'stripe',
    label: 'Stripe (Online Card / Wallet)',
    icon: '💳',
    searchText: 'stripe online card apple pay google pay wallet',
  },
  {
    value: 'bank_transfer',
    label: 'Bank Transfer (Local / SEPA / Wire)',
    icon: '🏦',
    searchText: 'bank transfer local sepa iban nuban ach wire swift',
  },
  {
    value: 'credit_card',
    label: 'Credit Card (Terminal)',
    icon: '🏧',
    searchText: 'credit card debit terminal pos',
  },
  {
    value: 'cash',
    label: 'Cash / Check',
    icon: '💵',
    searchText: 'cash check cheque',
  },
  {
    value: 'manual',
    label: 'Other / Manual',
    icon: '📝',
    searchText: 'other manual custom',
  },
];

export function buildOrganizationOptions(
  organizations: OrganizationSummary[]
): ComboboxOption[] {
  return organizations.map((org) => ({
    value: org._id,
    label: org.email ? `${org.name} (${org.email})` : org.name,
    icon: '🏢',
    searchText: [org.name, org.email, org.currency].filter(Boolean).join(' '),
  }));
}

export function buildClientOptions(clients: ClientSummary[]): ComboboxOption[] {
  return clients.map((client) => ({
    value: client._id,
    label: client.email ? `${client.name} (${client.email})` : client.name,
    icon: '👤',
    searchText: [client.name, client.email, client.phone].filter(Boolean).join(' '),
  }));
}

export function buildProductOptions(
  products: ProductSummary[],
  currency: string
): ComboboxOption[] {
  return products.map((product) => ({
    value: product._id,
    label: `${product.name} (${formatCurrency(product.unitPriceCents || 0, currency)})`,
    icon: '📦',
    searchText: [product.name, product.description].filter(Boolean).join(' '),
  }));
}

