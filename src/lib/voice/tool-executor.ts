import { FunctionCall, FunctionResponse, FunctionResponseScheduling } from '@google/genai';
import { formatCurrency } from '@/engine/calculator';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';
import { normalizeCurrencyCode } from '@/lib/currencies';
import {
  buildLiveDraftSummary,
  computeDueDateIso,
  isStarterPlaceholderItem,
  scoreTextMatch,
} from './catalog-matcher';
import {
  ResolvedClientCandidate,
  ResolvedProductCandidate,
  VoiceDocumentDraft,
  VoiceDraftActions,
  VoiceFormLineItem,
  VoiceResolveResponse,
} from './types';

export interface ToolExecutionContext {
  draftRef: { current: VoiceDocumentDraft };
  clientsDirectoryRef: { current: Array<{ _id: string; name: string; email?: string }> };
  actions: VoiceDraftActions;
  onActionLog: (text: string) => void;
  onRequestEndSession?: (reason: string) => void;
}

async function resolveFromWorkspace(
  organizationId: string,
  params: { clientQuery?: string; productQuery?: string }
): Promise<VoiceResolveResponse> {
  return fetchJsonWithBuffer<VoiceResolveResponse>('/api/voice/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizationId,
      ...params,
    }),
    timeoutMs: 12000,
    retry: true,
  });
}

function getSelectedClientName(ctx: ToolExecutionContext): string | null {
  const selected = ctx.clientsDirectoryRef.current.find(
    (c) => c._id === ctx.draftRef.current.selectedClientId
  );
  return selected?.name || null;
}

function createLineItemId(): string {
  return `voice_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

async function handleLookupCatalog(
  args: Record<string, any>,
  ctx: ToolExecutionContext
): Promise<{ output: Record<string, unknown>; scheduling: FunctionResponseScheduling }> {
  const data = await resolveFromWorkspace(ctx.draftRef.current.organizationId, {
    clientQuery: typeof args.clientQuery === 'string' ? args.clientQuery : '',
    productQuery: typeof args.productQuery === 'string' ? args.productQuery : '',
  });

  if (!data.success) {
    return {
      output: { error: data.error || 'Failed to query workspace catalog' },
      scheduling: FunctionResponseScheduling.WHEN_IDLE,
    };
  }

  return {
    output: {
      clients: data.clients,
      products: data.products.map((p) => ({
        ...p,
        unitPriceMajor: p.unitPriceCents / 100,
      })),
    },
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
  };
}

async function handleSetClient(
  args: Record<string, any>,
  ctx: ToolExecutionContext
): Promise<{ output: Record<string, unknown>; scheduling: FunctionResponseScheduling }> {
  const clientId = typeof args.clientId === 'string' ? args.clientId.trim() : '';
  const clientQuery = typeof args.clientQuery === 'string' ? args.clientQuery.trim() : '';

  if (clientId) {
    const exact = ctx.clientsDirectoryRef.current.find((c) => c._id === clientId);
    if (exact) {
      ctx.draftRef.current.selectedClientId = exact._id;
      ctx.actions.setClientById(exact._id);
      ctx.actions.onFieldFlash?.('client');
      ctx.onActionLog(`Client set to ${exact.name}`);
      return {
        output: {
          resolved: true,
          client: exact,
          summary: buildLiveDraftSummary(ctx.draftRef.current, exact.name),
        },
        scheduling: FunctionResponseScheduling.SILENT,
      };
    }
  }

  const data = await resolveFromWorkspace(ctx.draftRef.current.organizationId, { clientQuery });
  const candidates: ResolvedClientCandidate[] = data.clients || [];

  if (candidates.length === 0) {
    return {
      output: {
        resolved: false,
        notFound: true,
        requestedName: clientQuery,
        canCreate: true,
        missingRequiredFields: ['email'],
        optionalFields: ['phone', 'billingAddress', 'taxId', 'paymentTermsDays'],
        message: `No registered client matched "${clientQuery}". Offer to create "${clientQuery}" right now: ask the user for their required billing email address (and any optional phone, address, or payment terms), then call create_client once they reply.`,
      },
      scheduling: FunctionResponseScheduling.WHEN_IDLE,
    };
  }

  const top = candidates[0];
  const second = candidates[1];
  const isClearWinner =
    candidates.length === 1 ||
    (top.score ?? 0) >= 0.85 ||
    (top.score ?? 0) - (second?.score ?? 0) >= 0.15;

  if (!isClearWinner) {
    return {
      output: {
        resolved: false,
        ambiguous: true,
        candidates: candidates.slice(0, 4),
        message: 'Multiple clients matched. Ask the user which one they prefer.',
      },
      scheduling: FunctionResponseScheduling.WHEN_IDLE,
    };
  }

  ctx.draftRef.current.selectedClientId = top._id;
  ctx.actions.setClientById(top._id);
  ctx.actions.onFieldFlash?.('client');
  ctx.onActionLog(`Client set to ${top.name}`);

  return {
    output: {
      resolved: true,
      client: top,
      summary: buildLiveDraftSummary(ctx.draftRef.current, top.name),
    },
    scheduling: FunctionResponseScheduling.SILENT,
  };
}

async function resolveCatalogProduct(
  args: Record<string, any>,
  organizationId: string
): Promise<ResolvedProductCandidate | null> {
  const query =
    typeof args.catalogQuery === 'string' && args.catalogQuery.trim()
      ? args.catalogQuery.trim()
      : typeof args.productId === 'string' && args.productId.trim()
        ? ''
        : null;

  if (query === null && !args.productId) return null;

  const data = await resolveFromWorkspace(organizationId, {
    productQuery: query ?? '',
  });
  const products = data.products || [];

  if (typeof args.productId === 'string' && args.productId) {
    const exact = products.find((p) => p._id === args.productId);
    if (exact) return exact;
  }

  if (products.length > 0 && (products[0].score ?? 0) >= 0.45) {
    return products[0];
  }

  return null;
}

async function handleAddOrUpdateLineItem(
  args: Record<string, any>,
  ctx: ToolExecutionContext
): Promise<{ output: Record<string, unknown>; scheduling: FunctionResponseScheduling }> {
  const action: 'add' | 'update' = args.action === 'update' ? 'update' : 'add';
  const matchedProduct = await resolveCatalogProduct(args, ctx.draftRef.current.organizationId);
  const currentItems = [...ctx.draftRef.current.items];

  if (action === 'update') {
    let targetIdx = -1;
    if (typeof args.itemId === 'string' && args.itemId) {
      targetIdx = currentItems.findIndex((it) => it.id === args.itemId);
    }
    if (targetIdx === -1 && typeof args.matchDescription === 'string' && args.matchDescription.trim()) {
      let bestScore = 0;
      currentItems.forEach((it, idx) => {
        const score = scoreTextMatch(args.matchDescription, [it.description]);
        if (score > bestScore) {
          bestScore = score;
          targetIdx = idx;
        }
      });
      if (bestScore < 0.25) targetIdx = -1;
    }
    if (targetIdx === -1 && currentItems.length === 1) {
      targetIdx = 0;
    }

    if (targetIdx === -1) {
      return {
        output: {
          updated: false,
          message: 'Could not identify which existing line item to update.',
        },
        scheduling: FunctionResponseScheduling.WHEN_IDLE,
      };
    }

    const existing = currentItems[targetIdx];
    const updatedItem: VoiceFormLineItem = {
      ...existing,
      description:
        typeof args.description === 'string' && args.description.trim()
          ? args.description.trim()
          : matchedProduct
            ? `${matchedProduct.name}${matchedProduct.description ? ` - ${matchedProduct.description}` : ''}`
            : existing.description,
      quantity:
        typeof args.quantity === 'number' && !Number.isNaN(args.quantity)
          ? String(Math.max(0, args.quantity))
          : existing.quantity,
      unitPrice:
        typeof args.unitPrice === 'number' && !Number.isNaN(args.unitPrice)
          ? String(Math.max(0, args.unitPrice))
          : matchedProduct
            ? (matchedProduct.unitPriceCents / 100).toString()
            : existing.unitPrice,
      discountType:
        args.discountType === 'fixed' || args.discountType === 'percentage'
          ? args.discountType
          : existing.discountType,
      discountValue:
        typeof args.discountValue === 'number' && !Number.isNaN(args.discountValue)
          ? String(Math.max(0, args.discountValue))
          : existing.discountValue,
      taxName: typeof args.taxName === 'string' && args.taxName ? args.taxName : existing.taxName,
      taxRate:
        typeof args.taxRate === 'number' && !Number.isNaN(args.taxRate)
          ? String(Math.max(0, args.taxRate))
          : matchedProduct
            ? String(matchedProduct.taxRate ?? existing.taxRate)
            : existing.taxRate,
      taxMethod:
        args.taxMethod === 'inclusive' || args.taxMethod === 'exclusive'
          ? args.taxMethod
          : matchedProduct?.taxMethod || existing.taxMethod,
    };

    currentItems[targetIdx] = updatedItem;
    ctx.draftRef.current.items = currentItems;
    ctx.actions.setItems(currentItems);
    ctx.actions.onFieldFlash?.('items');

    const summary = buildLiveDraftSummary(ctx.draftRef.current, getSelectedClientName(ctx));
    ctx.onActionLog(`Updated "${updatedItem.description}" → Total ${summary.formattedGrandTotal}`);

    return {
      output: { updated: true, item: updatedItem, summary },
      scheduling: FunctionResponseScheduling.SILENT,
    };
  }

  // Action: 'add'
  const description =
    typeof args.description === 'string' && args.description.trim()
      ? args.description.trim()
      : matchedProduct
        ? `${matchedProduct.name}${matchedProduct.description ? ` - ${matchedProduct.description}` : ''}`
        : 'Professional Services';

  const unitPriceMajor =
    typeof args.unitPrice === 'number' && !Number.isNaN(args.unitPrice)
      ? Math.max(0, args.unitPrice)
      : matchedProduct
        ? matchedProduct.unitPriceCents / 100
        : 0;

  const quantity =
    typeof args.quantity === 'number' && !Number.isNaN(args.quantity)
      ? Math.max(0, args.quantity)
      : 1;

  const taxRate =
    typeof args.taxRate === 'number' && !Number.isNaN(args.taxRate)
      ? Math.max(0, args.taxRate)
      : matchedProduct
        ? matchedProduct.taxRate ?? 0
        : 0;

  const newItem: VoiceFormLineItem = {
    id: createLineItemId(),
    description,
    quantity: String(quantity),
    unitPrice: String(unitPriceMajor),
    discountType: args.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValue:
      typeof args.discountValue === 'number' && !Number.isNaN(args.discountValue)
        ? String(Math.max(0, args.discountValue))
        : '0',
    taxName: typeof args.taxName === 'string' && args.taxName.trim() ? args.taxName.trim() : 'Tax',
    taxRate: String(taxRate),
    taxMethod:
      args.taxMethod === 'inclusive' || args.taxMethod === 'exclusive'
        ? args.taxMethod
        : matchedProduct?.taxMethod || 'exclusive',
  };

  const shouldReplaceStarter =
    currentItems.length === 1 &&
    isStarterPlaceholderItem(currentItems[0], ctx.draftRef.current.documentType);

  const nextItems = shouldReplaceStarter ? [newItem] : [...currentItems, newItem];
  ctx.draftRef.current.items = nextItems;
  ctx.actions.setItems(nextItems);
  ctx.actions.onFieldFlash?.('items');

  const summary = buildLiveDraftSummary(ctx.draftRef.current, getSelectedClientName(ctx));
  const unitPriceFormatted = formatCurrency(Math.round(unitPriceMajor * 100), ctx.draftRef.current.currency);
  ctx.onActionLog(`Added ${quantity}× ${description} (${unitPriceFormatted})`);

  return {
    output: { added: true, catalogMatched: Boolean(matchedProduct), item: newItem, summary },
    scheduling: FunctionResponseScheduling.SILENT,
  };
}

function handleRemoveLineItem(
  args: Record<string, any>,
  ctx: ToolExecutionContext
): { output: Record<string, unknown>; scheduling: FunctionResponseScheduling } {
  const currentItems = [...ctx.draftRef.current.items];
  let removeIdx = -1;

  if (typeof args.itemId === 'string' && args.itemId) {
    removeIdx = currentItems.findIndex((it) => it.id === args.itemId);
  }
  if (removeIdx === -1 && typeof args.index === 'number' && args.index >= 1) {
    const candidateIdx = Math.round(args.index) - 1;
    if (candidateIdx >= 0 && candidateIdx < currentItems.length) {
      removeIdx = candidateIdx;
    }
  }
  if (removeIdx === -1 && typeof args.matchDescription === 'string' && args.matchDescription.trim()) {
    let bestScore = 0;
    currentItems.forEach((it, idx) => {
      const score = scoreTextMatch(args.matchDescription, [it.description]);
      if (score > bestScore) {
        bestScore = score;
        removeIdx = idx;
      }
    });
    if (bestScore < 0.25) removeIdx = -1;
  }

  if (removeIdx === -1) {
    return {
      output: { removed: false, message: 'No matching line item found to remove.' },
      scheduling: FunctionResponseScheduling.WHEN_IDLE,
    };
  }

  const [removed] = currentItems.splice(removeIdx, 1);
  const nextItems: VoiceFormLineItem[] =
    currentItems.length > 0
      ? currentItems
      : [
          {
            id: createLineItemId(),
            description: '',
            quantity: '1',
            unitPrice: '0',
            discountType: 'percentage',
            discountValue: '0',
            taxName: 'Tax',
            taxRate: '0',
            taxMethod: 'exclusive',
          },
        ];

  ctx.draftRef.current.items = nextItems;
  ctx.actions.setItems(nextItems);
  ctx.actions.onFieldFlash?.('items');

  const summary = buildLiveDraftSummary(ctx.draftRef.current, getSelectedClientName(ctx));
  ctx.onActionLog(`Removed "${removed.description || 'item'}"`);

  return {
    output: { removed: true, removedDescription: removed.description, summary },
    scheduling: FunctionResponseScheduling.SILENT,
  };
}

function handleSetDocumentDetails(
  args: Record<string, any>,
  ctx: ToolExecutionContext
): { output: Record<string, unknown>; scheduling: FunctionResponseScheduling } {
  const changes: string[] = [];

  if (typeof args.currency === 'string' && args.currency.trim()) {
    const normalizedCurrency = normalizeCurrencyCode(args.currency, ctx.draftRef.current.currency);
    if (normalizedCurrency !== ctx.draftRef.current.currency || args.currency.trim().toUpperCase() === normalizedCurrency) {
      ctx.draftRef.current.currency = normalizedCurrency;
      ctx.actions.setCurrency(normalizedCurrency);
      ctx.actions.onFieldFlash?.('currency');
      changes.push(`Currency: ${normalizedCurrency}`);
    }
  }

  if (typeof args.issueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(args.issueDate)) {
    ctx.draftRef.current.issueDate = args.issueDate;
    ctx.actions.setIssueDate(args.issueDate);
    ctx.actions.onFieldFlash?.('dates');
    changes.push(`Issue date: ${args.issueDate}`);
  }

  if (
    typeof args.dueDateOrValidUntil === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(args.dueDateOrValidUntil)
  ) {
    ctx.draftRef.current.dueOrValidDate = args.dueDateOrValidUntil;
    ctx.actions.setDueOrValidDate(args.dueDateOrValidUntil);
    ctx.actions.onFieldFlash?.('dates');
    changes.push(`Target date: ${args.dueDateOrValidUntil}`);
  } else if (typeof args.paymentTermsDays === 'number' && !Number.isNaN(args.paymentTermsDays)) {
    const computedDate = computeDueDateIso(ctx.draftRef.current.issueDate, args.paymentTermsDays);
    ctx.draftRef.current.dueOrValidDate = computedDate;
    ctx.actions.setDueOrValidDate(computedDate);
    ctx.actions.onFieldFlash?.('dates');
    changes.push(`Net ${Math.round(args.paymentTermsDays)} days (${computedDate})`);
  }

  if (typeof args.notes === 'string') {
    ctx.draftRef.current.notes = args.notes;
    ctx.actions.setNotes(args.notes);
    ctx.actions.onFieldFlash?.('notes');
    changes.push('Updated notes');
  }

  if (typeof args.terms === 'string') {
    ctx.draftRef.current.terms = args.terms;
    ctx.actions.setTerms(args.terms);
    ctx.actions.onFieldFlash?.('terms');
    changes.push('Updated terms');
  }

  if (changes.length > 0) {
    ctx.onActionLog(changes.join(' · '));
  }

  const summary = buildLiveDraftSummary(ctx.draftRef.current, getSelectedClientName(ctx));
  return {
    output: { updated: true, changes, summary },
    scheduling: FunctionResponseScheduling.SILENT,
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function handleCreateClient(
  args: Record<string, any>,
  ctx: ToolExecutionContext
): Promise<{ output: Record<string, unknown>; scheduling: FunctionResponseScheduling }> {
  const name = typeof args.name === 'string' ? args.name.trim() : '';
  const email = typeof args.email === 'string' ? args.email.trim().toLowerCase() : '';

  if (!name) {
    return {
      output: {
        created: false,
        missingFields: ['name'],
        message: 'Client name is required. Ask the user for the full client or company name.',
      },
      scheduling: FunctionResponseScheduling.WHEN_IDLE,
    };
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return {
      output: {
        created: false,
        missingFields: ['email'],
        message: `A valid billing email address is required to register "${name}". Ask the user to provide or spell out the billing email.`,
      },
      scheduling: FunctionResponseScheduling.WHEN_IDLE,
    };
  }

  // Prevent duplicate records in the same workspace if that email already exists
  try {
    const existingLookup = await resolveFromWorkspace(ctx.draftRef.current.organizationId, {
      clientQuery: email,
    });
    const duplicate = (existingLookup.clients || []).find(
      (c) => c.email.toLowerCase() === email
    );
    if (duplicate) {
      ctx.draftRef.current.selectedClientId = duplicate._id;
      ctx.actions.onClientCreated?.(duplicate);
      ctx.actions.setClientById(duplicate._id);
      ctx.actions.onFieldFlash?.('client');
      ctx.onActionLog(`Assigned existing client ${duplicate.name} (${duplicate.email})`);
      return {
        output: {
          created: false,
          assignedExisting: true,
          client: duplicate,
          summary: buildLiveDraftSummary(ctx.draftRef.current, duplicate.name),
        },
        scheduling: FunctionResponseScheduling.WHEN_IDLE,
      };
    }
  } catch {
    // proceed to server creation endpoint if pre-check fails transiently
  }

  const rawAddress =
    args.billingAddress && typeof args.billingAddress === 'object' ? args.billingAddress : null;
  const billingAddress = rawAddress
    ? {
        street: typeof rawAddress.street === 'string' ? rawAddress.street.trim() : undefined,
        city: typeof rawAddress.city === 'string' ? rawAddress.city.trim() : undefined,
        state: typeof rawAddress.state === 'string' ? rawAddress.state.trim() : undefined,
        postalCode:
          typeof rawAddress.postalCode === 'string' ? rawAddress.postalCode.trim() : undefined,
        country: typeof rawAddress.country === 'string' ? rawAddress.country.trim() : undefined,
      }
    : undefined;

  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizationId: ctx.draftRef.current.organizationId,
      name,
      email,
      phone: typeof args.phone === 'string' && args.phone.trim() ? args.phone.trim() : undefined,
      currency:
        typeof args.currency === 'string' && args.currency.trim()
          ? normalizeCurrencyCode(args.currency, ctx.draftRef.current.currency || 'USD')
          : ctx.draftRef.current.currency || 'USD',
      taxId: typeof args.taxId === 'string' && args.taxId.trim() ? args.taxId.trim() : undefined,
      paymentTermsDays:
        typeof args.paymentTermsDays === 'number' && !Number.isNaN(args.paymentTermsDays)
          ? Math.max(0, Math.min(365, Math.round(args.paymentTermsDays)))
          : 14,
      billingAddress,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.client) {
    return {
      output: {
        created: false,
        error: data.error || 'Failed to create client record',
      },
      scheduling: FunctionResponseScheduling.WHEN_IDLE,
    };
  }

  const createdClient: ResolvedClientCandidate = {
    _id: data.client._id,
    name: data.client.name,
    email: data.client.email,
    currency: data.client.currency,
    paymentTermsDays: data.client.paymentTermsDays,
  };

  if (!ctx.clientsDirectoryRef.current.some((c) => c._id === createdClient._id)) {
    ctx.clientsDirectoryRef.current = [...ctx.clientsDirectoryRef.current, createdClient];
  }

  ctx.draftRef.current.selectedClientId = createdClient._id;
  ctx.actions.onClientCreated?.(createdClient);
  ctx.actions.setClientById(createdClient._id);
  ctx.actions.onFieldFlash?.('client');
  ctx.onActionLog(`Created & assigned client ${createdClient.name} (${createdClient.email})`);

  return {
    output: {
      created: true,
      assigned: true,
      client: createdClient,
      summary: buildLiveDraftSummary(ctx.draftRef.current, createdClient.name),
    },
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
  };
}

/**
 * Dispatches one incoming Gemini Live tool call cleanly and returns a formatted FunctionResponse.
 */
export async function executeVoiceToolCall(
  fc: FunctionCall,
  ctx: ToolExecutionContext
): Promise<FunctionResponse> {
  const args = (fc.args || {}) as Record<string, any>;
  let result: { output: Record<string, unknown>; scheduling: FunctionResponseScheduling };

  try {
    switch (fc.name) {
      case 'lookup_workspace_catalog':
        result = await handleLookupCatalog(args, ctx);
        break;
      case 'set_client':
        result = await handleSetClient(args, ctx);
        break;
      case 'create_client':
        result = await handleCreateClient(args, ctx);
        break;
      case 'add_or_update_line_item':
        result = await handleAddOrUpdateLineItem(args, ctx);
        break;
      case 'remove_line_item':
        result = handleRemoveLineItem(args, ctx);
        break;
      case 'set_document_details':
        result = handleSetDocumentDetails(args, ctx);
        break;
      case 'get_draft_summary':
        result = {
          output: {
            summary: buildLiveDraftSummary(ctx.draftRef.current, getSelectedClientName(ctx)),
          },
          scheduling: FunctionResponseScheduling.WHEN_IDLE,
        };
        break;
      case 'end_voice_session': {
        const reason =
          typeof args.reason === 'string' && args.reason.trim()
            ? args.reason.trim()
            : 'user_requested_exit';
        ctx.onActionLog('Ending voice session');
        ctx.onRequestEndSession?.(reason);
        result = {
          output: {
            ending: true,
            reason,
            message:
              'Voice session is closing immediately after your final remark. Say one short goodbye sentence without asking any follow-up questions.',
          },
          scheduling: FunctionResponseScheduling.WHEN_IDLE,
        };
        break;
      }
      default:
        result = {
          output: { error: `Unknown function "${fc.name}"` },
          scheduling: FunctionResponseScheduling.WHEN_IDLE,
        };
    }
  } catch (err: any) {
    result = {
      output: { error: err?.message || 'Tool execution failed' },
      scheduling: FunctionResponseScheduling.WHEN_IDLE,
    };
  }

  return {
    id: fc.id,
    name: fc.name,
    response: result.output,
    scheduling: result.scheduling,
  };
}

