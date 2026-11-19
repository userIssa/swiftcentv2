'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Printer,
  CreditCard,
  Lock,
  Building,
  Check,
  FileText,
  Copy,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { DocumentTemplateView } from '@/components/DocumentTemplateView';
import { PortalViewport } from '@/components/PortalViewport';
import { formatCurrency } from '@/engine/calculator';
import { InvoiceStatus } from '@/engine/state-machine';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';

export default function ClientPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const data = await fetchJsonWithBuffer(`/api/portal/${token}`, {
        timeoutMs: 15000,
        retry: true,
      });
      if (data.success && data.invoice) {
        setInvoice(data.invoice);
      } else {
        setError(data.error || 'Invoice not found');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [token]);

  const handlePayButtonClick = async () => {
    try {
      const res = await fetch(`/api/portal/${token}/checkout`, { method: 'POST' });
      const data = await res.json();
      if (data.success && !data.useMock && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setShowCheckout(true);
      }
    } catch {
      setShowCheckout(true);
    }
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    try {
      setPaying(true);
      const res = await fetch(`/api/invoices/${invoice._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: invoice.balanceDueCents,
          paymentMethod: 'stripe',
          transactionReference: `pm_card_${Math.random().toString(36).substring(7)}`,
          actor: 'client_portal',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCheckout(false);
        setPaidSuccess(true);
        await fetchInvoice();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <PortalViewport className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading secure invoice...</p>
        </div>
      </PortalViewport>
    );
  }

  if (error || !invoice) {
    return (
      <PortalViewport className="flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md w-full shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Invoice Unavailable</h2>
          <p className="text-xs text-slate-500 mt-1">
            {error || 'The link may have expired or is incorrect. Please contact the issuer.'}
          </p>
        </div>
      </PortalViewport>
    );
  }

  const isPaid = invoice.status === 'paid' || invoice.balanceDueCents === 0;
  const isOnlinePaymentAllowed = invoice.paymentMethodOption !== 'bank_transfer';
  const isBankTransferAllowed = invoice.paymentMethodOption !== 'online';
  const wire =
    invoice.organizationSnapshot?.wireInstructions || (invoice.organizationId as any)?.wireInstructions;
  const hasBankDetails = Boolean(wire?.bankName || wire?.accountNumber || wire?.swiftCode);
  const orgLogoUrl = invoice.organizationSnapshot?.branding?.logoUrl || (invoice.organizationId as any)?.branding?.logoUrl;

  return (
    <PortalViewport className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Floating Action Bar - hidden in print */}
        <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {orgLogoUrl ? (
              <img
                src={orgLogoUrl}
                alt={invoice.organizationSnapshot?.name || 'Business Logo'}
                className="w-10 h-10 object-contain rounded border border-slate-200 bg-white p-1"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {invoice.organizationSnapshot?.name?.substring(0, 2).toUpperCase() || 'SC'}
              </div>
            )}
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Invoice from {invoice.organizationSnapshot?.name || 'SwiftCent'}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-bit Encrypted Secure Portal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/portal/statement/${token}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              title="View full account statement and document history"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Statement</span>
            </Link>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / Download PDF</span>
            </button>

            {!isPaid && (
              <div className="flex items-center gap-2">
                {isOnlinePaymentAllowed && (
                  <button
                    onClick={handlePayButtonClick}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay {formatCurrency(invoice.balanceDueCents, invoice.currency)}</span>
                  </button>
                )}
                {isBankTransferAllowed && hasBankDetails && (
                  <button
                    onClick={() => setShowBankModal(true)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                      isOnlinePaymentAllowed
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <Building className={`w-3.5 h-3.5 ${isOnlinePaymentAllowed ? 'text-slate-600' : 'text-sky-400'}`} />
                    <span>Bank Details</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Callout Banner */}
        {isPaid ? (
          <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Paid in full.</span> Thank you for your prompt payment! A copy of this receipt has been recorded.
            </div>
          </div>
        ) : (
          <div className="no-print bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-bold">Payment Due:</span> This invoice is due on{' '}
              <span className="font-semibold">{new Date(invoice.dueDate).toLocaleDateString()}</span>.
              {!isOnlinePaymentAllowed ? (
                <span className="ml-1 text-blue-800 font-medium">
                  Settlement via <strong>Direct Bank Transfer</strong> to the issuer's company account.
                </span>
              ) : (
                <span className="ml-1 text-slate-600">
                  Balance due: <strong>{formatCurrency(invoice.balanceDueCents, invoice.currency)}</strong>.
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isOnlinePaymentAllowed ? (
                <button
                  onClick={() => setShowCheckout(true)}
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Pay Online</span>
                </button>
              ) : hasBankDetails ? (
                <button
                  onClick={() => setShowBankModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>View Bank Details</span>
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Dedicated Bank Settlement Card for Bank Transfer Only Documents */}
        {!isOnlinePaymentAllowed && hasBankDetails && !isPaid && (
          <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Direct Bank Transfer Settlement</h3>
                  <p className="text-xs text-slate-500">
                    Online card checkout is disabled for this invoice. Please wire balance due to the account below.
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-slate-400 block">Balance Due</span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatCurrency(invoice.balanceDueCents, invoice.currency)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {wire.bankName && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium block">Bank Name</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{wire.bankName}</span>
                </div>
              )}

              {wire.accountName && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium block">Account Beneficiary</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{wire.accountName}</span>
                </div>
              )}

              {wire.accountNumber && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Account Number / IBAN</span>
                    <span className="text-xs font-mono font-bold text-slate-900 block mt-0.5">{wire.accountNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(wire.accountNumber, 'accountNumber')}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Copy Account Number"
                  >
                    {copiedField === 'accountNumber' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {wire.routingNumber && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Routing / Sort Code</span>
                    <span className="text-xs font-mono font-bold text-slate-900 block mt-0.5">{wire.routingNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(wire.routingNumber, 'routingNumber')}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Copy Routing Number"
                  >
                    {copiedField === 'routingNumber' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {wire.swiftCode && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">SWIFT / BIC Code</span>
                    <span className="text-xs font-mono font-bold text-slate-900 block mt-0.5">{wire.swiftCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(wire.swiftCode, 'swiftCode')}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Copy SWIFT Code"
                  >
                    {copiedField === 'swiftCode' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-600 font-medium block">Narration / Reference</span>
                  <span className="text-xs font-mono font-bold text-blue-950 block mt-0.5">
                    {invoice.invoiceNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(invoice.invoiceNumber, 'invoiceRef')}
                  className="p-1.5 rounded-lg bg-white border border-blue-200 hover:bg-blue-100/60 text-blue-700 transition-colors cursor-pointer"
                  title="Copy Invoice Reference"
                >
                  {copiedField === 'invoiceRef' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {wire.instructions && (
              <div className="text-xs text-slate-500 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">Instructions:</span>
                <p className="whitespace-pre-line leading-relaxed">{wire.instructions}</p>
              </div>
            )}
          </div>
        )}

        {/* Live Customizable Invoice Document (Printable) */}
        <DocumentTemplateView doc={invoice} type="invoice" showControls={true} />
      </div>

      {/* Embedded Secure Payment Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Secure Payment Checkout</h3>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-medium"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              {orgLogoUrl ? (
                <img
                  src={orgLogoUrl}
                  alt={invoice.organizationSnapshot?.name || 'Business Logo'}
                  className="h-8 w-auto max-w-[140px] object-contain mx-auto mb-2"
                />
              ) : null}
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Amount to Pay
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {formatCurrency(invoice.balanceDueCents, invoice.currency)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Paying <span className="font-semibold text-slate-700">{invoice.organizationSnapshot?.name || 'SwiftCent'}</span> • Invoice {invoice.invoiceNumber}
              </div>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  defaultValue={invoice.clientSnapshot?.name}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4242 •••• •••• 4242"
                    defaultValue="4242 4242 4242 4242"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expires</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    defaultValue="12/28"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">CVC</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="123"
                    defaultValue="123"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={paying}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {paying
                    ? 'Authorizing payment...'
                    : `Authorize ${formatCurrency(invoice.balanceDueCents, invoice.currency)}`}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Bank Transfer Settlement Modal */}
      {showBankModal && hasBankDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900">Company Bank Settlement Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBankModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider block">
                  Amount to Transfer
                </span>
                <span className="text-2xl font-black text-blue-950 mt-0.5 block">
                  {formatCurrency(invoice.balanceDueCents, invoice.currency)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider block">
                  Beneficiary
                </span>
                <span className="text-xs font-bold text-blue-900 mt-0.5 block">
                  {wire.accountName || invoice.organizationSnapshot?.name}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {wire.bankName && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Bank Name</span>
                    <span className="text-xs font-bold text-slate-800">{wire.bankName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(wire.bankName, 'mBankName')}
                    className="p-1 rounded bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 cursor-pointer"
                  >
                    {copiedField === 'mBankName' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {wire.accountNumber && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Account Number / IBAN</span>
                    <span className="text-sm font-mono font-bold text-slate-900">{wire.accountNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(wire.accountNumber, 'mAccountNumber')}
                    className="p-1 rounded bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 cursor-pointer"
                  >
                    {copiedField === 'mAccountNumber' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {wire.routingNumber && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Routing / Sort Code</span>
                    <span className="text-xs font-mono font-bold text-slate-900">{wire.routingNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(wire.routingNumber, 'mRouting')}
                    className="p-1 rounded bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 cursor-pointer"
                  >
                    {copiedField === 'mRouting' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {wire.swiftCode && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">SWIFT / BIC</span>
                    <span className="text-xs font-mono font-bold text-slate-900">{wire.swiftCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(wire.swiftCode, 'mSwift')}
                    className="p-1 rounded bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 cursor-pointer"
                  >
                    {copiedField === 'mSwift' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-600 font-medium block">Transfer Reference (Invoice #)</span>
                  <span className="text-xs font-mono font-bold text-blue-950">{invoice.invoiceNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(invoice.invoiceNumber, 'mInvRef')}
                  className="p-1 rounded bg-white border border-blue-200 text-blue-700 text-xs hover:bg-blue-100/60 cursor-pointer"
                >
                  {copiedField === 'mInvRef' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {wire.instructions && (
              <p className="text-xs text-slate-500 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100">
                {wire.instructions}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowBankModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              Done / Got It
            </button>
          </div>
        </div>
      )}
    </PortalViewport>
  );
}

