'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  CreditCard,
  Printer,
  Copy,
  Check,
  Ban,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileText,
  Trash2,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { SendDocumentModal } from '@/components/SendDocumentModal';
import { DocumentTemplateView } from '@/components/DocumentTemplateView';
import { CurrencySelect } from '@/components/CurrencySelect';
import { SearchableCombobox } from '@/components/SearchableCombobox';
import { formatCurrency } from '@/engine/calculator';
import { getCurrencySymbol } from '@/lib/currencies';
import { PAYMENT_METHOD_OPTIONS } from '@/lib/combobox-options';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';
import { InvoiceStatus, isInvoiceLocked } from '@/engine/state-machine';

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Payment Form state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'credit_card' | 'bank_transfer' | 'cash' | 'manual'>('stripe');
  const [transactionRef, setTransactionRef] = useState('');

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await fetchJsonWithBuffer(`/api/invoices/${id}`, {
        timeoutMs: 15000,
        retry: true,
      });
      if (data.success && data.invoice) {
        setInvoice(data.invoice);
        setPaymentAmount((data.invoice.balanceDueCents / 100).toFixed(2));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const handleMarkSent = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/invoices/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'admin' }),
      });
      const data = await res.json();
      if (data.success) {
        await loadInvoice();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCurrencyChange = async (nextCurrency: string) => {
    if (!invoice || nextCurrency === invoice.currency) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: nextCurrency, actor: 'admin' }),
      });
      const data = await res.json();
      if (data.success) {
        await loadInvoice();
      } else {
        alert(data.error || 'Failed to update invoice currency');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(paymentAmount || '0') * 100);
    if (amountCents <= 0) {
      alert('Amount must be greater than zero');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/invoices/${id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents,
          paymentMethod,
          transactionReference: transactionRef || undefined,
          actor: 'admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPaymentModal(false);
        setTransactionRef('');
        await loadInvoice();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!confirm('Are you sure you want to void this invoice? This action cannot be reversed.')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`/api/invoices/${id}?action=void`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadInvoice();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to permanently delete Invoice ${invoice.invoiceNumber}? All payment records for this invoice will also be deleted.`
      )
    ) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/invoices');
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const copyPortalLink = () => {
    if (!invoice?.publicAccessToken) return;
    const portalUrl = `${window.location.origin}/portal/${invoice.publicAccessToken}`;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="p-16 text-center text-sm text-slate-400">Loading invoice...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-16 text-center">
        <p className="text-slate-600">Invoice not found.</p>
        <Link href="/invoices" className="text-blue-600 underline text-sm mt-2 inline-block">
          Back to invoices
        </Link>
      </div>
    );
  }

  const isLocked = isInvoiceLocked(invoice.status as InvoiceStatus);
  const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/portal/${invoice.publicAccessToken}` : '';
  const orgLogoUrl = invoice.organizationSnapshot?.branding?.logoUrl || (invoice.organizationId as any)?.branding?.logoUrl;

  return (
    <div className="space-y-6">
      {/* Action Header - hidden in print */}
      <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link
            href="/invoices"
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          {orgLogoUrl ? (
            <img
              src={orgLogoUrl}
              alt={invoice.organizationSnapshot?.name || 'Business Logo'}
              className="w-9 h-9 object-contain rounded border border-slate-200 bg-white p-1"
            />
          ) : null}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status as InvoiceStatus} size="sm" />
            </div>
            <p className="text-xs text-slate-500">
              Created on {new Date(invoice.createdAt).toLocaleDateString()}
              {invoice.organizationSnapshot?.name ? ` • Issued by ${invoice.organizationSnapshot.name}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isLocked && (
            <div className="w-40">
              <CurrencySelect
                compact
                value={invoice.currency || 'USD'}
                disabled={actionLoading}
                onChange={handleCurrencyChange}
                ariaLabel="Draft Invoice Currency"
              />
            </div>
          )}

          {/* Public Portal Link */}
          <button
            onClick={copyPortalLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            title="Copy Public Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
          </button>

          <Link
            href={`/portal/${invoice.publicAccessToken}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Client View</span>
          </Link>

          {/* Print / PDF */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print / PDF</span>
          </button>

          {/* Send / Resend to Client with Live Email Preview */}
          {invoice.status !== 'void' && (
            <button
              onClick={() => setShowSendModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{invoice.status === 'draft' ? 'Send to Client' : 'Resend / Share Link'}</span>
            </button>
          )}

          {/* Record Payment */}
          {invoice.balanceDueCents > 0 && invoice.status !== 'void' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          )}

          {/* Void */}
          {invoice.status !== 'void' && invoice.status !== 'paid' && invoice.status !== 'refunded' && (
            <button
              onClick={handleVoid}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-medium"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Void</span>
            </button>
          )}

          {/* Delete Invoice */}
          <button
            onClick={handlePermanentDelete}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium"
            title="Permanently Delete Invoice"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Invoice Document with Live Template & Accent Switcher */}
      <DocumentTemplateView doc={invoice} type="invoice" showControls={true} />

      {/* Immutable Audit Log Section - hidden in print */}
      <div className="no-print bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Activity & Audit Timeline</h3>
        </div>

        <div className="space-y-4">
          {invoice.activityLog?.map((log: any, idx: number) => (
            <div key={idx} className="flex items-start space-x-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{log.action}</span>
                  <span className="text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                {log.notes && <p className="text-slate-500 mt-0.5">{log.notes}</p>}
                <div className="text-[11px] text-slate-400 mt-0.5">By: {log.actor}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Record Manual Payment</h3>
            <p className="text-xs text-slate-500">
              Apply a payment to this invoice. The balance and status will update automatically.
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Amount ({getCurrencySymbol(invoice.currency)} {invoice.currency || 'USD'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Method
                </label>
                <SearchableCombobox
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val as typeof paymentMethod)}
                  options={PAYMENT_METHOD_OPTIONS}
                  searchCaption="Select Payment Method"
                  ariaLabel="Payment Method"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Check #1042 or Wire Ref..."
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Document Modal with Live Email Preview */}
      <SendDocumentModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        documentType="invoice"
        documentNumber={invoice.invoiceNumber}
        amountCents={invoice.balanceDueCents || invoice.grandTotalCents}
        currency={invoice.currency}
        clientName={invoice.clientSnapshot?.name || invoice.clientId?.name || 'Valued Client'}
        clientEmail={invoice.clientSnapshot?.email || invoice.clientId?.email || ''}
        publicToken={invoice.publicAccessToken}
        orgName={invoice.organizationSnapshot?.name || 'Registered Business'}
        orgLogoUrl={invoice.organizationSnapshot?.branding?.logoUrl}
        dueDate={invoice.dueDate}
        onSend={async () => {
          await handleMarkSent();
        }}
      />
    </div>
  );
}

