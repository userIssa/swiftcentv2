'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  FileText,
  Printer,
  ArrowLeft,
  Building,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  ShieldCheck,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { QuoteStatusBadge } from '@/components/QuoteStatusBadge';
import { formatCurrency } from '@/engine/calculator';
import { getWireDisplayLabels } from '@/lib/banking-regions';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';

export default function ClientStatementPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStatement() {
      try {
        setLoading(true);
        const data = await fetchJsonWithBuffer(`/api/portal/statement/${token}`, {
          timeoutMs: 15000,
          retry: true,
        });
        if (data.success && data.statement) {
          setStatement(data.statement);
        } else {
          setError(data.error || 'Statement unavailable');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadStatement();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading account statement...</p>
        </div>
      </div>
    );
  }

  if (error || !statement) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md w-full shadow-sm">
          <Receipt className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Statement Unavailable</h2>
          <p className="text-xs text-slate-500 mt-1">{error || 'This link may have expired or is invalid.'}</p>
        </div>
      </div>
    );
  }

  const { organization: org, client, invoices, quotes, summary } = statement;
  const currency = org.currency || 'USD';
  const logoUrl = org.branding?.logoUrl;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation / Action Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <Link
            href={`/portal/${token}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Document</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print / Save PDF</span>
          </button>
        </div>

        {/* Statement Sheet */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-12 print-page space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-8">
            <div>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={org.name}
                  className="h-12 w-auto max-w-[200px] object-contain mb-3"
                />
              ) : null}
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{org.name}</h1>
              <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                <div>{org.email}</div>
                {org.address?.street && <div>{org.address.street}</div>}
                {(org.address?.city || org.address?.state || org.address?.postalCode) && (
                  <div>
                    {[org.address.city, org.address.state, org.address.postalCode].filter(Boolean).join(', ')}
                  </div>
                )}
                {org.address?.country && <div>{org.address.country}</div>}
                {org.taxId && <div className="pt-1 font-medium text-slate-700">Tax ID: {org.taxId}</div>}
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Official Account Statement
              </span>
              <div className="text-xs text-slate-500 pt-3">
                <span className="font-semibold text-slate-700">Statement Date:</span>{' '}
                {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
              </div>
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Currency:</span> {currency}
              </div>
            </div>
          </div>

          {/* Statement Account Recipient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Account Holder
              </div>
              <div className="text-base font-bold text-slate-900">{client.name}</div>
              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                <div>{client.email}</div>
                {client.billingAddress?.street && <div>{client.billingAddress.street}</div>}
                {(client.billingAddress?.city || client.billingAddress?.state || client.billingAddress?.postalCode) && (
                  <div>
                    {[client.billingAddress.city, client.billingAddress.state, client.billingAddress.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {client.billingAddress?.country && <div>{client.billingAddress.country}</div>}
                {client.taxId && <div className="font-medium text-slate-700 pt-0.5">Tax ID: {client.taxId}</div>}
              </div>
            </div>

            <div className="sm:text-right flex flex-col justify-end">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Outstanding Balance Due
              </div>
              <div
                className={`text-2xl font-extrabold tracking-tight ${
                  summary.totalBalanceCents > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(summary.totalBalanceCents, currency)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {summary.totalBalanceCents > 0 ? 'Pending payment settlement' : 'Account fully in good standing'}
              </p>
            </div>
          </div>

          {/* 3 Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Invoiced
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900">
                {formatCurrency(summary.totalInvoicedCents, currency)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{summary.invoiceCount} issued invoices</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Cleared
              </div>
              <div className="mt-2 text-xl font-bold text-emerald-600">
                {formatCurrency(summary.totalPaidCents, currency)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Payments cleared</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Balance Due
              </div>
              <div className="mt-2 text-xl font-bold text-amber-600">
                {formatCurrency(summary.totalBalanceCents, currency)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Awaiting settlement</p>
            </div>
          </div>

          {/* Invoices Ledger Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>Invoice Ledger ({invoices.length})</span>
              </h2>
            </div>

            {invoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No invoices recorded for this account.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-2.5 font-semibold">Issue Date</th>
                      <th className="pb-2.5 font-semibold">Invoice #</th>
                      <th className="pb-2.5 font-semibold">Due Date</th>
                      <th className="pb-2.5 font-semibold">Status</th>
                      <th className="pb-2.5 font-semibold text-right">Total</th>
                      <th className="pb-2.5 font-semibold text-right">Paid</th>
                      <th className="pb-2.5 font-semibold text-right">Balance</th>
                      <th className="pb-2.5 font-semibold text-right no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv: any) => (
                      <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 text-slate-500 font-medium">
                          {new Date(inv.issueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-3 text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td className="py-3">
                          <StatusBadge status={inv.status} size="sm" />
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          {formatCurrency(inv.grandTotalCents, currency)}
                        </td>
                        <td className="py-3 text-right text-emerald-600 font-semibold">
                          {formatCurrency(inv.paidCents, currency)}
                        </td>
                        <td className="py-3 text-right font-semibold text-amber-600">
                          {formatCurrency(inv.balanceDueCents, currency)}
                        </td>
                        <td className="py-3 text-right no-print">
                          <Link
                            href={`/portal/${inv.publicAccessToken}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Proposals & Quotes Table */}
          {quotes.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-indigo-600" />
                  <span>Proposals & Estimates ({quotes.length})</span>
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-2.5 font-semibold">Date</th>
                      <th className="pb-2.5 font-semibold">Proposal #</th>
                      <th className="pb-2.5 font-semibold">Valid Until</th>
                      <th className="pb-2.5 font-semibold">Status</th>
                      <th className="pb-2.5 font-semibold text-right">Estimate Total</th>
                      <th className="pb-2.5 font-semibold text-right no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quotes.map((q: any) => (
                      <tr key={q._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 text-slate-500 font-medium">
                          {new Date(q.issueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-bold text-slate-900">{q.quoteNumber}</td>
                        <td className="py-3 text-slate-500">{new Date(q.validUntil).toLocaleDateString()}</td>
                        <td className="py-3">
                          <QuoteStatusBadge status={q.status} />
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          {formatCurrency(q.grandTotalCents, currency)}
                        </td>
                        <td className="py-3 text-right no-print">
                          <Link
                            href={`/portal/quotes/${q.publicAccessToken}`}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-[11px]"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Global Bank Transfer Settlement Instructions */}
          {(org.wireInstructions?.bankName || org.wireInstructions?.accountNumber) &&
            summary.totalBalanceCents > 0 && (() => {
              const wireLabels = getWireDisplayLabels(org.wireInstructions, currency);
              return (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>Bank Transfer & Settlement Instructions</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    To settle outstanding account balances via local transfer or international wire, please reference{' '}
                    <span className="font-semibold text-slate-800">{client.name}</span>.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    {org.wireInstructions.bankName && (
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Bank Name</div>
                        <div className="font-semibold text-slate-800">{org.wireInstructions.bankName}</div>
                      </div>
                    )}
                    {org.wireInstructions.accountName && (
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Beneficiary Name</div>
                        <div className="font-semibold text-slate-800">{org.wireInstructions.accountName}</div>
                      </div>
                    )}
                    {org.wireInstructions.accountNumber && (
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {wireLabels.accountShortLabel}
                        </div>
                        <div className="font-semibold text-slate-800 font-mono">
                          {org.wireInstructions.accountNumber}
                        </div>
                      </div>
                    )}
                    {org.wireInstructions.routingNumber && (
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {wireLabels.routingShortLabel}
                        </div>
                        <div className="font-semibold text-slate-800 font-mono">
                          {org.wireInstructions.routingNumber}
                        </div>
                      </div>
                    )}
                    {org.wireInstructions.swiftCode && (
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">SWIFT / BIC</div>
                        <div className="font-semibold text-slate-800 font-mono">
                          {org.wireInstructions.swiftCode}
                        </div>
                      </div>
                    )}
                  </div>
                  {org.wireInstructions.instructions && (
                    <p className="text-xs text-slate-500 pt-2 border-t border-slate-200/70 whitespace-pre-line">
                      {org.wireInstructions.instructions}
                    </p>
                  )}
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
}

