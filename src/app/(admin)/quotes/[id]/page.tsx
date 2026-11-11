'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  FileCheck2,
  Printer,
  Copy,
  Check,
  Clock,
  ExternalLink,
  Receipt,
  Building,
  Trash2,
} from 'lucide-react';
import { QuoteStatusBadge } from '@/components/QuoteStatusBadge';
import { SendDocumentModal } from '@/components/SendDocumentModal';
import { DocumentTemplateView } from '@/components/DocumentTemplateView';
import { formatCurrency } from '@/engine/calculator';
import { QuoteStatus } from '@/models/Quote';

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const loadQuote = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quotes/${id}`);
      const data = await res.json();
      if (data.success && data.quote) {
        setQuote(data.quote);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuote();
  }, [id]);

  const handleMarkSent = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/quotes/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'admin' }),
      });
      const data = await res.json();
      if (data.success) {
        await loadQuote();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!confirm('Convert this quote into an official invoice?')) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/quotes/${id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'admin' }),
      });
      const data = await res.json();
      if (data.success && data.invoice) {
        router.push(`/invoices/${data.invoice._id}`);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuote = async () => {
    if (!confirm(`Are you sure you want to permanently delete Quote ${quote.quoteNumber}?`)) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/quotes');
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
    if (!quote?.publicAccessToken) return;
    const portalUrl = `${window.location.origin}/portal/quotes/${quote.publicAccessToken}`;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="p-16 text-center text-sm text-slate-400">Loading quote...</div>;
  }

  if (!quote) {
    return (
      <div className="p-16 text-center">
        <p className="text-slate-600">Quote not found.</p>
        <Link href="/quotes" className="text-blue-600 underline text-sm mt-2 inline-block">
          Back to quotes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header - hidden in print */}
      <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link
            href="/quotes"
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{quote.quoteNumber}</h1>
              <QuoteStatusBadge status={quote.status as QuoteStatus} size="sm" />
            </div>
            <p className="text-xs text-slate-500">
              Created on {new Date(quote.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Public Link */}
          <button
            onClick={copyPortalLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            title="Copy Public Proposal Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied Link!' : 'Copy Proposal Link'}</span>
          </button>

          <Link
            href={`/portal/quotes/${quote.publicAccessToken}`}
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

          {/* Delete Quote */}
          <button
            onClick={handleDeleteQuote}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium"
            title="Permanently Delete Quote"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          {/* Send / Resend Quote to Client */}
          {quote.status !== 'converted' && (
            <button
              onClick={() => setShowSendModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{quote.status === 'draft' ? 'Send to Client' : 'Resend / Share Link'}</span>
            </button>
          )}

          {/* 1-Click Convert to Invoice */}
          {quote.status !== 'converted' ? (
            <button
              onClick={handleConvert}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Convert to Invoice</span>
            </button>
          ) : (
            <Link
              href={`/invoices/${quote.convertedInvoiceId?._id || quote.convertedInvoiceId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold hover:bg-purple-100"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View Converted Invoice</span>
            </Link>
          )}
        </div>
      </div>

      {/* Quote Document with Live Template & Accent Switcher */}
      <DocumentTemplateView doc={quote} type="quote" showControls={true} />

      {/* Audit Log Timeline */}
      <div className="no-print bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Proposal Activity & Audit Trail</h3>
        </div>

        <div className="space-y-4">
          {quote.activityLog?.map((log: any, idx: number) => (
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

      {/* Send Quote Modal with Live Email Preview */}
      <SendDocumentModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        documentType="quote"
        documentNumber={quote.quoteNumber}
        amountCents={quote.grandTotalCents}
        clientName={quote.clientSnapshot?.name || quote.clientId?.name || 'Valued Client'}
        clientEmail={quote.clientSnapshot?.email || quote.clientId?.email || ''}
        publicToken={quote.publicAccessToken}
        orgName={quote.organizationSnapshot?.name || 'Registered Business'}
        orgLogoUrl={quote.organizationSnapshot?.branding?.logoUrl}
        dueDate={quote.validUntil}
        onSend={async () => {
          await handleMarkSent();
        }}
      />
    </div>
  );
}

