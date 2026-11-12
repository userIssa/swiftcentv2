import { formatCurrency } from '../engine/calculator';
import { getWireDisplayLabels } from './banking-regions';

export type CustomTemplateHeaderStyle =
  | 'split_classic'
  | 'top_banner'
  | 'left_stripe'
  | 'centered_editorial'
  | 'minimal_grid';

export type CustomTemplateLogoPosition = 'left' | 'right' | 'center' | 'hidden';
export type CustomTemplateBillToStyle = 'stacked' | 'two_column' | 'boxed_cards';
export type CustomTemplateTableStyle =
  | 'solid_header'
  | 'subtle_tint'
  | 'bordered_grid'
  | 'minimal_lines';
export type CustomTemplateTotalsStyle =
  | 'clean_lines'
  | 'highlight_box'
  | 'bordered_summary';
export type CustomTemplateTotalsPosition = 'right' | 'full_width';
export type CustomTemplateFontStyle = 'sans' | 'serif' | 'mono';
export type CustomTemplateCornerRadius = 'none' | 'subtle' | 'rounded';
export type CustomTemplateAccentPosition = 'none' | 'top_bar' | 'left_bar' | 'frame';

export interface CustomTemplateLabels {
  invoiceTitle?: string;
  quoteTitle?: string;
  billToLabel?: string;
  fromLabel?: string;
  itemColumnLabel?: string;
  quantityColumnLabel?: string;
  priceColumnLabel?: string;
  taxColumnLabel?: string;
  totalColumnLabel?: string;
  subtotalLabel?: string;
  discountLabel?: string;
  taxLabel?: string;
  grandTotalLabel?: string;
  notesLabel?: string;
  paymentInstructionsLabel?: string;
  footerTagline?: string;
}

export interface CustomTemplateConfig {
  renderMode?: 'html' | 'blueprint';
  name: string;
  detectedStyleSummary: string;
  htmlTemplate?: string;
  cssStyles?: string;
  headerStyle: CustomTemplateHeaderStyle;
  logoPosition: CustomTemplateLogoPosition;
  billToStyle: CustomTemplateBillToStyle;
  tableStyle: CustomTemplateTableStyle;
  totalsStyle: CustomTemplateTotalsStyle;
  totalsPosition: CustomTemplateTotalsPosition;
  fontStyle: CustomTemplateFontStyle;
  cornerRadius: CustomTemplateCornerRadius;
  pageAccentPosition: CustomTemplateAccentPosition;
  accentWidthPx: number;
  rowStriping: boolean;
  showItemIndex: boolean;
  uppercaseHeaders: boolean;
  showPaymentInstructions: boolean;
  palette: {
    primaryColor: string;
    secondaryColor: string;
    headerTextColor: string;
    pageBackground: string;
    surfaceTint: string;
    borderColor: string;
    textColor: string;
    mutedTextColor: string;
  };
  labels: CustomTemplateLabels;
  updatedAt?: string;
}

export const DEFAULT_CUSTOM_TEMPLATE_CONFIG: CustomTemplateConfig = {
  name: 'Custom Uploaded Format',
  detectedStyleSummary: 'Clean structured invoice blueprint',
  headerStyle: 'split_classic',
  logoPosition: 'left',
  billToStyle: 'two_column',
  tableStyle: 'solid_header',
  totalsStyle: 'clean_lines',
  totalsPosition: 'right',
  fontStyle: 'sans',
  cornerRadius: 'subtle',
  pageAccentPosition: 'top_bar',
  accentWidthPx: 4,
  rowStriping: false,
  showItemIndex: false,
  uppercaseHeaders: true,
  showPaymentInstructions: true,
  palette: {
    primaryColor: '#2563eb',
    secondaryColor: '#0f172a',
    headerTextColor: '#ffffff',
    pageBackground: '#ffffff',
    surfaceTint: '#f8fafc',
    borderColor: '#e2e8f0',
    textColor: '#0f172a',
    mutedTextColor: '#64748b',
  },
  labels: {
    invoiceTitle: 'INVOICE',
    quoteTitle: 'QUOTE',
    billToLabel: 'Bill To',
    fromLabel: 'From',
    itemColumnLabel: 'Description',
    quantityColumnLabel: 'Qty',
    priceColumnLabel: 'Rate',
    taxColumnLabel: 'Tax',
    totalColumnLabel: 'Amount',
    subtotalLabel: 'Subtotal',
    discountLabel: 'Discount',
    taxLabel: 'Tax',
    grandTotalLabel: 'Total Due',
    notesLabel: 'Notes',
    paymentInstructionsLabel: 'Payment Instructions',
    footerTagline: 'Thank you for your business',
  },
};

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function sanitizeHexColor(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  if (HEX_COLOR_RE.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  const shortMatch = /^#([0-9a-fA-F]{3})$/.exec(trimmed);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function sanitizeEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

function sanitizeLabel(
  value: unknown,
  fallback: string,
  maxLength = 60
): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f<>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLength);
}

function sanitizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function sanitizeNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function sanitizeTemplateHtml(rawHtml: unknown): string {
  if (typeof rawHtml !== 'string') return '';
  let cleaned = rawHtml.trim();
  if (!cleaned) return '';

  // Remove dangerous tags and their bodies where applicable
  cleaned = cleaned
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<(iframe|object|embed|applet|frame|frameset|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?(script|style|iframe|object|embed|applet|frame|frameset|link|meta|base|form|input|textarea|button|select|option)\b[^>]*\/?>/gi, '');

  // Strip inline JS event handlers (onmouseover=..., onerror=..., onclick=...)
  cleaned = cleaned.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Block dangerous protocols inside href / src / xlink:href / poster
  cleaned = cleaned.replace(
    /\b(href|src|xlink:href|action|formaction|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (_full, attr: string, dVal?: string, sVal?: string, uVal?: string) => {
      const val = (dVal ?? sVal ?? uVal ?? '').trim();
      const lower = val.toLowerCase().replace(/[\s\u0000-\u001f]+/g, '');
      if (
        lower.startsWith('javascript:') ||
        lower.startsWith('vbscript:') ||
        lower.startsWith('data:text/html')
      ) {
        return `${attr}="#"`;
      }
      return `${attr}="${val.replace(/"/g, '&quot;')}"`;
    }
  );

  return cleaned.slice(0, 40000);
}

export function sanitizeTemplateCss(rawCss: unknown): string {
  if (typeof rawCss !== 'string') return '';
  let cleaned = rawCss.trim();
  if (!cleaned) return '';

  cleaned = cleaned
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@(?:import|charset|namespace)\b[^;]*;?/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, 'none')
    .replace(/behavior\s*:[^;]+;?/gi, '')
    .replace(/-moz-binding\s*:[^;]+;?/gi, '')
    .replace(/url\s*\(\s*(['"]?)(?!#)[^)]*\1\s*\)/gi, 'none');

  return cleaned.slice(0, 20000);
}

function prefixCssSelectorList(selectorList: string, scopeSelector: string): string {
  return selectorList
    .split(',')
    .map((sel) => {
      const trimmed = sel.trim();
      if (!trimmed) return '';
      if (
        trimmed === ':root' ||
        trimmed === 'html' ||
        trimmed === 'body' ||
        trimmed === '.page' ||
        trimmed === '.invoice-box' ||
        trimmed === '.sc-custom-doc'
      ) {
        return scopeSelector;
      }
      if (trimmed.startsWith(scopeSelector)) {
        return trimmed;
      }
      return `${scopeSelector} ${trimmed}`;
    })
    .filter(Boolean)
    .join(', ');
}

export function scopeTemplateCss(
  rawCss: unknown,
  scopeSelector = '.sc-custom-doc'
): string {
  const safeCss = sanitizeTemplateCss(rawCss);
  if (!safeCss) return '';

  let result = '';
  let i = 0;

  const processBlock = (input: string): string => {
    let out = '';
    let idx = 0;
    while (idx < input.length) {
      const openBrace = input.indexOf('{', idx);
      if (openBrace === -1) break;
      const prelude = input.slice(idx, openBrace).trim();
      let depth = 1;
      let cursor = openBrace + 1;
      while (cursor < input.length && depth > 0) {
        if (input[cursor] === '{') depth++;
        else if (input[cursor] === '}') depth--;
        cursor++;
      }
      const body = input.slice(openBrace + 1, cursor - 1);

      if (prelude.startsWith('@media') || prelude.startsWith('@supports')) {
        out += `${prelude} {\n${processBlock(body)}\n}\n`;
      } else if (prelude.startsWith('@font-face') || prelude.startsWith('@page') || prelude.startsWith('@keyframes')) {
        // Skip global @page / @font-face overrides so app/print framing stays clean
      } else if (prelude) {
        const prefixed = prefixCssSelectorList(prelude, scopeSelector);
        if (prefixed) {
          out += `${prefixed} {\n${body}\n}\n`;
        }
      }
      idx = cursor;
    }
    return out;
  };

  result = processBlock(safeCss);
  return result.trim();
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafeLogoUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  return (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('/') ||
    lower.startsWith('data:image/')
  );
}

function replaceSectionBlocks(
  template: string,
  sectionName: string,
  isTruthy: boolean,
  renderTrue?: (inner: string) => string
): string {
  const posRe = new RegExp(
    `\\{\\{#${sectionName}\\}\\}([\\s\\S]*?)\\{\\{\\/${sectionName}\\}\\}`,
    'g'
  );
  const invRe = new RegExp(
    `\\{\\{\\^${sectionName}\\}\\}([\\s\\S]*?)\\{\\{\\/${sectionName}\\}\\}`,
    'g'
  );
  let out = template.replace(posRe, (_m, inner: string) =>
    isTruthy ? (renderTrue ? renderTrue(inner) : inner) : ''
  );
  out = out.replace(invRe, (_m, inner: string) => (!isTruthy ? inner : ''));
  return out;
}

export function renderCustomHtmlDocument(
  config: CustomTemplateConfig,
  doc: any,
  type: 'invoice' | 'quote'
): { html: string; scopedCss: string } {
  const isInvoice = type === 'invoice';
  const currency = doc?.currency || doc?.organizationSnapshot?.currency || 'USD';
  const org = doc?.organizationSnapshot || {};
  const client = doc?.clientSnapshot || {};
  const logoUrl =
    org?.branding?.logoUrl || (doc?.organizationId as any)?.branding?.logoUrl;

  const orgAddress = [
    org.address?.street,
    [org.address?.city, org.address?.state, org.address?.postalCode]
      .filter(Boolean)
      .join(', '),
    org.address?.country,
  ]
    .filter(Boolean)
    .join('\n');

  const clientAddress = [
    client.billingAddress?.street,
    [
      client.billingAddress?.city,
      client.billingAddress?.state,
      client.billingAddress?.postalCode,
    ]
      .filter(Boolean)
      .join(', '),
    client.billingAddress?.country,
  ]
    .filter(Boolean)
    .join('\n');

  const wire = org.wireInstructions || (doc?.organizationId as any)?.wireInstructions || {};
  const hasBankDetails =
    Boolean(wire?.bankName || wire?.accountNumber || wire?.swiftCode) &&
    config.showPaymentInstructions !== false;
  const wireLabels = getWireDisplayLabels(wire, currency);

  const issueDateStr = doc?.issueDate
    ? new Date(doc.issueDate).toLocaleDateString()
    : '';
  const dueDateRaw = isInvoice ? doc?.dueDate : doc?.validUntil;
  const dueDateStr = dueDateRaw ? new Date(dueDateRaw).toLocaleDateString() : '';

  const logoHtml = isSafeLogoUrl(logoUrl)
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(org.name || 'Logo')}" style="max-height:56px;max-width:190px;width:auto;height:auto;object-fit:contain;" />`
    : '';

  const items: any[] = Array.isArray(doc?.items) ? doc.items : [];
  const hasDiscount = Number(doc?.totalDiscountCents || 0) > 0;
  const hasTax = Number(doc?.totalTaxCents || 0) > 0;
  const hasNotes = Boolean(doc?.notes && String(doc.notes).trim());
  const hasTerms = Boolean(doc?.terms && String(doc.terms).trim());

  let rendered = sanitizeTemplateHtml(config.htmlTemplate || '');

  // Expand item loops first
  rendered = replaceSectionBlocks(rendered, 'items', items.length > 0, (rowTpl) =>
    items
      .map((item, idx) => {
        const itemDiscount = Number(item?.discountCents || 0);
        const itemTax = Number(item?.lineTaxCents || 0);
        let row = rowTpl;
        row = replaceSectionBlocks(row, 'item\\.hasDiscount', itemDiscount > 0);
        row = replaceSectionBlocks(row, 'item\\.hasTax', itemTax > 0);
        const rowVars: Record<string, string> = {
          'item.index': String(idx + 1).padStart(2, '0'),
          'item.indexPlain': String(idx + 1),
          'item.description': escapeHtml(item?.description || ''),
          'item.quantity': escapeHtml(String(item?.quantity ?? 0)),
          'item.unitPrice': escapeHtml(formatCurrency(Number(item?.unitPriceCents || 0), currency)),
          'item.discount':
            itemDiscount > 0
              ? escapeHtml(`-${formatCurrency(itemDiscount, currency)}`)
              : '—',
          'item.tax':
            itemTax > 0 ? escapeHtml(formatCurrency(itemTax, currency)) : '—',
          'item.lineTotal': escapeHtml(formatCurrency(Number(item?.lineTotalCents || 0), currency)),
        };
        for (const [key, val] of Object.entries(rowVars)) {
          row = row.split(`{{${key}}}`).join(val);
        }
        return row;
      })
      .join('\n')
  );

  // Conditional document sections
  const sections: Array<[string, boolean]> = [
    ['hasLogo', Boolean(logoHtml)],
    ['hasDiscount', hasDiscount],
    ['hasTax', hasTax],
    ['hasNotes', hasNotes],
    ['hasTerms', hasTerms],
    ['hasBankDetails', hasBankDetails],
    ['isInvoice', isInvoice],
    ['isQuote', !isInvoice],
    ['hasOrgPhone', Boolean(org.phone)],
    ['hasOrgWebsite', Boolean(org.website)],
    ['hasOrgTagline', Boolean(org.tagline)],
    ['hasOrgTaxId', Boolean(org.taxId)],
    ['hasClientTaxId', Boolean(client.taxId)],
    ['hasClientPhone', Boolean(client.phone)],
  ];
  for (const [sec, cond] of sections) {
    rendered = replaceSectionBlocks(rendered, sec, cond);
  }

  // Raw trusted logo HTML token (both triple & double mustache tolerated)
  rendered = rendered.split('{{{org.logoHtml}}}').join(logoHtml);
  rendered = rendered.split('{{org.logoHtml}}').join(logoHtml);

  const scalarVars: Record<string, string> = {
    'org.name': escapeHtml(org.name || 'Registered Business'),
    'org.email': escapeHtml(org.email || ''),
    'org.phone': escapeHtml(org.phone || ''),
    'org.website': escapeHtml(org.website || ''),
    'org.tagline': escapeHtml(org.tagline || ''),
    'org.taxId': escapeHtml(org.taxId || ''),
    'org.address': escapeHtml(orgAddress).replace(/\n/g, '<br />'),
    'org.street': escapeHtml(org.address?.street || ''),
    'org.cityLine': escapeHtml(
      [org.address?.city, org.address?.state, org.address?.postalCode]
        .filter(Boolean)
        .join(', ')
    ),
    'org.country': escapeHtml(org.address?.country || ''),
    'client.name': escapeHtml(client.name || 'Client'),
    'client.email': escapeHtml(client.email || ''),
    'client.phone': escapeHtml(client.phone || ''),
    'client.taxId': escapeHtml(client.taxId || ''),
    'client.address': escapeHtml(clientAddress).replace(/\n/g, '<br />'),
    'client.street': escapeHtml(client.billingAddress?.street || ''),
    'client.cityLine': escapeHtml(
      [
        client.billingAddress?.city,
        client.billingAddress?.state,
        client.billingAddress?.postalCode,
      ]
        .filter(Boolean)
        .join(', ')
    ),
    'client.country': escapeHtml(client.billingAddress?.country || ''),
    'doc.typeLabel': escapeHtml(
      isInvoice
        ? config.labels.invoiceTitle || 'INVOICE'
        : config.labels.quoteTitle || 'QUOTE'
    ),
    'doc.number': escapeHtml(
      (isInvoice ? doc?.invoiceNumber : doc?.quoteNumber) || ''
    ),
    'doc.numberLabel': escapeHtml(isInvoice ? 'Invoice #' : 'Quote #'),
    'doc.issueDate': escapeHtml(issueDateStr),
    'doc.dueDateLabel': escapeHtml(isInvoice ? 'Due Date' : 'Valid Until'),
    'doc.dueDate': escapeHtml(dueDateStr),
    'doc.currency': escapeHtml(currency),
    'doc.status': escapeHtml(String(doc?.status || 'draft').toUpperCase()),
    'doc.notes': escapeHtml(doc?.notes || '').replace(/\n/g, '<br />'),
    'doc.terms': escapeHtml(doc?.terms || '').replace(/\n/g, '<br />'),
    'totals.subtotal': escapeHtml(formatCurrency(Number(doc?.subtotalCents || 0), currency)),
    'totals.discount': escapeHtml(`-${formatCurrency(Number(doc?.totalDiscountCents || 0), currency)}`),
    'totals.tax': escapeHtml(formatCurrency(Number(doc?.totalTaxCents || 0), currency)),
    'totals.grandTotal': escapeHtml(formatCurrency(Number(doc?.grandTotalCents || 0), currency)),
    'totals.amountPaid': escapeHtml(formatCurrency(Number(doc?.paidCents || 0), currency)),
    'totals.balanceDue': escapeHtml(
      formatCurrency(Number(doc?.balanceDueCents ?? doc?.grandTotalCents ?? 0), currency)
    ),
    'bank.bankName': escapeHtml(wire.bankName || ''),
    'bank.accountName': escapeHtml(wire.accountName || ''),
    'bank.accountLabel': escapeHtml(wireLabels.accountShortLabel),
    'bank.accountNumber': escapeHtml(wire.accountNumber || ''),
    'bank.routingLabel': escapeHtml(wireLabels.routingShortLabel),
    'bank.routingNumber': escapeHtml(wire.routingNumber || ''),
    'bank.swiftCode': escapeHtml(wire.swiftCode || ''),
    'bank.instructions': escapeHtml(wire.instructions || '').replace(/\n/g, '<br />'),
    'labels.billTo': escapeHtml(config.labels.billToLabel || 'Bill To'),
    'labels.from': escapeHtml(config.labels.fromLabel || 'From'),
    'labels.itemColumn': escapeHtml(config.labels.itemColumnLabel || 'Description'),
    'labels.quantityColumn': escapeHtml(config.labels.quantityColumnLabel || 'Qty'),
    'labels.priceColumn': escapeHtml(config.labels.priceColumnLabel || 'Rate'),
    'labels.taxColumn': escapeHtml(config.labels.taxColumnLabel || 'Tax'),
    'labels.totalColumn': escapeHtml(config.labels.totalColumnLabel || 'Amount'),
    'labels.subtotal': escapeHtml(config.labels.subtotalLabel || 'Subtotal'),
    'labels.discount': escapeHtml(config.labels.discountLabel || 'Discount'),
    'labels.tax': escapeHtml(config.labels.taxLabel || 'Tax'),
    'labels.grandTotal': escapeHtml(config.labels.grandTotalLabel || 'Total Due'),
    'labels.notes': escapeHtml(config.labels.notesLabel || 'Notes'),
    'labels.paymentInstructions': escapeHtml(
      config.labels.paymentInstructionsLabel || 'Payment Instructions'
    ),
    'labels.footerTagline': escapeHtml(
      config.labels.footerTagline || 'Thank you for your business'
    ),
  };

  for (const [key, val] of Object.entries(scalarVars)) {
    rendered = rendered.split(`{{${key}}}`).join(val);
  }

  // Strip any leftover unrecognized mustache tags gracefully
  rendered = rendered.replace(/\{\{\{?[^{}]+\}\}\}?/g, '');

  const scopedCss = scopeTemplateCss(config.cssStyles || '', '.sc-custom-doc');
  return { html: rendered, scopedCss };
}

export function normalizeCustomTemplateConfig(
  raw: unknown,
  fallbackOverrides?: Partial<CustomTemplateConfig>
): CustomTemplateConfig {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const rawPalette =
    input.palette && typeof input.palette === 'object' ? input.palette : {};
  const rawLabels =
    input.labels && typeof input.labels === 'object' ? input.labels : {};

  const def = {
    ...DEFAULT_CUSTOM_TEMPLATE_CONFIG,
    ...fallbackOverrides,
    palette: {
      ...DEFAULT_CUSTOM_TEMPLATE_CONFIG.palette,
      ...(fallbackOverrides?.palette || {}),
    },
    labels: {
      ...DEFAULT_CUSTOM_TEMPLATE_CONFIG.labels,
      ...(fallbackOverrides?.labels || {}),
    },
  };

  const sanitizedHtml = sanitizeTemplateHtml(input.htmlTemplate);
  const sanitizedCss = sanitizeTemplateCss(input.cssStyles);
  const renderMode: 'html' | 'blueprint' =
    input.renderMode === 'html' && sanitizedHtml
      ? 'html'
      : sanitizedHtml && input.renderMode !== 'blueprint'
        ? 'html'
        : 'blueprint';

  return {
    renderMode,
    name: sanitizeLabel(input.name, def.name, 50),
    detectedStyleSummary: sanitizeLabel(
      input.detectedStyleSummary,
      def.detectedStyleSummary,
      140
    ),
    ...(sanitizedHtml ? { htmlTemplate: sanitizedHtml } : {}),
    ...(sanitizedCss ? { cssStyles: sanitizedCss } : {}),
    headerStyle: sanitizeEnum(
      input.headerStyle,
      [
        'split_classic',
        'top_banner',
        'left_stripe',
        'centered_editorial',
        'minimal_grid',
      ] as const,
      def.headerStyle
    ),
    logoPosition: sanitizeEnum(
      input.logoPosition,
      ['left', 'right', 'center', 'hidden'] as const,
      def.logoPosition
    ),
    billToStyle: sanitizeEnum(
      input.billToStyle,
      ['stacked', 'two_column', 'boxed_cards'] as const,
      def.billToStyle
    ),
    tableStyle: sanitizeEnum(
      input.tableStyle,
      ['solid_header', 'subtle_tint', 'bordered_grid', 'minimal_lines'] as const,
      def.tableStyle
    ),
    totalsStyle: sanitizeEnum(
      input.totalsStyle,
      ['clean_lines', 'highlight_box', 'bordered_summary'] as const,
      def.totalsStyle
    ),
    totalsPosition: sanitizeEnum(
      input.totalsPosition,
      ['right', 'full_width'] as const,
      def.totalsPosition
    ),
    fontStyle: sanitizeEnum(
      input.fontStyle,
      ['sans', 'serif', 'mono'] as const,
      def.fontStyle
    ),
    cornerRadius: sanitizeEnum(
      input.cornerRadius,
      ['none', 'subtle', 'rounded'] as const,
      def.cornerRadius
    ),
    pageAccentPosition: sanitizeEnum(
      input.pageAccentPosition,
      ['none', 'top_bar', 'left_bar', 'frame'] as const,
      def.pageAccentPosition
    ),
    accentWidthPx: sanitizeNumber(input.accentWidthPx, 1, 12, def.accentWidthPx),
    rowStriping: sanitizeBoolean(input.rowStriping, def.rowStriping),
    showItemIndex: sanitizeBoolean(input.showItemIndex, def.showItemIndex),
    uppercaseHeaders: sanitizeBoolean(input.uppercaseHeaders, def.uppercaseHeaders),
    showPaymentInstructions: sanitizeBoolean(
      input.showPaymentInstructions,
      def.showPaymentInstructions
    ),
    palette: {
      primaryColor: sanitizeHexColor(rawPalette.primaryColor, def.palette.primaryColor),
      secondaryColor: sanitizeHexColor(
        rawPalette.secondaryColor,
        def.palette.secondaryColor
      ),
      headerTextColor: sanitizeHexColor(
        rawPalette.headerTextColor,
        def.palette.headerTextColor
      ),
      pageBackground: sanitizeHexColor(
        rawPalette.pageBackground,
        def.palette.pageBackground
      ),
      surfaceTint: sanitizeHexColor(rawPalette.surfaceTint, def.palette.surfaceTint),
      borderColor: sanitizeHexColor(rawPalette.borderColor, def.palette.borderColor),
      textColor: sanitizeHexColor(rawPalette.textColor, def.palette.textColor),
      mutedTextColor: sanitizeHexColor(
        rawPalette.mutedTextColor,
        def.palette.mutedTextColor
      ),
    },
    labels: {
      invoiceTitle: sanitizeLabel(
        rawLabels.invoiceTitle,
        def.labels.invoiceTitle || 'INVOICE',
        32
      ),
      quoteTitle: sanitizeLabel(
        rawLabels.quoteTitle,
        def.labels.quoteTitle || 'QUOTE',
        32
      ),
      billToLabel: sanitizeLabel(
        rawLabels.billToLabel,
        def.labels.billToLabel || 'Bill To',
        32
      ),
      fromLabel: sanitizeLabel(rawLabels.fromLabel, def.labels.fromLabel || 'From', 32),
      itemColumnLabel: sanitizeLabel(
        rawLabels.itemColumnLabel,
        def.labels.itemColumnLabel || 'Description',
        32
      ),
      quantityColumnLabel: sanitizeLabel(
        rawLabels.quantityColumnLabel,
        def.labels.quantityColumnLabel || 'Qty',
        20
      ),
      priceColumnLabel: sanitizeLabel(
        rawLabels.priceColumnLabel,
        def.labels.priceColumnLabel || 'Rate',
        24
      ),
      taxColumnLabel: sanitizeLabel(
        rawLabels.taxColumnLabel,
        def.labels.taxColumnLabel || 'Tax',
        20
      ),
      totalColumnLabel: sanitizeLabel(
        rawLabels.totalColumnLabel,
        def.labels.totalColumnLabel || 'Amount',
        24
      ),
      subtotalLabel: sanitizeLabel(
        rawLabels.subtotalLabel,
        def.labels.subtotalLabel || 'Subtotal',
        28
      ),
      discountLabel: sanitizeLabel(
        rawLabels.discountLabel,
        def.labels.discountLabel || 'Discount',
        28
      ),
      taxLabel: sanitizeLabel(rawLabels.taxLabel, def.labels.taxLabel || 'Tax', 28),
      grandTotalLabel: sanitizeLabel(
        rawLabels.grandTotalLabel,
        def.labels.grandTotalLabel || 'Total Due',
        32
      ),
      notesLabel: sanitizeLabel(
        rawLabels.notesLabel,
        def.labels.notesLabel || 'Notes',
        32
      ),
      paymentInstructionsLabel: sanitizeLabel(
        rawLabels.paymentInstructionsLabel,
        def.labels.paymentInstructionsLabel || 'Payment Instructions',
        40
      ),
      footerTagline: sanitizeLabel(
        rawLabels.footerTagline,
        def.labels.footerTagline || 'Thank you for your business',
        90
      ),
    },
    updatedAt:
      typeof input.updatedAt === 'string' && input.updatedAt.trim()
        ? input.updatedAt.trim()
        : new Date().toISOString(),
  };
}

export const CUSTOM_TEMPLATE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    detectedStyleSummary: { type: 'string' },
    headerStyle: {
      type: 'string',
      enum: [
        'split_classic',
        'top_banner',
        'left_stripe',
        'centered_editorial',
        'minimal_grid',
      ],
    },
    logoPosition: {
      type: 'string',
      enum: ['left', 'right', 'center', 'hidden'],
    },
    billToStyle: {
      type: 'string',
      enum: ['stacked', 'two_column', 'boxed_cards'],
    },
    tableStyle: {
      type: 'string',
      enum: ['solid_header', 'subtle_tint', 'bordered_grid', 'minimal_lines'],
    },
    totalsStyle: {
      type: 'string',
      enum: ['clean_lines', 'highlight_box', 'bordered_summary'],
    },
    totalsPosition: {
      type: 'string',
      enum: ['right', 'full_width'],
    },
    fontStyle: {
      type: 'string',
      enum: ['sans', 'serif', 'mono'],
    },
    cornerRadius: {
      type: 'string',
      enum: ['none', 'subtle', 'rounded'],
    },
    pageAccentPosition: {
      type: 'string',
      enum: ['none', 'top_bar', 'left_bar', 'frame'],
    },
    accentWidthPx: { type: 'number' },
    rowStriping: { type: 'boolean' },
    showItemIndex: { type: 'boolean' },
    uppercaseHeaders: { type: 'boolean' },
    showPaymentInstructions: { type: 'boolean' },
    palette: {
      type: 'object',
      additionalProperties: false,
      properties: {
        primaryColor: { type: 'string' },
        secondaryColor: { type: 'string' },
        headerTextColor: { type: 'string' },
        pageBackground: { type: 'string' },
        surfaceTint: { type: 'string' },
        borderColor: { type: 'string' },
        textColor: { type: 'string' },
        mutedTextColor: { type: 'string' },
      },
      required: [
        'primaryColor',
        'secondaryColor',
        'headerTextColor',
        'pageBackground',
        'surfaceTint',
        'borderColor',
        'textColor',
        'mutedTextColor',
      ],
    },
    labels: {
      type: 'object',
      additionalProperties: false,
      properties: {
        invoiceTitle: { type: 'string' },
        quoteTitle: { type: 'string' },
        billToLabel: { type: 'string' },
        fromLabel: { type: 'string' },
        itemColumnLabel: { type: 'string' },
        quantityColumnLabel: { type: 'string' },
        priceColumnLabel: { type: 'string' },
        taxColumnLabel: { type: 'string' },
        totalColumnLabel: { type: 'string' },
        subtotalLabel: { type: 'string' },
        discountLabel: { type: 'string' },
        taxLabel: { type: 'string' },
        grandTotalLabel: { type: 'string' },
        notesLabel: { type: 'string' },
        paymentInstructionsLabel: { type: 'string' },
        footerTagline: { type: 'string' },
      },
      required: [
        'invoiceTitle',
        'quoteTitle',
        'billToLabel',
        'fromLabel',
        'itemColumnLabel',
        'quantityColumnLabel',
        'priceColumnLabel',
        'taxColumnLabel',
        'totalColumnLabel',
        'subtotalLabel',
        'discountLabel',
        'taxLabel',
        'grandTotalLabel',
        'notesLabel',
        'paymentInstructionsLabel',
        'footerTagline',
      ],
    },
  },
  required: [
    'name',
    'detectedStyleSummary',
    'headerStyle',
    'logoPosition',
    'billToStyle',
    'tableStyle',
    'totalsStyle',
    'totalsPosition',
    'fontStyle',
    'cornerRadius',
    'pageAccentPosition',
    'accentWidthPx',
    'rowStriping',
    'showItemIndex',
    'uppercaseHeaders',
    'showPaymentInstructions',
    'palette',
    'labels',
  ],
} as const;

export function buildTemplateExtractionPrompt(
  tweakPrompt?: string,
  previousTemplate?: { htmlTemplate?: string; cssStyles?: string },
  hasVisualSnapshot = false
): string {
  const userTweak =
    typeof tweakPrompt === 'string' && tweakPrompt.trim()
      ? `\n\nUSER CUSTOMIZATION / REFINEMENT REQUEST:\n"${tweakPrompt.trim().slice(0, 500)}"\nFollow this instruction carefully alongside the uploaded reference.`
      : '';

  const previousSection =
    previousTemplate?.htmlTemplate
      ? `\n\nEXISTING GENERATED HTML/CSS TO REFINE:\n---HTML---\n${previousTemplate.htmlTemplate.slice(0, 14000)}\n---CSS---\n${(previousTemplate.cssStyles || '').slice(0, 8000)}\n${
          hasVisualSnapshot
            ? 'VISUAL DIFF SELF-CRITIQUE MODE: IMAGE 1 is the user target reference you must match. IMAGE 2 is how the existing HTML+CSS rendered. Compare Image 1 vs Image 2 carefully pixel-by-pixel (header ribbons/shapes, logo placement, column alignments, spacing, table headers/borders, totals card, fonts, and hex palette) and rewrite the HTML/CSS to eliminate every visual discrepancy.'
            : 'Modify ONLY what is needed to match the reference even closer and satisfy the user\'s refinement request.'
        }`
      : '';

  return `You are a world-class frontend UI engineer & graphic designer for SwiftCent invoicing software.
Your job is to inspect the uploaded invoice/quote image or PDF and recreate its **EXACT visual layout, proportions, geometry, banners/stripes/shapes, typography, table structure, callout boxes, alignment, badges, signature blocks, and colors** using clean HTML + CSS (htmlTemplate and cssStyles).

CRITICAL DESIGN REPLICATION RULES:
1. Study EVERY visual element in the uploaded document:
   - Exact header arrangement (angled/diagonal bands, split columns, colored header bar, top accent strip, centered branding, logo box placement, right-aligned metadata stack, etc.). Use CSS gradients, borders, flexbox/grid, clip-path, or inline <svg> shapes to match decorative bars/angles/curves faithfully!
   - Exact spacing, typography scale (bold large title vs crisp muted labels), borders, rounded vs sharp square corners, zebra striping or grid lines in the items table, bordered vs filled total boxes, notes/terms boxes, payment instructions, signature/acceptance lines (if any appear in the reference), and bottom footer accent bars.
2. NEVER hardcode the uploaded screenshot's business name, client name, email, addresses, invoice/quote numbers, dates, item descriptions, or currency totals! Replace ALL dynamic content with SwiftCent's placeholders:
   - Company / Sender:
     {{#hasLogo}}<div class="logo">{{{org.logoHtml}}}</div>{{/hasLogo}}, {{org.name}}, {{org.email}}, {{#hasOrgPhone}}{{org.phone}}{{/hasOrgPhone}}, {{#hasOrgWebsite}}{{org.website}}{{/hasOrgWebsite}}, {{#hasOrgTagline}}{{org.tagline}}{{/hasOrgTagline}}, {{org.address}}, {{#hasOrgTaxId}}{{org.taxId}}{{/hasOrgTaxId}}
   - Client:
     {{labels.billTo}}, {{client.name}}, {{client.email}}, {{#hasClientPhone}}{{client.phone}}{{/hasClientPhone}}, {{client.address}}, {{#hasClientTaxId}}{{client.taxId}}{{/hasClientTaxId}}
   - Document Metadata:
     {{doc.typeLabel}} (replaces with extracted INVOICE/QUOTE title), {{doc.number}}, {{doc.issueDate}}, {{doc.dueDateLabel}}, {{doc.dueDate}}, {{doc.currency}}, {{doc.status}}
   - Line Items Table Loop (<tbody>):
     {{#items}}
       <tr> ... {{item.index}} {{item.description}} {{item.quantity}} {{item.unitPrice}} {{item.tax}} {{item.lineTotal}} ... </tr>
     {{/items}}
   - Totals (use SwiftCent's calculated amounts cleanly):
     {{totals.subtotal}}, {{#hasDiscount}}{{totals.discount}}{{/hasDiscount}}, {{#hasTax}}{{totals.tax}}{{/hasTax}}, {{totals.grandTotal}}, {{#isInvoice}}{{totals.amountPaid}} / {{totals.balanceDue}}{{/isInvoice}}
   - Notes, Terms & Bank Settlement:
     {{#hasNotes}}{{doc.notes}}{{/hasNotes}}, {{#hasTerms}}{{doc.terms}}{{/hasTerms}},
     {{#hasBankDetails}}{{bank.bankName}}, {{bank.accountName}}, {{bank.accountLabel}}: {{bank.accountNumber}}, {{bank.routingLabel}}: {{bank.routingNumber}}, {{bank.swiftCode}}, {{bank.instructions}}{{/hasBankDetails}}
   - Footer: {{labels.footerTagline}}
3. Use CSS custom properties inside cssStyles (var(--sc-primary), var(--sc-secondary), var(--sc-header-text), var(--sc-page-bg), var(--sc-surface), var(--sc-border), var(--sc-text), var(--sc-muted)) so live theme swatch adjustments work instantaneously without regenerating. Also match the font personality using SwiftCent curated font variables: var(--sc-font-sans), var(--sc-font-geometric), var(--sc-font-editorial), var(--sc-font-condensed), or var(--sc-font-mono).
4. Keep HTML/CSS self-contained inside htmlTemplate + cssStyles:
   - Root container inside cssStyles: style .sc-doc cleanly (box-sizing: border-box; width: 100%; min-height: 980px; background: var(--sc-page-bg); color: var(--sc-text); padding: ...). Ensure crisp A4/US-Letter proportions and print legibility.
   - NO <script>, NO external CSS @import, NO url(...) image/font links, NO on* event attributes.
   - Escape JSON strings properly in your final JSON output!
5. Extract accurate 6-digit hex palette colors (#rrggbb) and exact labels (invoiceTitle like "PRICE QUOTE" / "TAX INVOICE", column headers, tagline) from the uploaded document.${userTweak}${previousSection}

Return ONLY a valid raw JSON object (no markdown fences, no commentary) using this exact structure:
{
  "name": "2-4 word name",
  "detectedStyleSummary": "1 concise sentence describing visual match",
  "htmlTemplate": "<div class=\\"sc-doc\\">...</div>",
  "cssStyles": ".sc-doc { ... }",
  "headerStyle": "split_classic | top_banner | left_stripe | centered_editorial | minimal_grid",
  "logoPosition": "left | right | center | hidden",
  "billToStyle": "stacked | two_column | boxed_cards",
  "tableStyle": "solid_header | subtle_tint | bordered_grid | minimal_lines",
  "totalsStyle": "clean_lines | highlight_box | bordered_summary",
  "totalsPosition": "right | full_width",
  "fontStyle": "sans | serif | mono",
  "cornerRadius": "none | subtle | rounded",
  "pageAccentPosition": "none | top_bar | left_bar | frame",
  "accentWidthPx": 4,
  "rowStriping": false,
  "showItemIndex": false,
  "uppercaseHeaders": true,
  "showPaymentInstructions": true,
  "palette": {
    "primaryColor": "#rrggbb",
    "secondaryColor": "#rrggbb",
    "headerTextColor": "#rrggbb",
    "pageBackground": "#ffffff",
    "surfaceTint": "#f8fafc",
    "borderColor": "#e2e8f0",
    "textColor": "#0f172a",
    "mutedTextColor": "#64748b"
  },
  "labels": {
    "invoiceTitle": "INVOICE",
    "quoteTitle": "QUOTE",
    "billToLabel": "Bill To",
    "fromLabel": "From",
    "itemColumnLabel": "Description",
    "quantityColumnLabel": "Qty",
    "priceColumnLabel": "Rate",
    "taxColumnLabel": "Tax",
    "totalColumnLabel": "Amount",
    "subtotalLabel": "Subtotal",
    "discountLabel": "Discount",
    "taxLabel": "Tax",
    "grandTotalLabel": "Total Due",
    "notesLabel": "Notes",
    "paymentInstructionsLabel": "Payment Instructions",
    "footerTagline": "Thank you for your business"
  }
}`;
}

