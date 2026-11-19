import { Behavior, FunctionDeclaration, Tool, Type } from '@google/genai';
import { SUPPORTED_CURRENCY_CODES } from '../currencies';
import { VoiceDocumentType } from './types';

export const GEMINI_LIVE_MODEL = 'gemini-3.8-live';

/**
 * Tool declarations for live non-blocking voice drafting of invoices and quotes.
 * Locked server-side inside ephemeral token `liveConnectConstraints` so clients
 * cannot tamper with tool definitions.
 */
export const VOICE_DRAFT_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'lookup_workspace_catalog',
    behavior: Behavior.NON_BLOCKING,
    description:
      'Searches the active business workspace clients and reusable products/services catalog by keyword. Use before answering questions about available clients/products or to disambiguate names.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientQuery: {
          type: Type.STRING,
          description: 'Optional client company or contact name to search for.',
        },
        productQuery: {
          type: Type.STRING,
          description: 'Optional product or service name/keyword to search in the catalog.',
        },
      },
    },
  },
  {
    name: 'set_client',
    behavior: Behavior.NON_BLOCKING,
    description:
      'Assigns the billing/proposal client on the active draft by resolving against existing clients in the workspace.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientId: {
          type: Type.STRING,
          description: 'Exact client _id if already known from a prior lookup.',
        },
        clientQuery: {
          type: Type.STRING,
          description: 'Client company name or email mentioned by the user.',
        },
      },
      required: ['clientQuery'],
    },
  },
  {
    name: 'create_client',
    behavior: Behavior.NON_BLOCKING,
    description:
      'Creates a new client record in the workspace and immediately assigns them to the active draft. Invoke ONLY after confirming the client name and a real billing email address provided by the user (never invent or guess an email).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: 'Full company or client name (required).',
        },
        email: {
          type: Type.STRING,
          description: 'Client billing email address explicitly stated by the user (required).',
        },
        phone: {
          type: Type.STRING,
          description: 'Optional phone number.',
        },
        currency: {
          type: Type.STRING,
          enum: SUPPORTED_CURRENCY_CODES,
          description: 'Preferred ISO 4217 billing currency code (e.g. NGN, USD, EUR, GBP).',
        },
        taxId: {
          type: Type.STRING,
          description: 'Optional Tax ID, VAT number, or EIN.',
        },
        paymentTermsDays: {
          type: Type.INTEGER,
          description: 'Default payment terms in days (e.g., 14 or 30).',
        },
        billingAddress: {
          type: Type.OBJECT,
          description: 'Optional billing address.',
          properties: {
            street: { type: Type.STRING },
            city: { type: Type.STRING },
            state: { type: Type.STRING },
            postalCode: { type: Type.STRING },
            country: { type: Type.STRING },
          },
        },
      },
      required: ['name', 'email'],
    },
  },
  {
    name: 'add_or_update_line_item',
    behavior: Behavior.NON_BLOCKING,
    description:
      'Adds a new line item or updates an existing line item on the active invoice or quote draft. Can auto-fill pricing and tax from the workspace catalog via catalogQuery or productId.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ['add', 'update'],
          description: 'Whether to add a new line item or update an existing one.',
        },
        itemId: {
          type: Type.STRING,
          description: 'Existing line item ID when updating a specific row.',
        },
        matchDescription: {
          type: Type.STRING,
          description:
            'Keyword matching the existing line item description when updating by spoken reference (e.g. "audit", "design").',
        },
        productId: {
          type: Type.STRING,
          description: 'Exact workspace catalog product _id if known.',
        },
        catalogQuery: {
          type: Type.STRING,
          description:
            'Catalog service/product phrase to match (auto-fills unitPrice and taxRate unless user explicitly stated a custom price/tax).',
        },
        description: {
          type: Type.STRING,
          description: 'Clear line item description for the document.',
        },
        quantity: {
          type: Type.NUMBER,
          description: 'Numeric quantity (hours, units, sprints, seats). Defaults to 1 for new items.',
        },
        unitPrice: {
          type: Type.NUMBER,
          description:
            'Unit price in major currency units of the document currency (e.g., 2500 means 2,500.00 in the active currency). Omit if using catalog default price.',
        },
        discountType: {
          type: Type.STRING,
          enum: ['percentage', 'fixed'],
          description: 'Discount calculation mode. Defaults to percentage.',
        },
        discountValue: {
          type: Type.NUMBER,
          description: 'Discount percentage (0-100) or fixed major currency amount.',
        },
        taxRate: {
          type: Type.NUMBER,
          description: 'Tax rate percentage (e.g., 5 for 5%, 20 for 20% VAT).',
        },
        taxName: {
          type: Type.STRING,
          description: 'Label for the tax (e.g., Tax, VAT, GST).',
        },
        taxMethod: {
          type: Type.STRING,
          enum: ['exclusive', 'inclusive'],
          description: 'Whether tax is added on top (exclusive) or included in unitPrice (inclusive).',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'remove_line_item',
    behavior: Behavior.NON_BLOCKING,
    description:
      'Removes a line item from the draft when the user cancels or deletes a spoke deliverable.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemId: {
          type: Type.STRING,
          description: 'Exact line item ID to remove.',
        },
        matchDescription: {
          type: Type.STRING,
          description: 'Keyword matching the line item description to remove.',
        },
        index: {
          type: Type.INTEGER,
          description: '1-based item index if the user says "remove the second item".',
        },
      },
    },
  },
  {
    name: 'set_document_details',
    behavior: Behavior.NON_BLOCKING,
    description:
      'Updates document metadata such as currency, issue date, due/expiration date, payment terms days (e.g. Net 14, valid for 30 days), client notes, or terms.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        currency: {
          type: Type.STRING,
          enum: SUPPORTED_CURRENCY_CODES,
          description: 'ISO 4217 currency code for this specific quote/invoice (e.g. NGN, USD, EUR, GBP).',
        },
        issueDate: {
          type: Type.STRING,
          description: 'Issue date in YYYY-MM-DD format.',
        },
        dueDateOrValidUntil: {
          type: Type.STRING,
          description: 'Explicit due date (invoice) or validUntil date (quote) in YYYY-MM-DD format.',
        },
        paymentTermsDays: {
          type: Type.INTEGER,
          description: 'Number of days from issueDate (e.g. 14 for Net 14, 30 for Net 30 or valid 30 days).',
        },
        notes: {
          type: Type.STRING,
          description: 'Scope notes or client message.',
        },
        terms: {
          type: Type.STRING,
          description: 'Payment or acceptance terms.',
        },
      },
    },
  },
  {
    name: 'navigate_to_page',
    behavior: Behavior.NON_BLOCKING,
    description:
      'Navigates the user to a section in SwiftCent. Allowed destinations: "dashboard", "reports", "invoices", "new_invoice", "quotes", "new_quote", "clients", "products", "settings", "business". Invoke when the user asks to see, open, or go to any section (e.g. "let\'s see the reporting", "open proposals", "show me invoices", "new invoice", "track payments").',
    parameters: {
      type: Type.OBJECT,
      properties: {
        destination: {
          type: Type.STRING,
          enum: [
            'dashboard',
            'reports',
            'invoices',
            'new_invoice',
            'quotes',
            'new_quote',
            'clients',
            'products',
            'settings',
            'business',
          ],
          description: 'The destination section to navigate to.',
        },
        reason: {
          type: Type.STRING,
          description: 'Short natural acknowledgement, e.g. "Navigating to business reports".',
        },
      },
      required: ['destination'],
    },
  },
  {
    name: 'get_business_overview',
    behavior: Behavior.NON_BLOCKING,
    description:
      'Retrieves the latest financial snapshot, cash flow, outstanding receivables, overdue accounts, and recent invoices/quotes. Use when the user asks about revenue, cash flow, overdue accounts, or business health.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_draft_summary',
    behavior: Behavior.NON_BLOCKING,
    description:
      'Retrieves the current draft client, line items, and exact engine-calculated totals (subtotal, discounts, taxes, grand total). Always invoke this before reciting prices or totals to the user.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'end_voice_session',
    behavior: Behavior.NON_BLOCKING,
    description:
      'Ends and disconnects the live voice session immediately after saying a brief goodbye. Call whenever the user says they are finished or want to stop (e.g. "let\'s end the chat", "that will be all", "we\'re done", "stop listening", "bye"), or after repeated off-topic abuse.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: {
          type: Type.STRING,
          description:
            'Short snake_case reason (e.g. "user_requested_exit", "user_completed_draft", "off_topic_refusal").',
        },
      },
    },
  },
];

export const VOICE_DRAFT_TOOLS: Tool[] = [
  {
    functionDeclarations: VOICE_DRAFT_FUNCTION_DECLARATIONS,
  },
];

export interface SystemInstructionContext {
  organizationName: string;
  defaultCurrency: string;
  documentType?: VoiceDocumentType;
  userName?: string;
  todayIso: string;
  sampleClients: Array<{ name: string; email: string }>;
  sampleProducts: Array<{ name: string; priceDisplay: string; taxRate: number }>;
  overview?: {
    totalInvoiced: string;
    totalCollected: string;
    outstandingReceivables: string;
    overdueCount: number;
    overdueAmount: string;
    activeQuotesCount: number;
    activeQuotesTotal: string;
    recentInvoicesSummary?: string;
    recentQuotesSummary?: string;
  };
}

/**
 * Generates concise, high-precision system instructions locked inside the server ephemeral token.
 */
export function buildVoiceSystemInstruction(ctx: SystemInstructionContext): string {
  const docLabel = ctx.documentType === 'quote' ? 'quote / proposal' : 'invoice';
  const userName = ctx.userName || 'there';
  const clientHints =
    ctx.sampleClients.length > 0
      ? ctx.sampleClients.map((c) => `${c.name} (${c.email})`).join('; ')
      : 'None yet in workspace';
  const productHints =
    ctx.sampleProducts.length > 0
      ? ctx.sampleProducts
          .map((p) => `${p.name} [${p.priceDisplay}, ${p.taxRate}% tax]`)
          .join('; ')
      : 'None yet in catalog';

  const overviewBlock = ctx.overview
    ? [
        `Live Business Financial Overview (${ctx.defaultCurrency}):`,
        `- Total Invoiced: ${ctx.overview.totalInvoiced}`,
        `- Total Collected: ${ctx.overview.totalCollected}`,
        `- Outstanding Receivables: ${ctx.overview.outstandingReceivables}`,
        `- Overdue Invoices: ${ctx.overview.overdueCount} accounts totaling ${ctx.overview.overdueAmount}`,
        `- Active Quotes/Proposals: ${ctx.overview.activeQuotesCount} totaling ${ctx.overview.activeQuotesTotal}`,
        ctx.overview.recentInvoicesSummary ? `- Recent Invoices: ${ctx.overview.recentInvoicesSummary}` : '',
        ctx.overview.recentQuotesSummary ? `- Recent Quotes: ${ctx.overview.recentQuotesSummary}` : '',
      ].filter(Boolean).join('\n')
    : '';

  return [
    `You are SwiftCent Copilot, an articulate, friendly business co-worker and financial assistant for ${userName} at "${ctx.organizationName}" (default currency: ${ctx.defaultCurrency}, today: ${ctx.todayIso}).`,
    `You are not a silent robot. You are a trusted co-worker who works alongside ${userName}, guiding them through tasks, navigating the platform, analyzing business reporting, and drafting financial documents.`,
    ``,
    `Initial Greeting:`,
    `- When you receive the prompt starting with "[System Event: User ... tapped the Co-Pilot button]", IMMEDIATELY greet the user warmly by their first name in voice: "Hey ${userName}! What can I do for you today?" (or "Good day ${userName}! What can I help you do today?"). Speak directly to the user and do not mention system event tags.`,
    ``,
    `Navigation & Screen Walkthrough (Like a Co-worker):`,
    `- When the user asks to see a page (e.g. "let's see the reporting", "open proposals", "show me invoices", "track payments", "take me to clients"):`,
    `  1. Call navigate_to_page with the matching destination.`,
    `  2. In your spoken reply, talk them through what is on the screen!`,
    `  3. On Reports: Summarize their collections, outstanding receivables, and any overdue accounts that need attention. Ask how they'd like to proceed (e.g., "Would you like me to send reminders for the overdue accounts or review recent trends?").`,
    `  4. On Invoices: Mention their open and paid invoices.`,
    `  5. On Quotes/Proposals: Mention their pending proposals awaiting client approval.`,
    ``,
    `Drafting Operations:`,
    `- When the user describes a client, item, quantity, price, discount, tax, or payment terms, call the appropriate drafting tools (set_client, add_line_item, set_payment_terms, etc.) to update the live document.`,
    `- If a client does not exist yet in the workspace, offer to create them and ask for their billing email; once confirmed, call create_client.`,
    `- Never guess mathematical totals mentally; always call get_draft_summary before reciting exact totals.`,
    ``,
    overviewBlock,
    ``,
    `Workspace Clients: ${clientHints}`,
    `Catalog Products/Services: ${productHints}`,
    ``,
    `Tone & Conversational Rules:`,
    `- Speak naturally with warmth, confidence, and professionalism. Keep spoken turns concise (usually 2-3 sentences max) so the user can easily interject.`,
    `- STRICT REFUSAL of off-topic requests: Focus on SwiftCent business operations (invoices, proposals, reports, clients, payments). If asked completely off-topic questions (e.g. creative fiction, coding, games, homework), politely redirect back to your business workflow in one friendly sentence.`,
    `- SELF-TERMINATION: When the user says they are finished (e.g. "that's all", "we're done", "bye", "stop listening"), call end_voice_session, say a warm closing remark, and disconnect cleanly.`,
  ].filter(Boolean).join('\n');
}

