import test from 'node:test';
import assert from 'node:assert/strict';
import { executeVoiceToolCall } from '../src/lib/voice/tool-executor';
import {
  buildVoiceSystemInstruction,
  VOICE_DRAFT_FUNCTION_DECLARATIONS,
} from '../src/lib/voice/tool-declarations';
import { VoiceDocumentDraft, VoiceDraftActions, VoiceFormLineItem } from '../src/lib/voice/types';

test('navigate_to_page tool call routes to destination and returns business context', async () => {
  const dummyDraft: VoiceDocumentDraft = {
    documentType: 'invoice',
    organizationId: 'org_123',
    selectedClientId: '',
    currency: 'USD',
    issueDate: '2026-11-19',
    dueOrValidDate: '2026-12-03',
    notes: '',
    terms: '',
    items: [],
  };

  const dummyActions: VoiceDraftActions = {
    setClientById: () => {},
    setCurrency: () => {},
    setIssueDate: () => {},
    setDueOrValidDate: () => {},
    setNotes: () => {},
    setTerms: () => {},
    setItems: () => {},
  };

  let navigatedPath: string | null = null;
  const mockOverview = {
    totalInvoiced: '$24,500.00',
    totalCollected: '$18,200.00',
    outstandingReceivables: '$6,300.00',
    overdueCount: 2,
    overdueAmount: '$2,100.00',
    activeQuotesCount: 3,
    activeQuotesTotal: '$8,500.00',
  };

  const toolCall = {
    id: 'call_nav_1',
    name: 'navigate_to_page',
    args: {
      destination: 'reports',
      reason: 'Viewing reports for user',
    },
  };

  const result = await executeVoiceToolCall(toolCall, {
    draftRef: { current: dummyDraft },
    clientsDirectoryRef: { current: [] },
    actions: dummyActions,
    onActionLog: () => {},
    onNavigate: async (path) => {
      navigatedPath = path;
    },
    onGetBusinessOverview: async () => mockOverview,
  });

  assert.equal(navigatedPath, '/reports');
  assert.equal(result.name, 'navigate_to_page');
  const resp = result.response as any;
  assert.equal(resp.success, true);
  assert.equal(resp.destination, 'reports');
  assert.equal(resp.path, '/reports');
  assert.deepEqual(resp.businessOverview, mockOverview);
});

test('get_business_overview tool call retrieves financial health for conversational answers', async () => {
  const dummyDraft: VoiceDocumentDraft = {
    documentType: 'invoice',
    organizationId: 'org_123',
    selectedClientId: '',
    currency: 'USD',
    issueDate: '2026-11-19',
    dueOrValidDate: '2026-12-03',
    notes: '',
    terms: '',
    items: [],
  };

  const dummyActions: VoiceDraftActions = {
    setClientById: () => {},
    setCurrency: () => {},
    setIssueDate: () => {},
    setDueOrValidDate: () => {},
    setNotes: () => {},
    setTerms: () => {},
    setItems: () => {},
  };

  const mockOverview = {
    totalInvoiced: '$10,000.00',
    totalCollected: '$8,000.00',
    outstandingReceivables: '$2,000.00',
  };

  const toolCall = {
    id: 'call_overview_1',
    name: 'get_business_overview',
    args: {},
  };

  const result = await executeVoiceToolCall(toolCall, {
    draftRef: { current: dummyDraft },
    clientsDirectoryRef: { current: [] },
    actions: dummyActions,
    onActionLog: () => {},
    onGetBusinessOverview: async () => mockOverview,
  });

  assert.equal(result.name, 'get_business_overview');
  const resp = result.response as any;
  assert.equal(resp.success, true);
  assert.deepEqual(resp.businessOverview, mockOverview);
});

test('buildVoiceSystemInstruction builds warm co-worker persona and includes user name + greeting + live overview', () => {
  const prompt = buildVoiceSystemInstruction({
    organizationName: 'Genesis Group',
    defaultCurrency: 'USD',
    userName: 'Tess',
    todayIso: '2026-11-19',
    sampleClients: [{ name: 'Acme Corp', email: 'billing@acme.com' }],
    sampleProducts: [{ name: 'Consulting', priceDisplay: '$150.00', taxRate: 0 }],
    overview: {
      totalInvoiced: '$25,000.00',
      totalCollected: '$18,000.00',
      outstandingReceivables: '$7,000.00',
      overdueCount: 2,
      overdueAmount: '$2,500.00',
      activeQuotesCount: 3,
      activeQuotesTotal: '$9,000.00',
      recentInvoicesSummary: 'INV-01001 (Acme, $1,500.00 due)',
    },
  });

  // Persona
  assert.match(prompt, /Tess/);
  assert.match(prompt, /co-worker and financial assistant/i);
  assert.match(prompt, /not a silent robot/i);

  // Greeting
  assert.match(prompt, /What can I do for you today\?/i);

  // Navigation & walkthrough
  assert.match(prompt, /navigate_to_page/);
  assert.match(prompt, /On Reports: Summarize their collections, outstanding receivables/i);

  // Financial grounding
  assert.match(prompt, /\$25,000\.00/);
  assert.match(prompt, /\$7,000\.00/);
  assert.match(prompt, /2 accounts totaling \$2,500\.00/);

  // Tool declaration checks
  assert.ok(VOICE_DRAFT_FUNCTION_DECLARATIONS.some((d) => d.name === 'navigate_to_page'));
  assert.ok(VOICE_DRAFT_FUNCTION_DECLARATIONS.some((d) => d.name === 'get_business_overview'));
});

