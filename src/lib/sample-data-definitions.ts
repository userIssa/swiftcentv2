export interface SampleClientSeed {
  name: string;
  email: string;
  phone: string;
  taxId: string;
  paymentTermsDays: number;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface SampleProductSeed {
  name: string;
  description: string;
  unitPriceCents: number;
  taxRate: number;
}

export const SAMPLE_CLIENTS: SampleClientSeed[] = [
  {
    name: 'Acme Global Corp.',
    email: 'finance@acmeglobal.com',
    phone: '+1 (415) 890-1234',
    taxId: 'US-EIN-12-3456789',
    paymentTermsDays: 14,
    billingAddress: {
      street: '100 Market Street, Suite 1500',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'USA',
    },
  },
  {
    name: 'Northstar Systems Inc.',
    email: 'ap@northstarsystems.io',
    phone: '+1 (650) 555-0199',
    taxId: 'US-EIN-98-7654321',
    paymentTermsDays: 30,
    billingAddress: {
      street: '354 Oyster Point Blvd',
      city: 'South San Francisco',
      state: 'CA',
      postalCode: '94080',
      country: 'USA',
    },
  },
  {
    name: 'Lumen Creative Labs',
    email: 'accounts@lumencreative.co',
    phone: '+1 (415) 555-8822',
    taxId: 'US-EIN-45-6789012',
    paymentTermsDays: 14,
    billingAddress: {
      street: '760 Market St, Floor 8',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'USA',
    },
  },
];

export const SAMPLE_PRODUCTS: SampleProductSeed[] = [
  {
    name: 'Full-Stack Web & Mobile Engineering',
    description:
      'Dedicated engineering sprint with CI/CD pipeline setup and automated test coverage.',
    unitPriceCents: 450000,
    taxRate: 0,
  },
  {
    name: 'Cloud Infrastructure & DevOps SLA',
    description:
      'Multi-region architecture deployment, container orchestration, and uptime monitoring.',
    unitPriceCents: 250000,
    taxRate: 5,
  },
  {
    name: 'UI/UX Design & Design System Prototyping',
    description: 'High-fidelity Figma prototypes, design tokens, and interactive user flows.',
    unitPriceCents: 180000,
    taxRate: 0,
  },
  {
    name: 'Quarterly Security & Compliance Audit',
    description: 'Vulnerability assessment, access control review, and remediation report.',
    unitPriceCents: 320000,
    taxRate: 10,
  },
];

export const SAMPLE_INVOICE_DESCRIPTIONS = [
  'Cloud Infrastructure & High-Availability Database Deployment',
  'Full-Stack Web & Mobile Engineering Sprint',
  'UI/UX Design & Component Library Audit',
  'Monthly DevOps & SLA Support Retainer',
];

export const SAMPLE_QUOTE_DESCRIPTIONS = [
  'Enterprise SSO & Multi-Region Failover Architecture',
  'Security Penetration & Compliance Review',
];

export const SAMPLE_CLIENT_EMAILS = SAMPLE_CLIENTS.map((c) => c.email.toLowerCase());
export const LEGACY_DEMO_CLIENT_EMAILS = ['billing@stripe-demo.com', 'accounts@figma-demo.com'];
export const SAMPLE_PRODUCT_NAMES = SAMPLE_PRODUCTS.map((p) => p.name);

