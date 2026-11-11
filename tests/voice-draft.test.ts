import test from 'node:test';
import assert from 'node:assert/strict';
import { Behavior, FunctionResponseScheduling } from '@google/genai';
import {
  buildLiveDraftSummary,
  computeDueDateIso,
  isStarterPlaceholderItem,
  rankCatalogMatches,
  scoreTextMatch,
} from '../src/lib/voice/catalog-matcher';
import {
  buildVoiceSystemInstruction,
  VOICE_DRAFT_FUNCTION_DECLARATIONS,
} from '../src/lib/voice/tool-declarations';
import { executeVoiceToolCall } from '../src/lib/voice/tool-executor';
import { computeVoiceDockGeometry } from '../src/lib/voice/dock-layout';
import { INACTIVITY_AUTO_END_MS } from '../src/lib/voice/useVoiceDraftSession';
import { VoiceDocumentDraft, VoiceDraftActions, VoiceFormLineItem } from '../src/lib/voice/types';

test('scoreTextMatch and rankCatalogMatches resolve fuzzy client and catalog queries', () => {
  assert.equal(scoreTextMatch('Acme Global Corp', ['Acme Global Corp.']), 1.0);
  assert.ok(scoreTextMatch('cloud devops', ['Cloud Infrastructure & DevOps SLA']) >= 0.7);
  assert.equal(scoreTextMatch('unrelated query', ['Figma Design Labs']), 0);

  const ranked = rankCatalogMatches(
    'devops',
    [
      { _id: '1', name: 'UI/UX Design Prototyping' },
      { _id: '2', name: 'Cloud Infrastructure & DevOps SLA' },
      { _id: '3', name: 'DevOps Quick Consulting' },
    ],
    (p) => [p.name]
  );

  assert.equal(ranked.length, 2);
  assert.equal(ranked[0]._id, '3'); // prefix match outranks substring match
  assert.equal(ranked[1]._id, '2');
});

test('computeDueDateIso adds exact days safely in UTC YYYY-MM-DD', () => {
  assert.equal(computeDueDateIso('2026-11-11', 14), '2026-11-25');
  assert.equal(computeDueDateIso('2026-11-11', 30), '2026-12-11');
  assert.equal(computeDueDateIso('2026-11-11', -5), '2026-11-11');
});

test('isStarterPlaceholderItem distinguishes default rows from customized items', () => {
  const defaultInvoiceRow: VoiceFormLineItem = {
    id: '1',
    description: 'Professional Consulting / Engineering Services',
    quantity: '10',
    unitPrice: '150',
    discountType: 'percentage',
    discountValue: '0',
    taxName: 'Tax',
    taxRate: '0',
    taxMethod: 'exclusive',
  };

  assert.equal(isStarterPlaceholderItem(defaultInvoiceRow, 'invoice'), true);
  assert.equal(
    isStarterPlaceholderItem({ ...defaultInvoiceRow, unitPrice: '200' }, 'invoice'),
    false
  );
  assert.equal(isStarterPlaceholderItem(defaultInvoiceRow, 'quote'), false);
});

test('buildLiveDraftSummary computes deterministic integer cents using calculator engine', () => {
  const draft: VoiceDocumentDraft = {
    documentType: 'quote',
    organizationId: 'org1',
    selectedClientId: 'c1',
    currency: 'USD',
    issueDate: '2026-11-11',
    dueOrValidDate: '2026-12-11',
    notes: 'Scope note',
    terms: 'Net 30',
    items: [
      {
        id: 'a',
        description: 'Cloud Sprint',
        quantity: '2',
        unitPrice: '2500',
        discountType: 'percentage',
        discountValue: '10',
        taxName: 'Tax',
        taxRate: '5',
        taxMethod: 'exclusive',
      },
    ],
  };

  // Gross = 500000 cents, 10% discount = 50000 cents, Net = 450000 cents, 5% tax = 22500 cents -> 472500 cents
  const summary = buildLiveDraftSummary(draft, 'Acme Global Corp.');
  assert.equal(summary.clientName, 'Acme Global Corp.');
  assert.equal(summary.subtotalCents, 500000);
  assert.equal(summary.totalDiscountCents, 50000);
  assert.equal(summary.totalTaxCents, 22500);
  assert.equal(summary.grandTotalCents, 472500);
  assert.equal(summary.formattedGrandTotal, '$4,725.00');
});

test('VOICE_DRAFT_FUNCTION_DECLARATIONS enforce NON_BLOCKING async behavior and locked context', () => {
  assert.ok(VOICE_DRAFT_FUNCTION_DECLARATIONS.length >= 6);
  for (const decl of VOICE_DRAFT_FUNCTION_DECLARATIONS) {
    assert.equal(
      decl.behavior,
      Behavior.NON_BLOCKING,
      `Tool ${decl.name} must declare NON_BLOCKING`
    );
  }

  const prompt = buildVoiceSystemInstruction({
    organizationName: 'Apex Digital',
    defaultCurrency: 'EUR',
    documentType: 'invoice',
    todayIso: '2026-11-11',
    sampleClients: [{ name: 'Acme Corp', email: 'ap@acme.com' }],
    sampleProducts: [{ name: 'Retainer', priceDisplay: '€2,000.00', taxRate: 20 }],
  });

  assert.match(prompt, /Apex Digital/);
  assert.match(prompt, /EUR/);
  assert.match(prompt, /2026-11-11/);
  assert.match(prompt, /get_draft_summary/);
  assert.match(prompt, /STRICT REFUSAL/i);
  assert.match(prompt, /end_voice_session/);
  assert.ok(VOICE_DRAFT_FUNCTION_DECLARATIONS.some((d) => d.name === 'end_voice_session'));
});

test('executeVoiceToolCall updates draft synchronously across multi-item batch calls', async () => {
  const starterItem: VoiceFormLineItem = {
    id: '1',
    description: 'Professional Consulting / Engineering Services',
    quantity: '10',
    unitPrice: '150',
    discountType: 'percentage',
    discountValue: '0',
    taxName: 'Tax',
    taxRate: '0',
    taxMethod: 'exclusive',
  };

  const draftRef: { current: VoiceDocumentDraft } = {
    current: {
      documentType: 'invoice',
      organizationId: 'org1',
      selectedClientId: 'c1',
      currency: 'USD',
      issueDate: '2026-11-11',
      dueOrValidDate: '2026-11-25',
      notes: '',
      terms: '',
      items: [starterItem],
    },
  };

  let stateItems: VoiceFormLineItem[] = [starterItem];
  const logs: string[] = [];

  const actions: VoiceDraftActions = {
    setClientById: (id) => {
      draftRef.current.selectedClientId = id;
    },
    setCurrency: (c) => {
      draftRef.current.currency = c;
    },
    setIssueDate: (d) => {
      draftRef.current.issueDate = d;
    },
    setDueOrValidDate: (d) => {
      draftRef.current.dueOrValidDate = d;
    },
    setNotes: (n) => {
      draftRef.current.notes = n;
    },
    setTerms: (t) => {
      draftRef.current.terms = t;
    },
    setItems: (updater) => {
      stateItems = typeof updater === 'function' ? updater(stateItems) : updater;
    },
  };

  const ctx = {
    draftRef,
    clientsDirectoryRef: { current: [{ _id: 'c1', name: 'Acme Global Corp.' }] },
    actions,
    onActionLog: (t: string) => logs.push(t),
  };

  // Batch call 1: adds Security Audit ($1,000 x 2) -> replaces untouched starter item cleanly
  const r1 = await executeVoiceToolCall(
    {
      id: 'call_1',
      name: 'add_or_update_line_item',
      args: { action: 'add', description: 'Security Audit', quantity: 2, unitPrice: 1000 },
    },
    ctx
  );
  assert.equal(r1.scheduling, FunctionResponseScheduling.SILENT);
  assert.equal(stateItems.length, 1);
  assert.equal(stateItems[0].description, 'Security Audit');

  // Batch call 2: appends Design Workshop ($500 x 1) -> keeps item 1 intact
  await executeVoiceToolCall(
    {
      id: 'call_2',
      name: 'add_or_update_line_item',
      args: { action: 'add', description: 'Design Workshop', quantity: 1, unitPrice: 500 },
    },
    ctx
  );
  assert.equal(stateItems.length, 2);

  // Batch call 3: updates due date to Net 30 and reads engine summary
  await executeVoiceToolCall(
    {
      id: 'call_3',
      name: 'set_document_details',
      args: { paymentTermsDays: 30, currency: 'EUR' },
    },
    ctx
  );
  assert.equal(draftRef.current.dueOrValidDate, '2026-12-11');
  assert.equal(draftRef.current.currency, 'EUR');

  const summaryResp = await executeVoiceToolCall(
    { id: 'call_4', name: 'get_draft_summary', args: {} },
    ctx
  );
  const summaryPayload = summaryResp.response as { summary: { grandTotalCents: number } };
  assert.equal(summaryPayload.summary.grandTotalCents, 250000); // $2,500.00 -> €2,500.00
  assert.equal(summaryResp.scheduling, FunctionResponseScheduling.WHEN_IDLE);
  assert.ok(logs.length >= 3);
});

test('executeVoiceToolCall create_client validates email and creates + assigns new client', async () => {
  const draftRef: { current: VoiceDocumentDraft } = {
    current: {
      documentType: 'quote',
      organizationId: 'org1',
      selectedClientId: 'old_c',
      currency: 'USD',
      issueDate: '2026-11-11',
      dueOrValidDate: '2026-12-11',
      notes: '',
      terms: '',
      items: [
        {
          id: 'item_1',
          description: 'System Architecture',
          quantity: '1',
          unitPrice: '37500',
          discountType: 'percentage',
          discountValue: '0',
          taxName: 'Tax',
          taxRate: '0',
          taxMethod: 'exclusive',
        },
      ],
    },
  };

  let createdCallbackClient: any = null;
  const clientsDirectoryRef = { current: [{ _id: 'old_c', name: 'Existing Client' }] };
  const actions: VoiceDraftActions = {
    setClientById: (id) => {
      draftRef.current.selectedClientId = id;
    },
    onClientCreated: (client) => {
      createdCallbackClient = client;
    },
    setCurrency: () => {},
    setIssueDate: () => {},
    setDueOrValidDate: () => {},
    setNotes: () => {},
    setTerms: () => {},
    setItems: () => {},
  };

  const ctx = {
    draftRef,
    clientsDirectoryRef,
    actions,
    onActionLog: () => {},
  };

  // Invalid email is rejected gracefully before touching API
  const badResp = await executeVoiceToolCall(
    {
      id: 'c_bad',
      name: 'create_client',
      args: { name: 'Tesla', email: 'not-an-email' },
    },
    ctx
  );
  assert.equal((badResp.response as any).created, false);
  assert.deepEqual((badResp.response as any).missingFields, ['email']);
  assert.equal(badResp.scheduling, FunctionResponseScheduling.WHEN_IDLE);

  // Valid creation resolves deduplication precheck then calls POST /api/clients
  const originalFetch = globalThis.fetch;
  try {
    let postedBody: any = null;
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const target = String(url);
      if (target === '/api/voice/resolve') {
        return new Response(JSON.stringify({ success: true, clients: [], products: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (target === '/api/clients' && init?.method === 'POST') {
        postedBody = JSON.parse(String(init.body));
        return new Response(
          JSON.stringify({
            success: true,
            client: {
              _id: 'client_tesla_1',
              name: 'Tesla Inc.',
              email: 'ap@tesla.com',
              currency: 'USD',
              paymentTermsDays: 14,
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Unexpected fetch URL: ${target}`);
    }) as typeof fetch;

    const okResp = await executeVoiceToolCall(
      {
        id: 'c_ok',
        name: 'create_client',
        args: {
          name: 'Tesla Inc.',
          email: 'AP@TESLA.COM',
          phone: '+1 512 555 0100',
          billingAddress: { city: 'Austin', state: 'TX', country: 'USA' },
        },
      },
      ctx
    );

    const payload = okResp.response as any;
    assert.equal(payload.created, true);
    assert.equal(payload.assigned, true);
    assert.equal(payload.client._id, 'client_tesla_1');
    assert.equal(postedBody.email, 'ap@tesla.com');
    assert.equal(postedBody.billingAddress.city, 'Austin');
    assert.equal(draftRef.current.selectedClientId, 'client_tesla_1');
    assert.equal(createdCallbackClient?._id, 'client_tesla_1');
    assert.equal(clientsDirectoryRef.current.length, 2);
    assert.equal(okResp.scheduling, FunctionResponseScheduling.WHEN_IDLE);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('computeVoiceDockGeometry adapts panel width and preserves workspace space per viewport', () => {
  // Mobile overlay: never pushes layout offset
  const mobile = computeVoiceDockGeometry(375, 'compact');
  assert.equal(mobile.isDesktopSplit, false);
  assert.equal(mobile.pushOffsetPx, 0);

  // Collapsed desktop: zero push offset
  const collapsedDesktop = computeVoiceDockGeometry(1440, 'collapsed');
  assert.equal(collapsedDesktop.isDesktopSplit, true);
  assert.equal(collapsedDesktop.pushOffsetPx, 0);

  // Small laptop (1024px): clamps maximized width so >= 440px remains for document & receipts
  const smallMax = computeVoiceDockGeometry(1024, 'maximized');
  assert.equal(smallMax.isDesktopSplit, true);
  assert.equal(smallMax.panelWidthPx, 328);
  assert.equal(smallMax.pushOffsetPx, 328);
  assert.ok(1024 - 256 - smallMax.pushOffsetPx >= 440);

  // Standard MacBook (1440px): distinct compact vs maximized widths
  const laptopCompact = computeVoiceDockGeometry(1440, 'compact');
  const laptopMax = computeVoiceDockGeometry(1440, 'maximized');
  assert.equal(laptopCompact.panelWidthPx, 340);
  assert.equal(laptopMax.panelWidthPx, 460);
  assert.ok(laptopMax.panelWidthPx > laptopCompact.panelWidthPx);

  // Large desktop (1920px): expands cleanly up to 520px while preserving ample workspace
  const desktopMax = computeVoiceDockGeometry(1920, 'maximized');
  assert.equal(desktopMax.panelWidthPx, 520);
});

test('executeVoiceToolCall end_voice_session schedules session end and inactivity timeout is 2 minutes', async () => {
  assert.equal(INACTIVITY_AUTO_END_MS, 2 * 60 * 1000);

  let requestedReason: string | null = null;
  const logs: string[] = [];
  const draftRef: { current: VoiceDocumentDraft } = {
    current: {
      documentType: 'quote',
      organizationId: 'org1',
      selectedClientId: '',
      currency: 'USD',
      issueDate: '2026-11-11',
      dueOrValidDate: '2026-12-11',
      notes: '',
      terms: '',
      items: [],
    },
  };

  const resp = await executeVoiceToolCall(
    {
      id: 'call_end_1',
      name: 'end_voice_session',
      args: { reason: 'user_requested_exit' },
    },
    {
      draftRef,
      clientsDirectoryRef: { current: [] },
      actions: {
        setClientById: () => {},
        setCurrency: () => {},
        setIssueDate: () => {},
        setDueOrValidDate: () => {},
        setNotes: () => {},
        setTerms: () => {},
        setItems: () => {},
      },
      onActionLog: (msg) => logs.push(msg),
      onRequestEndSession: (reason) => {
        requestedReason = reason;
      },
    }
  );

  assert.equal(requestedReason, 'user_requested_exit');
  assert.equal((resp.response as any).ending, true);
  assert.equal(resp.scheduling, FunctionResponseScheduling.WHEN_IDLE);
  assert.ok(logs.includes('Ending voice session'));
});

test('executeVoiceToolCall supports switching currency per draft to global currencies like NGN', async () => {
  let activeCurrency = 'USD';
  const draftRef: { current: VoiceDocumentDraft } = {
    current: {
      documentType: 'invoice',
      organizationId: 'org1',
      selectedClientId: '',
      currency: 'USD',
      issueDate: '2026-11-11',
      dueOrValidDate: '2026-11-25',
      notes: '',
      terms: '',
      items: [
        {
          id: '1',
          description: 'Branding Sprint',
          quantity: '1',
          unitPrice: '500000',
          discountType: 'percentage',
          discountValue: '0',
          taxName: 'VAT',
          taxRate: '7.5',
          taxMethod: 'exclusive',
        },
      ],
    },
  };

  const resp = await executeVoiceToolCall(
    {
      id: 'call_currency_1',
      name: 'set_document_details',
      args: { currency: 'ngn' },
    },
    {
      draftRef,
      clientsDirectoryRef: { current: [] },
      actions: {
        setClientById: () => {},
        setCurrency: (c) => {
          activeCurrency = c;
        },
        setIssueDate: () => {},
        setDueOrValidDate: () => {},
        setNotes: () => {},
        setTerms: () => {},
        setItems: () => {},
      },
      onActionLog: () => {},
    }
  );

  assert.equal(activeCurrency, 'NGN');
  assert.equal(draftRef.current.currency, 'NGN');
  assert.equal((resp.response as any).summary.currency, 'NGN');
  assert.equal((resp.response as any).summary.formattedGrandTotal, '₦537,500.00');
});

