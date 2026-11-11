export type VoiceDocumentType = 'invoice' | 'quote';

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export interface VoiceFormLineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  taxName: string;
  taxRate: string;
  taxMethod: 'exclusive' | 'inclusive';
}

export interface VoiceDocumentDraft {
  documentType: VoiceDocumentType;
  organizationId: string;
  selectedClientId: string;
  currency: string;
  issueDate: string;
  dueOrValidDate: string;
  notes: string;
  terms: string;
  items: VoiceFormLineItem[];
}

export interface ResolvedClientCandidate {
  _id: string;
  name: string;
  email: string;
  currency?: string;
  paymentTermsDays?: number;
  score?: number;
}

export interface ResolvedProductCandidate {
  _id: string;
  name: string;
  description?: string;
  unitPriceCents: number;
  taxRate: number;
  taxMethod: 'exclusive' | 'inclusive';
  score?: number;
}

export interface VoiceResolveResponse {
  success: boolean;
  clients: ResolvedClientCandidate[];
  products: ResolvedProductCandidate[];
  error?: string;
}

export type VoiceConnectionState =
  | 'idle'
  | 'initializing'
  | 'connected'
  | 'reconnecting'
  | 'paused'
  | 'error';

export interface VoiceTranscriptEntry {
  id: string;
  speaker: 'user' | 'assistant' | 'action' | 'system';
  text: string;
  timestamp: string;
  isFinal?: boolean;
}

export interface VoiceSessionTokenResponse {
  success: boolean;
  token?: string;
  model?: string;
  expireTime?: string;
  organizationId?: string;
  organizationName?: string;
  currency?: string;
  code?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'MISSING_API_KEY' | 'BAD_REQUEST' | 'UPSTREAM_ERROR';
  error?: string;
}

export interface VoiceDraftSummarySnapshot {
  documentType: VoiceDocumentType;
  clientName: string | null;
  currency: string;
  issueDate: string;
  dueOrValidDate: string;
  itemCount: number;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
  subtotalCents: number;
  totalDiscountCents: number;
  totalTaxCents: number;
  grandTotalCents: number;
  formattedGrandTotal: string;
  notes: string;
  terms: string;
}

export interface VoiceDraftActions {
  setClientById: (clientId: string) => void;
  onClientCreated?: (client: ResolvedClientCandidate) => void;
  setCurrency: (currency: string) => void;
  setIssueDate: (isoDate: string) => void;
  setDueOrValidDate: (isoDate: string) => void;
  setNotes: (notes: string) => void;
  setTerms: (terms: string) => void;
  setItems: React.Dispatch<React.SetStateAction<VoiceFormLineItem[]>>;
  onFieldFlash?: (field: string) => void;
}

