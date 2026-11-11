'use client';

import React, { useState } from 'react';
import {
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Palette,
  Layout,
  Check,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { QuoteStatusBadge } from '@/components/QuoteStatusBadge';
import { formatCurrency } from '@/engine/calculator';
import { getWireDisplayLabels } from '@/lib/banking-regions';
import { InvoiceStatus } from '@/engine/state-machine';

export type TemplateTheme = 'modern' | 'corporate' | 'creative';
export type AccentColor = '#2563eb' | '#059669' | '#4f46e5' | '#0f172a' | '#d97706';

interface DocumentTemplateViewProps {
  doc: any;
  type: 'invoice' | 'quote';
  showControls?: boolean;
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
}: DocumentTemplateViewProps) {
  const [theme, setTheme] = useState<TemplateTheme>('modern');
  const [accentColor, setAccentColor] = useState<AccentColor>(
    (doc?.organizationSnapshot?.branding?.primaryColor as AccentColor) || '#2563eb'
  );

  if (!doc) return null;

  const isInvoice = type === 'invoice';
  const docNumber = isInvoice ? doc.invoiceNumber : doc.quoteNumber;
  const docTitle = isInvoice ? 'INVOICE' : 'PROPOSAL / ESTIMATE';
  const currency = doc.currency || doc.organizationSnapshot?.currency || 'USD';
  const logoUrl =
    doc.organizationSnapshot?.branding?.logoUrl ||
    (doc.organizationId as any)?.branding?.logoUrl;

  const currentColor =
    ACCENT_COLORS.find((c) => c.hex.toLowerCase() === accentColor.toLowerCase()) || ACCENT_COLORS[0];

  return (
    <div className="space-y-4">
      {/* Interactive Template & Accent Color Controls (Hidden in Print) */}
      {showControls && (
        <div className="no-print bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          {/* Theme Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Layout className="w-3.5 h-3.5 text-slate-400" />
              <span>Theme:</span>
            </span>
            {(
              [
                { id: 'modern', label: 'Modern Clean' },
                { id: 'corporate', label: 'Corporate Formal' },
                { id: 'creative', label: 'Creative Studio' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  theme === t.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Color Palette Selector */}
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
        </div>
      )}

      {/* Render Document based on Theme */}
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

