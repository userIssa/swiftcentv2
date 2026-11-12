'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import {
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Palette,
  Layout,
  Check,
  Plus,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { QuoteStatusBadge } from '@/components/QuoteStatusBadge';
import { formatCurrency } from '@/engine/calculator';
import { getWireDisplayLabels } from '@/lib/banking-regions';
import { InvoiceStatus } from '@/engine/state-machine';
import {
  CustomTemplateConfig,
  normalizeCustomTemplateConfig,
  renderCustomHtmlDocument,
} from '@/lib/custom-template';

const CustomTemplateStudioModalContent = dynamic(
  () => import('@/components/CustomTemplateStudio').then((m) => m.CustomTemplateStudio),
  { ssr: false }
);

export type TemplateTheme = 'custom' | 'modern' | 'corporate' | 'creative';
export type AccentColor = '#2563eb' | '#059669' | '#4f46e5' | '#0f172a' | '#d97706';

interface DocumentTemplateViewProps {
  doc: any;
  type: 'invoice' | 'quote';
  showControls?: boolean;
  allowCustomUpload?: boolean;
  previewCustomTemplate?: CustomTemplateConfig | null;
  onCustomTemplateSaved?: (tpl: CustomTemplateConfig | null) => void;
}

const ACCENT_COLORS: { label: string; hex: AccentColor; bgClass: string; textClass: string; borderClass: string }[] = [
  { label: 'Blue', hex: '#2563eb', bgClass: 'bg-blue-600', textClass: 'text-blue-600', borderClass: 'border-blue-600' },
  { label: 'Emerald', hex: '#059669', bgClass: 'bg-emerald-600', textClass: 'text-emerald-600', borderClass: 'border-emerald-600' },
  { label: 'Indigo', hex: '#4f46e5', bgClass: 'bg-indigo-600', textClass: 'text-indigo-600', borderClass: 'border-indigo-600' },
  { label: 'Slate', hex: '#0f172a', bgClass: 'bg-slate-900', textClass: 'text-slate-900', borderClass: 'border-slate-900' },
  { label: 'Amber', hex: '#d97706', bgClass: 'bg-amber-600', textClass: 'text-amber-600', borderClass: 'border-amber-600' },
];

export function DocumentTemplateView({
  doc,
  type,
  showControls = true,
  allowCustomUpload = false,
  previewCustomTemplate = null,
  onCustomTemplateSaved,
}: DocumentTemplateViewProps) {
  const [localCustomTemplate, setLocalCustomTemplate] =
    useState<CustomTemplateConfig | null>(null);
  const [hasLocalOverride, setHasLocalOverride] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const docCustomTemplate =
    previewCustomTemplate ||
    doc?.organizationSnapshot?.branding?.customTemplate ||
    (doc?.organizationId as any)?.branding?.customTemplate ||
    null;

  const rawCustomTemplate = hasLocalOverride
    ? localCustomTemplate
    : docCustomTemplate;

  const resolvedCustomTemplate = rawCustomTemplate
    ? normalizeCustomTemplateConfig(rawCustomTemplate)
    : null;

  const [theme, setTheme] = useState<TemplateTheme>(
    resolvedCustomTemplate ? 'custom' : 'modern'
  );
  const [accentColor, setAccentColor] = useState<AccentColor>(
    (doc?.organizationSnapshot?.branding?.primaryColor as AccentColor) || '#2563eb'
  );

  useEffect(() => {
    if (previewCustomTemplate) {
      setTheme('custom');
    } else if (resolvedCustomTemplate) {
      setTheme((prev) => (prev === 'modern' ? 'custom' : prev));
    }
  }, [previewCustomTemplate, resolvedCustomTemplate?.updatedAt]);

  useEffect(() => {
    if (!showImportModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowImportModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showImportModal]);

  if (!doc) return null;

  const isInvoice = type === 'invoice';
  const docNumber = isInvoice ? doc.invoiceNumber : doc.quoteNumber;
  const docTitle = isInvoice ? 'INVOICE' : 'PROPOSAL / ESTIMATE';
  const currency = doc.currency || doc.organizationSnapshot?.currency || 'USD';
  const logoUrl =
    doc.organizationSnapshot?.branding?.logoUrl ||
    (doc.organizationId as any)?.branding?.logoUrl;
  const docOrganizationId =
    typeof doc.organizationId === 'string'
      ? doc.organizationId
      : doc.organizationId?._id;

  const currentColor =
    ACCENT_COLORS.find((c) => c.hex.toLowerCase() === accentColor.toLowerCase()) || ACCENT_COLORS[0];

  const availableThemes: Array<{ id: TemplateTheme; label: string; isCustom?: boolean }> = [
    ...(resolvedCustomTemplate
      ? [{ id: 'custom' as const, label: resolvedCustomTemplate.name || 'Custom Template', isCustom: true }]
      : []),
    { id: 'modern', label: 'Modern Clean' },
    { id: 'corporate', label: 'Corporate Formal' },
    { id: 'creative', label: 'Creative Studio' },
  ];

  return (
    <div className="space-y-4">
      {/* Interactive Template & Accent Color Controls (Hidden in Print) */}
      {showControls && (
        <div className="no-print bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          {/* Theme Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Layout className="w-3.5 h-3.5 text-slate-400" />
              <span>Theme:</span>
            </span>
            {availableThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  theme === t.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.isCustom && <Sparkles className="w-3 h-3 text-blue-400" />}
                {t.label}
              </button>
            ))}

            {allowCustomUpload && (
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border border-dashed border-sky-300 bg-sky-50 text-sky-600 hover:bg-sky-50/70"
                title="Upload your own invoice format and recreate it with Gemini AI"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{resolvedCustomTemplate ? 'Edit Yours' : 'Add Yours'}</span>
              </button>
            )}
          </div>

          {/* Color Palette Selector */}
          {theme === 'custom' && resolvedCustomTemplate ? (
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span
                className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block"
                style={{ backgroundColor: resolvedCustomTemplate.palette.primaryColor }}
              />
              <span>Using workspace AI-recreated template</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                <span>Accent:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setAccentColor(c.hex)}
                    className={`w-6 h-6 rounded-full ${c.bgClass} flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                      accentColor.toLowerCase() === c.hex.toLowerCase() ? 'ring-2 ring-offset-2 ring-slate-900' : ''
                    }`}
                    title={c.label}
                  >
                    {accentColor.toLowerCase() === c.hex.toLowerCase() && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Render Document based on Theme */}
      {theme === 'custom' && resolvedCustomTemplate && (
        <CustomBlueprintTemplate
          doc={doc}
          type={type}
          docNumber={docNumber}
          currency={currency}
          logoUrl={logoUrl}
          config={resolvedCustomTemplate}
        />
      )}

      {theme === 'modern' && (
        <ModernCleanTemplate
          doc={doc}
          type={type}
          docNumber={docNumber}
          docTitle={docTitle}
          currency={currency}
          logoUrl={logoUrl}
          color={currentColor}
        />
      )}

      {theme === 'corporate' && (
        <CorporateFormalTemplate
          doc={doc}
          type={type}
          docNumber={docNumber}
          docTitle={docTitle}
          currency={currency}
          logoUrl={logoUrl}
          color={currentColor}
        />
      )}

      {theme === 'creative' && (
        <CreativeStudioTemplate
          doc={doc}
          type={type}
          docNumber={docNumber}
          docTitle={docTitle}
          currency={currency}
          logoUrl={logoUrl}
          color={currentColor}
        />
      )}

      {showImportModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowImportModal(false);
            }}
            className="no-print fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 sm:p-6"
          >
            <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
              <CustomTemplateStudioModalContent
                targetOrganizationId={docOrganizationId}
                targetOrganizationName={doc?.organizationSnapshot?.name}
                initialTemplate={resolvedCustomTemplate}
                sampleDocument={doc}
                defaultDocType={type}
                onClose={() => setShowImportModal(false)}
                onSaved={(tpl) => {
                  setLocalCustomTemplate(tpl);
                  setHasLocalOverride(true);
                  onCustomTemplateSaved?.(tpl);
                  if (tpl) {
                    setTheme('custom');
                    setShowImportModal(false);
                  } else {
                    setTheme('modern');
                  }
                }}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// -------------------------------------------------------------
// 1. MODERN CLEAN TEMPLATE
// -------------------------------------------------------------
function ModernCleanTemplate({ doc, type, docNumber, docTitle, currency, logoUrl, color }: any) {
  const isInvoice = type === 'invoice';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-12 print-page space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-8 border-b border-slate-200 pb-8">
        <div>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={doc.organizationSnapshot?.name || 'Logo'}
              className="h-12 w-auto max-w-[200px] object-contain mb-3"
            />
          ) : null}
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {doc.organizationSnapshot?.name || 'Registered Business'}
          </div>
          <div className="text-xs text-slate-500 mt-2 space-y-0.5">
            <div>{doc.organizationSnapshot?.email}</div>
            {doc.organizationSnapshot?.address?.street && <div>{doc.organizationSnapshot.address.street}</div>}
            {(doc.organizationSnapshot?.address?.city ||
              doc.organizationSnapshot?.address?.state ||
              doc.organizationSnapshot?.address?.postalCode) && (
              <div>
                {[
                  doc.organizationSnapshot?.address?.city,
                  doc.organizationSnapshot?.address?.state,
                  doc.organizationSnapshot?.address?.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            )}
            {doc.organizationSnapshot?.address?.country && <div>{doc.organizationSnapshot.address.country}</div>}
            {doc.organizationSnapshot?.taxId && (
              <div className="pt-1 font-medium text-slate-700">Tax ID: {doc.organizationSnapshot.taxId}</div>
            )}
          </div>
        </div>

        <div className="sm:text-right">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{docTitle}</h2>
          <div style={{ color: color.hex }} className="text-base font-bold mt-1">
            {docNumber}
          </div>
          <div className="text-xs text-slate-500 mt-3 space-y-1">
            <div>
              <span className="font-medium text-slate-700">Issue Date:</span>{' '}
              {new Date(doc.issueDate).toLocaleDateString()}
            </div>
            {isInvoice ? (
              <div>
                <span className="font-medium text-slate-700">Due Date:</span>{' '}
                {new Date(doc.dueDate).toLocaleDateString()}
              </div>
            ) : (
              <div>
                <span className="font-medium text-slate-700">Valid Until:</span>{' '}
                {new Date(doc.validUntil).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recipient */}
      <div className="py-2 border-b border-slate-200 pb-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          {isInvoice ? 'Billed To' : 'Proposed To'}
        </div>
        <div className="text-base font-bold text-slate-900">{doc.clientSnapshot?.name}</div>
        <div className="text-xs text-slate-500 mt-1 space-y-0.5">
          <div>{doc.clientSnapshot?.email}</div>
          {doc.clientSnapshot?.billingAddress?.street && <div>{doc.clientSnapshot.billingAddress.street}</div>}
          {(doc.clientSnapshot?.billingAddress?.city ||
            doc.clientSnapshot?.billingAddress?.state ||
            doc.clientSnapshot?.billingAddress?.postalCode) && (
            <div>
              {[
                doc.clientSnapshot?.billingAddress?.city,
                doc.clientSnapshot?.billingAddress?.state,
                doc.clientSnapshot?.billingAddress?.postalCode,
              ]
                .filter(Boolean)
                .join(', ')}
            </div>
          )}
          {doc.clientSnapshot?.billingAddress?.country && <div>{doc.clientSnapshot.billingAddress.country}</div>}
          {doc.clientSnapshot?.taxId && (
            <div className="pt-1 font-medium text-slate-700">Tax ID: {doc.clientSnapshot.taxId}</div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <LineItemsTable doc={doc} currency={currency} color={color} />

      {/* Totals & Notes */}
      <TotalsAndTerms doc={doc} currency={currency} isInvoice={isInvoice} color={color} />
    </div>
  );
}

// -------------------------------------------------------------
// 2. CORPORATE FORMAL TEMPLATE
// -------------------------------------------------------------
function CorporateFormalTemplate({ doc, type, docNumber, docTitle, currency, logoUrl, color }: any) {
  const isInvoice = type === 'invoice';

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-800 shadow-sm p-8 sm:p-12 print-page space-y-8 font-serif">
      {/* Top Executive Double Border Header */}
      <div className="border-b-4 border-double border-slate-800 pb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={doc.organizationSnapshot?.name || 'Logo'}
                className="h-14 w-auto max-w-[220px] object-contain p-1 border border-slate-300 bg-white"
              />
            ) : null}
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">
                {doc.organizationSnapshot?.name || 'Corporate Entity'}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5 italic">Official Commercial Billing Document</p>
            </div>
          </div>

          <div className="sm:text-right bg-slate-100 p-4 rounded-lg border border-slate-300 min-w-[220px]">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{docTitle}</div>
            <div style={{ color: color.hex }} className="text-xl font-bold font-mono mt-1">
              {docNumber}
            </div>
            <div className="text-[11px] text-slate-600 mt-2 font-sans space-y-0.5">
              <div>
                <strong>Date:</strong> {new Date(doc.issueDate).toLocaleDateString()}
              </div>
              <div>
                <strong>{isInvoice ? 'Due:' : 'Expires:'}</strong>{' '}
                {new Date(isInvoice ? doc.dueDate : doc.validUntil).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Entity Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs font-sans">
        <div className="border border-slate-300 p-4 rounded-lg bg-slate-50/50 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block border-b border-slate-200 pb-1 mb-2">
            ISSUING CORPORATION
          </span>
          <div className="font-bold text-slate-900 text-sm">{doc.organizationSnapshot?.name}</div>
          <div className="text-slate-600">{doc.organizationSnapshot?.email}</div>
          <div>{doc.organizationSnapshot?.address?.street}</div>
          <div>
            {[
              doc.organizationSnapshot?.address?.city,
              doc.organizationSnapshot?.address?.state,
              doc.organizationSnapshot?.address?.postalCode,
            ]
              .filter(Boolean)
              .join(', ')}
          </div>
          {doc.organizationSnapshot?.taxId && (
            <div className="font-mono text-slate-800 pt-1">VAT/Tax ID: {doc.organizationSnapshot.taxId}</div>
          )}
        </div>

        <div className="border border-slate-300 p-4 rounded-lg bg-slate-50/50 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block border-b border-slate-200 pb-1 mb-2">
            CLIENT RECIPIENT
          </span>
          <div className="font-bold text-slate-900 text-sm">{doc.clientSnapshot?.name}</div>
          <div className="text-slate-600">{doc.clientSnapshot?.email}</div>
          <div>{doc.clientSnapshot?.billingAddress?.street}</div>
          <div>
            {[
              doc.clientSnapshot?.billingAddress?.city,
              doc.clientSnapshot?.billingAddress?.state,
              doc.clientSnapshot?.billingAddress?.postalCode,
            ]
              .filter(Boolean)
              .join(', ')}
          </div>
          {doc.clientSnapshot?.taxId && (
            <div className="font-mono text-slate-800 pt-1">Client Tax Ref: {doc.clientSnapshot.taxId}</div>
          )}
        </div>
      </div>

      {/* Items Table with Corporate Dark Header */}
      <div className="font-sans">
        <table className="w-full text-left text-xs border border-slate-300">
          <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Description of Services</th>
              <th className="py-2.5 px-3 text-right">Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Rate</th>
              <th className="py-2.5 px-3 text-right">Tax</th>
              <th className="py-2.5 px-3 text-right">Amount ({currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {doc.items?.map((item: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <td className="py-3 px-3 font-medium text-slate-900">{item.description}</td>
                <td className="py-3 px-3 text-right text-slate-600">{item.quantity}</td>
                <td className="py-3 px-3 text-right text-slate-600">
                  {formatCurrency(item.unitPriceCents, currency)}
                </td>
                <td className="py-3 px-3 text-right text-slate-500">
                  {item.lineTaxCents > 0 ? formatCurrency(item.lineTaxCents, currency) : '—'}
                </td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">
                  {formatCurrency(item.lineTotalCents, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals & Notes */}
      <TotalsAndTerms doc={doc} currency={currency} isInvoice={isInvoice} color={color} />
    </div>
  );
}

// -------------------------------------------------------------
// 3. CREATIVE STUDIO TEMPLATE
// -------------------------------------------------------------
function CreativeStudioTemplate({ doc, type, docNumber, docTitle, currency, logoUrl, color }: any) {
  const isInvoice = type === 'invoice';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden print-page">
      {/* Top Banner with Accent Color */}
      <div style={{ backgroundColor: color.hex }} className="p-8 sm:p-10 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          <div>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-12 w-auto max-w-[180px] object-contain mb-3 bg-white p-1 rounded-xl shadow-xs"
              />
            ) : null}
            <div className="text-2xl font-black tracking-tight">{doc.organizationSnapshot?.name}</div>
            <div className="text-xs text-white/80 mt-1">{doc.organizationSnapshot?.email}</div>
          </div>

          <div className="sm:text-right bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/90">{docTitle}</span>
            <div className="text-2xl font-black text-white tracking-tight mt-0.5">{docNumber}</div>
            <div className="text-xs text-white/80 mt-2 space-y-0.5">
              <div>Issue: {new Date(doc.issueDate).toLocaleDateString()}</div>
              <div>{isInvoice ? 'Due' : 'Valid until'}: {new Date(isInvoice ? doc.dueDate : doc.validUntil).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-8 sm:p-12 space-y-8">
        {/* Recipient Metadata Card */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recipient Account</span>
            <div className="text-base font-bold text-slate-900 mt-1">{doc.clientSnapshot?.name}</div>
            <div className="text-xs text-slate-500 mt-1">{doc.clientSnapshot?.email}</div>
            {doc.clientSnapshot?.billingAddress?.street && (
              <div className="text-xs text-slate-500">{doc.clientSnapshot.billingAddress.street}</div>
            )}
          </div>
          <div className="sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Commitment</span>
            <div style={{ color: color.hex }} className="text-2xl font-black mt-1">
              {formatCurrency(doc.grandTotalCents, currency)}
            </div>
            {isInvoice && (
              <div className="text-xs text-slate-500 mt-1">
                Balance: {formatCurrency(doc.balanceDueCents, currency)}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table with Rounded Styling */}
        <LineItemsTable doc={doc} currency={currency} color={color} />

        {/* Totals */}
        <TotalsAndTerms doc={doc} currency={currency} isInvoice={isInvoice} color={color} />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Shared Sub-components: Line Items Table & Totals Block
// -------------------------------------------------------------
function LineItemsTable({ doc, currency, color }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">
          <tr>
            <th className="py-2.5 font-semibold">Description</th>
            <th className="py-2.5 font-semibold text-right">Qty</th>
            <th className="py-2.5 font-semibold text-right">Unit Price</th>
            <th className="py-2.5 font-semibold text-right">Discount</th>
            <th className="py-2.5 font-semibold text-right">Tax</th>
            <th className="py-2.5 font-semibold text-right">Line Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {doc.items?.map((item: any, i: number) => (
            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-4 pr-4">
                <div className="font-semibold text-slate-900">{item.description}</div>
              </td>
              <td className="py-4 px-2 text-right text-slate-600">{item.quantity}</td>
              <td className="py-4 px-2 text-right text-slate-600">
                {formatCurrency(item.unitPriceCents, currency)}
              </td>
              <td className="py-4 px-2 text-right text-slate-500">
                {item.discountCents > 0 ? `-${formatCurrency(item.discountCents, currency)}` : '—'}
              </td>
              <td className="py-4 px-2 text-right text-slate-500">
                {item.lineTaxCents > 0 ? formatCurrency(item.lineTaxCents, currency) : '—'}
              </td>
              <td className="py-4 pl-4 text-right font-bold text-slate-900">
                {formatCurrency(item.lineTotalCents, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TotalsAndTerms({ doc, currency, isInvoice, color }: any) {
  const wire =
    doc.organizationSnapshot?.wireInstructions || (doc.organizationId as any)?.wireInstructions;
  const hasBankDetails = Boolean(wire?.bankName || wire?.accountNumber || wire?.swiftCode);
  const wireLabels = getWireDisplayLabels(wire, currency);

  return (
    <div className="space-y-6 pt-4 border-t border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
        {/* Notes & Terms */}
        <div className="max-w-md space-y-4 text-xs text-slate-500">
          {doc.notes && (
            <div>
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Notes</div>
              <p className="whitespace-pre-line leading-relaxed">{doc.notes}</p>
            </div>
          )}
          {doc.terms && (
            <div>
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Terms & Conditions
              </div>
              <p className="whitespace-pre-line leading-relaxed">{doc.terms}</p>
            </div>
          )}
          {isInvoice && hasBankDetails && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-[11px]">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Bank Transfer Settlement Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
                {wire.bankName && (
                  <div>
                    <span className="text-slate-400">Bank: </span>
                    <span className="font-semibold text-slate-800">{wire.bankName}</span>
                  </div>
                )}
                {wire.accountName && (
                  <div>
                    <span className="text-slate-400">Beneficiary: </span>
                    <span className="font-semibold text-slate-800">{wire.accountName}</span>
                  </div>
                )}
                {wire.accountNumber && (
                  <div>
                    <span className="text-slate-400">{wireLabels.accountShortLabel}: </span>
                    <span className="font-mono font-semibold text-slate-800">{wire.accountNumber}</span>
                  </div>
                )}
                {wire.routingNumber && (
                  <div>
                    <span className="text-slate-400">{wireLabels.routingShortLabel}: </span>
                    <span className="font-mono font-semibold text-slate-800">{wire.routingNumber}</span>
                  </div>
                )}
                {wire.swiftCode && (
                  <div>
                    <span className="text-slate-400">SWIFT / BIC: </span>
                    <span className="font-mono font-semibold text-slate-800">{wire.swiftCode}</span>
                  </div>
                )}
              </div>
              {wire.instructions && (
                <p className="text-slate-500 pt-1 border-t border-slate-200/60 whitespace-pre-line">
                  {wire.instructions}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Calculation Totals */}
        <div className="w-full sm:w-72 space-y-2 text-xs">
          <div className="flex justify-between py-1 text-slate-600">
            <span>Subtotal:</span>
            <span className="font-medium text-slate-900">{formatCurrency(doc.subtotalCents, currency)}</span>
          </div>

          {doc.totalDiscountCents > 0 && (
            <div className="flex justify-between py-1 text-slate-600">
              <span>Discounts:</span>
              <span className="font-medium text-emerald-600">
                -{formatCurrency(doc.totalDiscountCents, currency)}
              </span>
            </div>
          )}

          {doc.totalTaxCents > 0 && (
            <div className="flex justify-between py-1 text-slate-600">
              <span>Tax Total:</span>
              <span className="font-medium text-slate-900">{formatCurrency(doc.totalTaxCents, currency)}</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-t border-slate-200 text-base font-bold text-slate-900">
            <span>Grand Total:</span>
            <span style={{ color: color.hex }}>{formatCurrency(doc.grandTotalCents, currency)}</span>
          </div>

          {isInvoice && (
            <>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-medium text-emerald-600">
                  {formatCurrency(doc.paidCents || 0, currency)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                <span>Balance Due:</span>
                <span className={doc.balanceDueCents > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                  {formatCurrency(doc.balanceDueCents, currency)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. AI CUSTOM BLUEPRINT TEMPLATE
// -------------------------------------------------------------
export function CustomBlueprintTemplate({
  doc,
  type,
  docNumber,
  currency,
  logoUrl,
  config,
}: {
  doc: any;
  type: 'invoice' | 'quote';
  docNumber: string;
  currency: string;
  logoUrl?: string;
  config: CustomTemplateConfig;
}) {
  const isInvoice = type === 'invoice';
  const { palette, labels } = config;

  // Pixel-faithful AI-generated HTML + Scoped CSS Renderer
  if (config.renderMode === 'html' && config.htmlTemplate) {
    const { html, scopedCss } = renderCustomHtmlDocument(config, doc, type);
    const customVars = {
      '--sc-primary': palette.primaryColor,
      '--sc-secondary': palette.secondaryColor,
      '--sc-header-text': palette.headerTextColor,
      '--sc-page-bg': palette.pageBackground,
      '--sc-surface': palette.surfaceTint,
      '--sc-border': palette.borderColor,
      '--sc-text': palette.textColor,
      '--sc-muted': palette.mutedTextColor,
      backgroundColor: palette.pageBackground,
      color: palette.textColor,
    } as React.CSSProperties;

    return (
      <div
        style={customVars}
        className="print-page sc-sheet-frame overflow-hidden bg-white rounded-xl border border-slate-200/80 shadow-sm"
      >
        {scopedCss ? <style>{scopedCss}</style> : null}
        <div
          className="sc-custom-doc w-full"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }

  const displayTitle = isInvoice
    ? labels.invoiceTitle || 'INVOICE'
    : labels.quoteTitle || 'QUOTE';

  const outerRadius =
    config.cornerRadius === 'none'
      ? 'rounded-none'
      : config.cornerRadius === 'rounded'
        ? 'rounded-3xl'
        : 'rounded-xl';
  const innerRadius =
    config.cornerRadius === 'none'
      ? 'rounded-none'
      : config.cornerRadius === 'rounded'
        ? 'rounded-2xl'
        : 'rounded-lg';
  const fontClass =
    config.fontStyle === 'serif'
      ? 'font-serif'
      : config.fontStyle === 'mono'
        ? 'font-mono'
        : 'font-sans';
  const headerCaseClass = config.uppercaseHeaders ? 'uppercase tracking-wider' : '';

  const accentBorderStyle: React.CSSProperties =
    config.pageAccentPosition === 'frame'
      ? {
          borderWidth: `${Math.min(6, config.accentWidthPx)}px`,
          borderStyle: 'solid',
          borderColor: palette.primaryColor,
        }
      : config.pageAccentPosition === 'left_bar'
        ? {
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: palette.borderColor,
            borderLeftWidth: `${config.accentWidthPx}px`,
            borderLeftColor: palette.primaryColor,
          }
        : {
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: palette.borderColor,
          };

  const org = doc.organizationSnapshot || {};
  const client = doc.clientSnapshot || {};
  const orgAddressLines = [
    org.address?.street,
    [org.address?.city, org.address?.state, org.address?.postalCode]
      .filter(Boolean)
      .join(', '),
    org.address?.country,
  ].filter(Boolean);
  const clientAddressLines = [
    client.billingAddress?.street,
    [client.billingAddress?.city, client.billingAddress?.state, client.billingAddress?.postalCode]
      .filter(Boolean)
      .join(', '),
    client.billingAddress?.country,
  ].filter(Boolean);

  const wire =
    doc.organizationSnapshot?.wireInstructions || (doc.organizationId as any)?.wireInstructions;
  const hasBankDetails = Boolean(wire?.bankName || wire?.accountNumber || wire?.swiftCode);
  const wireLabels = getWireDisplayLabels(wire, currency);
  const hasItemDiscounts = Array.isArray(doc.items)
    ? doc.items.some((item: any) => Number(item?.discountCents || 0) > 0)
    : false;

  const statusPill = isInvoice ? (
    <StatusBadge status={doc.status as InvoiceStatus} />
  ) : (
    <QuoteStatusBadge status={doc.status} />
  );

  const logoElement =
    logoUrl && config.logoPosition !== 'hidden' ? (
      <img
        src={logoUrl}
        alt={org.name || 'Logo'}
        className={`h-12 w-auto max-w-[180px] object-contain ${
          config.headerStyle === 'top_banner' ? 'bg-white/95 p-1.5 rounded-lg' : ''
        }`}
      />
    ) : null;

  const isBorderedGridTable = config.tableStyle === 'bordered_grid';
  const cellBorderStyle: React.CSSProperties = isBorderedGridTable
    ? { border: `1px solid ${palette.borderColor}` }
    : { borderBottom: `1px solid ${palette.borderColor}` };

  const theadStyle: React.CSSProperties =
    config.tableStyle === 'solid_header'
      ? { backgroundColor: palette.primaryColor, color: palette.headerTextColor }
      : config.tableStyle === 'minimal_lines'
        ? {
            backgroundColor: 'transparent',
            color: palette.secondaryColor,
            borderBottom: `2px solid ${palette.primaryColor}`,
          }
        : {
            backgroundColor: palette.surfaceTint,
            color: palette.secondaryColor,
            borderBottom: `1px solid ${palette.borderColor}`,
          };

  return (
    <div
      style={{
        backgroundColor: palette.pageBackground,
        color: palette.textColor,
        ...accentBorderStyle,
      }}
      className={`print-page overflow-hidden shadow-sm ${outerRadius} ${fontClass}`}
    >
      {/* Top Bar Accent (when configured and not covered by top_banner) */}
      {config.pageAccentPosition === 'top_bar' && config.headerStyle !== 'top_banner' && (
        <div
          style={{
            height: `${config.accentWidthPx}px`,
            backgroundColor: palette.primaryColor,
          }}
        />
      )}

      {/* TOP BANNER HEADER STYLE */}
      {config.headerStyle === 'top_banner' && (
        <div
          style={{
            backgroundColor: palette.primaryColor,
            color: palette.headerTextColor,
          }}
          className="px-8 sm:px-10 py-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
        >
          <div
            className={`flex items-center gap-4 ${
              config.logoPosition === 'right' ? 'sm:flex-row-reverse' : ''
            }`}
          >
            {logoElement}
            <div>
              <div className="text-xl font-bold tracking-tight">
                {org.name || 'Registered Business'}
              </div>
              <div className="text-xs opacity-85 mt-0.5 space-y-0.5">
                {org.email && <div>{org.email}</div>}
                {org.taxId && <div>Tax ID: {org.taxId}</div>}
              </div>
            </div>
          </div>

          <div className="sm:text-right">
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${headerCaseClass}`}>
              {displayTitle}
            </div>
            <div className="text-sm font-mono opacity-95 mt-0.5">{docNumber}</div>
            <div className="mt-2 inline-block">{statusPill}</div>
          </div>
        </div>
      )}

      <div className="p-8 sm:p-11 space-y-7">
        {/* OTHER HEADER STYLES */}
        {config.headerStyle === 'centered_editorial' && (
          <div
            style={{ borderColor: palette.borderColor }}
            className="text-center border-b pb-6 space-y-3"
          >
            {logoElement && <div className="flex justify-center">{logoElement}</div>}
            <div className="text-xl font-bold tracking-tight">{org.name || 'Registered Business'}</div>
            <div style={{ color: palette.mutedTextColor }} className="text-xs space-x-2">
              {org.email && <span>{org.email}</span>}
              {orgAddressLines.length > 0 && <span>• {orgAddressLines.join(', ')}</span>}
            </div>
            <div className="pt-2 flex flex-col items-center gap-1.5">
              <div
                style={{ color: palette.primaryColor }}
                className={`text-2xl font-extrabold ${headerCaseClass}`}
              >
                {displayTitle} <span className="font-mono">{docNumber}</span>
              </div>
              {statusPill}
            </div>
          </div>
        )}

        {config.headerStyle === 'minimal_grid' && (
          <div
            style={{ borderColor: palette.borderColor }}
            className={`grid grid-cols-1 sm:grid-cols-3 border ${innerRadius} overflow-hidden`}
          >
            <div
              style={{ borderColor: palette.borderColor }}
              className="p-4 sm:col-span-2 sm:border-r border-b sm:border-b-0 flex items-center gap-3"
            >
              {logoElement}
              <div>
                <div className="text-lg font-bold">{org.name || 'Registered Business'}</div>
                <div style={{ color: palette.mutedTextColor }} className="text-xs mt-0.5">
                  {org.email}
                  {org.taxId ? ` • Tax ID: ${org.taxId}` : ''}
                </div>
              </div>
            </div>
            <div
              style={{ backgroundColor: palette.surfaceTint }}
              className="p-4 flex flex-col justify-center sm:items-end"
            >
              <div
                style={{ color: palette.primaryColor }}
                className={`text-xs font-bold ${headerCaseClass}`}
              >
                {displayTitle}
              </div>
              <div className="text-lg font-bold font-mono mt-0.5">{docNumber}</div>
              <div className="mt-1.5">{statusPill}</div>
            </div>
          </div>
        )}

        {(config.headerStyle === 'split_classic' || config.headerStyle === 'left_stripe') && (
          <div
            style={{ borderColor: palette.borderColor }}
            className={`flex flex-col sm:flex-row justify-between items-start gap-6 border-b pb-7 ${
              config.headerStyle === 'left_stripe' ? 'pl-4' : ''
            }`}
          >
            <div
              style={
                config.headerStyle === 'left_stripe'
                  ? { borderLeft: `4px solid ${palette.primaryColor}`, paddingLeft: '14px' }
                  : undefined
              }
              className={`space-y-1.5 ${config.logoPosition === 'center' ? 'text-center w-full sm:w-auto' : ''}`}
            >
              {config.logoPosition !== 'right' && logoElement && (
                <div className="mb-2">{logoElement}</div>
              )}
              <div className="text-2xl font-bold tracking-tight">
                {org.name || 'Registered Business'}
              </div>
              <div style={{ color: palette.mutedTextColor }} className="text-xs space-y-0.5">
                {org.email && <div>{org.email}</div>}
                {orgAddressLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                {org.taxId && <div className="font-mono pt-0.5">Tax ID: {org.taxId}</div>}
              </div>
            </div>

            <div className="sm:text-right space-y-1.5">
              {config.logoPosition === 'right' && logoElement && (
                <div className="mb-2 flex sm:justify-end">{logoElement}</div>
              )}
              <div
                style={{ color: palette.primaryColor }}
                className={`text-3xl font-extrabold tracking-tight ${headerCaseClass}`}
              >
                {displayTitle}
              </div>
              <div className="text-sm font-mono font-semibold">{docNumber}</div>
              <div className="pt-1">{statusPill}</div>
            </div>
          </div>
        )}

        {/* METADATA + FROM / BILL TO BLOCK */}
        <div
          className={
            config.billToStyle === 'stacked'
              ? 'space-y-5'
              : 'grid grid-cols-1 sm:grid-cols-2 gap-5'
          }
        >
          {/* Left card: Bill To (plus From summary when header was top_banner / minimal_grid) */}
          <div
            style={
              config.billToStyle === 'boxed_cards'
                ? {
                    backgroundColor: palette.surfaceTint,
                    border: `1px solid ${palette.borderColor}`,
                  }
                : undefined
            }
            className={config.billToStyle === 'boxed_cards' ? `p-4 ${innerRadius} space-y-2` : 'space-y-1.5'}
          >
            <div
              style={{ color: palette.primaryColor }}
              className={`text-[11px] font-bold ${headerCaseClass}`}
            >
              {labels.billToLabel || 'Bill To'}
            </div>
            <div className="text-base font-bold">{client.name || 'Client'}</div>
            <div style={{ color: palette.mutedTextColor }} className="text-xs space-y-0.5">
              {client.email && <div>{client.email}</div>}
              {client.phone && <div>{client.phone}</div>}
              {clientAddressLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
              {client.taxId && <div className="font-mono pt-0.5">Tax ID: {client.taxId}</div>}
            </div>
          </div>

          {/* Right card: Dates & From Address when needed */}
          <div
            style={
              config.billToStyle === 'boxed_cards'
                ? {
                    backgroundColor: palette.surfaceTint,
                    border: `1px solid ${palette.borderColor}`,
                  }
                : undefined
            }
            className={`${
              config.billToStyle === 'boxed_cards' ? `p-4 ${innerRadius}` : ''
            } text-xs space-y-2 sm:text-right`}
          >
            {(config.headerStyle === 'top_banner' || config.headerStyle === 'minimal_grid') &&
              orgAddressLines.length > 0 && (
                <div className="pb-2 mb-2 border-b" style={{ borderColor: palette.borderColor }}>
                  <div
                    style={{ color: palette.mutedTextColor }}
                    className={`text-[10px] font-bold ${headerCaseClass} mb-0.5`}
                  >
                    {labels.fromLabel || 'From'}
                  </div>
                  <div style={{ color: palette.mutedTextColor }}>{orgAddressLines.join(', ')}</div>
                </div>
              )}

            <div className="flex sm:justify-end justify-between gap-4">
              <span style={{ color: palette.mutedTextColor }}>Issue Date:</span>
              <span className="font-semibold">
                {new Date(doc.issueDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex sm:justify-end justify-between gap-4">
              <span style={{ color: palette.mutedTextColor }}>
                {isInvoice ? 'Due Date:' : 'Valid Until:'}
              </span>
              <span className="font-semibold">
                {new Date(isInvoice ? doc.dueDate : doc.validUntil).toLocaleDateString()}
              </span>
            </div>
            <div className="flex sm:justify-end justify-between gap-4">
              <span style={{ color: palette.mutedTextColor }}>Currency:</span>
              <span className="font-mono font-semibold">{currency}</span>
            </div>
          </div>
        </div>

        {/* LINE ITEMS TABLE */}
        <div
          className={`overflow-x-auto ${innerRadius}`}
          style={
            isBorderedGridTable
              ? { border: `1px solid ${palette.borderColor}` }
              : undefined
          }
        >
          <table className="w-full text-left text-sm border-collapse">
            <thead style={theadStyle} className={`text-[11px] font-bold ${headerCaseClass}`}>
              <tr>
                {config.showItemIndex && (
                  <th className="py-2.5 px-3 w-10" style={isBorderedGridTable ? cellBorderStyle : undefined}>
                    #
                  </th>
                )}
                <th className="py-2.5 px-3" style={isBorderedGridTable ? cellBorderStyle : undefined}>
                  {labels.itemColumnLabel || 'Description'}
                </th>
                <th
                  className="py-2.5 px-3 text-right"
                  style={isBorderedGridTable ? cellBorderStyle : undefined}
                >
                  {labels.quantityColumnLabel || 'Qty'}
                </th>
                <th
                  className="py-2.5 px-3 text-right"
                  style={isBorderedGridTable ? cellBorderStyle : undefined}
                >
                  {labels.priceColumnLabel || 'Rate'}
                </th>
                {hasItemDiscounts && (
                  <th
                    className="py-2.5 px-3 text-right"
                    style={isBorderedGridTable ? cellBorderStyle : undefined}
                  >
                    {labels.discountLabel || 'Discount'}
                  </th>
                )}
                <th
                  className="py-2.5 px-3 text-right"
                  style={isBorderedGridTable ? cellBorderStyle : undefined}
                >
                  {labels.taxColumnLabel || 'Tax'}
                </th>
                <th
                  className="py-2.5 px-3 text-right"
                  style={isBorderedGridTable ? cellBorderStyle : undefined}
                >
                  {labels.totalColumnLabel || 'Amount'}
                </th>
              </tr>
            </thead>
            <tbody>
              {(doc.items || []).map((item: any, idx: number) => (
                <tr
                  key={idx}
                  style={{
                    backgroundColor:
                      config.rowStriping && idx % 2 === 1 ? palette.surfaceTint : 'transparent',
                  }}
                >
                  {config.showItemIndex && (
                    <td
                      className="py-3 px-3 text-xs font-mono"
                      style={{ ...cellBorderStyle, color: palette.mutedTextColor }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                  )}
                  <td className="py-3 px-3 font-medium" style={cellBorderStyle}>
                    {item.description}
                  </td>
                  <td
                    className="py-3 px-3 text-right font-mono text-xs"
                    style={{ ...cellBorderStyle, color: palette.mutedTextColor }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    className="py-3 px-3 text-right font-mono text-xs"
                    style={{ ...cellBorderStyle, color: palette.mutedTextColor }}
                  >
                    {formatCurrency(item.unitPriceCents, currency)}
                  </td>
                  {hasItemDiscounts && (
                    <td
                      className="py-3 px-3 text-right font-mono text-xs"
                      style={{ ...cellBorderStyle, color: palette.mutedTextColor }}
                    >
                      {item.discountCents > 0
                        ? `-${formatCurrency(item.discountCents, currency)}`
                        : '—'}
                    </td>
                  )}
                  <td
                    className="py-3 px-3 text-right font-mono text-xs"
                    style={{ ...cellBorderStyle, color: palette.mutedTextColor }}
                  >
                    {item.lineTaxCents > 0 ? formatCurrency(item.lineTaxCents, currency) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold font-mono text-xs" style={cellBorderStyle}>
                    {formatCurrency(item.lineTotalCents, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS, NOTES & BANK SETTLEMENT */}
        <div
          className={`flex gap-7 pt-2 ${
            config.totalsPosition === 'full_width'
              ? 'flex-col-reverse'
              : 'flex-col sm:flex-row justify-between items-start'
          }`}
        >
          {/* Left column: Notes, Terms, Bank Settlement */}
          <div className="space-y-4 text-xs flex-1 max-w-lg">
            {doc.notes && (
              <div>
                <div
                  style={{ color: palette.mutedTextColor }}
                  className={`font-bold text-[10px] mb-1 ${headerCaseClass}`}
                >
                  {labels.notesLabel || 'Notes'}
                </div>
                <p className="whitespace-pre-line leading-relaxed" style={{ color: palette.mutedTextColor }}>
                  {doc.notes}
                </p>
              </div>
            )}
            {doc.terms && (
              <div>
                <div
                  style={{ color: palette.mutedTextColor }}
                  className={`font-bold text-[10px] mb-1 ${headerCaseClass}`}
                >
                  Terms & Conditions
                </div>
                <p className="whitespace-pre-line leading-relaxed" style={{ color: palette.mutedTextColor }}>
                  {doc.terms}
                </p>
              </div>
            )}
            {isInvoice && hasBankDetails && config.showPaymentInstructions && (
              <div
                style={{
                  backgroundColor: palette.surfaceTint,
                  border: `1px solid ${palette.borderColor}`,
                }}
                className={`p-3.5 ${innerRadius} space-y-2 text-[11px]`}
              >
                <div
                  style={{ color: palette.secondaryColor }}
                  className={`font-bold text-[10px] ${headerCaseClass}`}
                >
                  {labels.paymentInstructionsLabel || 'Payment Instructions'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {wire.bankName && (
                    <div>
                      <span style={{ color: palette.mutedTextColor }}>Bank: </span>
                      <span className="font-semibold">{wire.bankName}</span>
                    </div>
                  )}
                  {wire.accountName && (
                    <div>
                      <span style={{ color: palette.mutedTextColor }}>Beneficiary: </span>
                      <span className="font-semibold">{wire.accountName}</span>
                    </div>
                  )}
                  {wire.accountNumber && (
                    <div>
                      <span style={{ color: palette.mutedTextColor }}>
                        {wireLabels.accountShortLabel}:{' '}
                      </span>
                      <span className="font-mono font-semibold">{wire.accountNumber}</span>
                    </div>
                  )}
                  {wire.routingNumber && (
                    <div>
                      <span style={{ color: palette.mutedTextColor }}>
                        {wireLabels.routingShortLabel}:{' '}
                      </span>
                      <span className="font-mono font-semibold">{wire.routingNumber}</span>
                    </div>
                  )}
                  {wire.swiftCode && (
                    <div>
                      <span style={{ color: palette.mutedTextColor }}>SWIFT / BIC: </span>
                      <span className="font-mono font-semibold">{wire.swiftCode}</span>
                    </div>
                  )}
                </div>
                {wire.instructions && (
                  <p
                    style={{
                      color: palette.mutedTextColor,
                      borderTop: `1px solid ${palette.borderColor}`,
                    }}
                    className="pt-1.5 whitespace-pre-line"
                  >
                    {wire.instructions}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right/Full totals summary */}
          <div
            style={
              config.totalsStyle !== 'clean_lines'
                ? {
                    backgroundColor: palette.surfaceTint,
                    border: `1px solid ${palette.borderColor}`,
                  }
                : undefined
            }
            className={`${
              config.totalsPosition === 'full_width' ? 'w-full' : 'w-full sm:w-72 shrink-0'
            } ${config.totalsStyle !== 'clean_lines' ? `${innerRadius} overflow-hidden` : ''} text-xs`}
          >
            <div className={config.totalsStyle !== 'clean_lines' ? 'p-4 space-y-2' : 'space-y-2'}>
              <div className="flex justify-between py-0.5">
                <span style={{ color: palette.mutedTextColor }}>
                  {labels.subtotalLabel || 'Subtotal'}
                </span>
                <span className="font-mono font-semibold">
                  {formatCurrency(doc.subtotalCents, currency)}
                </span>
              </div>

              {doc.totalDiscountCents > 0 && (
                <div className="flex justify-between py-0.5">
                  <span style={{ color: palette.mutedTextColor }}>
                    {labels.discountLabel || 'Discount'}
                  </span>
                  <span className="font-mono font-semibold text-emerald-600">
                    -{formatCurrency(doc.totalDiscountCents, currency)}
                  </span>
                </div>
              )}

              {doc.totalTaxCents > 0 && (
                <div className="flex justify-between py-0.5">
                  <span style={{ color: palette.mutedTextColor }}>
                    {labels.taxLabel || 'Tax'}
                  </span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(doc.totalTaxCents, currency)}
                  </span>
                </div>
              )}

              {config.totalsStyle !== 'highlight_box' && (
                <div
                  style={{ borderTop: `2px solid ${palette.primaryColor}` }}
                  className="flex justify-between items-center pt-2.5 mt-1 text-base font-bold"
                >
                  <span>{labels.grandTotalLabel || 'Total Due'}</span>
                  <span style={{ color: palette.primaryColor }} className="font-mono">
                    {formatCurrency(doc.grandTotalCents, currency)}
                  </span>
                </div>
              )}

              {isInvoice && (
                <div
                  style={{ borderColor: palette.borderColor }}
                  className="pt-2 border-t space-y-1 text-[11px]"
                >
                  <div className="flex justify-between">
                    <span style={{ color: palette.mutedTextColor }}>Amount Paid</span>
                    <span className="font-mono font-medium text-emerald-600">
                      {formatCurrency(doc.paidCents || 0, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-xs">
                    <span>Balance Due</span>
                    <span className="font-mono">
                      {formatCurrency(doc.balanceDueCents ?? doc.grandTotalCents, currency)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {config.totalsStyle === 'highlight_box' && (
              <div
                style={{
                  backgroundColor: palette.primaryColor,
                  color: palette.headerTextColor,
                }}
                className="px-4 py-3 flex justify-between items-center text-sm font-bold"
              >
                <span>{labels.grandTotalLabel || 'Total Due'}</span>
                <span className="font-mono text-base">
                  {formatCurrency(doc.grandTotalCents, currency)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Tagline */}
        {labels.footerTagline && (
          <div
            style={{
              borderTop: `1px solid ${palette.borderColor}`,
              color: palette.mutedTextColor,
            }}
            className="pt-4 text-center text-[11px]"
          >
            {labels.footerTagline}
          </div>
        )}
      </div>
    </div>
  );
}

