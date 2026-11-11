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
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { DocumentTemplateView } from '@/components/DocumentTemplateView';
import { formatCurrency } from '@/engine/calculator';
import { InvoiceStatus } from '@/engine/state-machine';

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
  const [paidSuccess, setPaidSuccess] = useState(false);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/portal/${token}`);
      const data = await res.json();
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading secure invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md w-full shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Invoice Unavailable</h2>
          <p className="text-xs text-slate-500 mt-1">
            {error || 'The link may have expired or is incorrect. Please contact the issuer.'}
          </p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid' || invoice.balanceDueCents === 0;
  const orgLogoUrl = invoice.organizationSnapshot?.branding?.logoUrl || (invoice.organizationId as any)?.branding?.logoUrl;

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
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
              <button
                onClick={handlePayButtonClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay {formatCurrency(invoice.balanceDueCents, invoice.currency)}</span>
              </button>
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
          <div className="no-print bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="text-xs">
              <span className="font-bold">Payment Due:</span> This invoice is due on{' '}
              <span className="font-semibold">{new Date(invoice.dueDate).toLocaleDateString()}</span>.
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>Pay Online</span>
            </button>
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
    </div>
  );
}

