'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Printer,
  FileCheck2,
  Lock,
  Building,
  Check,
  FileText,
} from 'lucide-react';
import { QuoteStatusBadge } from '@/components/QuoteStatusBadge';
import { DocumentTemplateView } from '@/components/DocumentTemplateView';
import { formatCurrency } from '@/engine/calculator';
import { QuoteStatus } from '@/models/Quote';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';

export default function ClientQuotePortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [clientSignName, setClientSignName] = useState('');

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const data = await fetchJsonWithBuffer(`/api/portal/quotes/${token}`, {
        timeoutMs: 15000,
        retry: true,
      });
      if (data.success && data.quote) {
        setQuote(data.quote);
        setClientSignName(data.quote.clientSnapshot?.name || '');
      } else {
        setError(data.error || 'Proposal not found');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [token]);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;

    try {
      setApproving(true);
      const res = await fetch(`/api/portal/quotes/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientSignName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowApproveModal(false);
        await fetchQuote();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md w-full shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Proposal Unavailable</h2>
          <p className="text-xs text-slate-500 mt-1">
            {error || 'This link may have expired or is invalid.'}
          </p>
        </div>
      </div>
    );
  }

  const isApproved = quote.status === 'approved' || quote.status === 'converted';

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Floating Top Bar - hidden in print */}
        <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {quote.organizationSnapshot?.branding?.logoUrl ? (
              <img
                src={quote.organizationSnapshot.branding.logoUrl}
                alt={quote.organizationSnapshot.name}
                className="w-10 h-10 object-contain rounded border border-slate-200 bg-white p-1"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {quote.organizationSnapshot?.name?.substring(0, 2).toUpperCase() || 'SC'}
              </div>
            )}
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Proposal from {quote.organizationSnapshot?.name || 'SwiftCent'}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Client Proposal</span>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / Download PDF</span>
            </button>

            {!isApproved && (
              <button
                onClick={() => setShowApproveModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Accept & Approve Proposal</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Callout Banner */}
        {isApproved ? (
          <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Proposal Accepted!</span> You have formally accepted this proposal. The issuing team has been notified to proceed.
            </div>
          </div>
        ) : (
          <div className="no-print bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="text-xs">
              <span className="font-bold">Quotation Valid Until:</span>{' '}
              {new Date(quote.validUntil).toLocaleDateString()}. Please review the items and click "Accept & Approve" to authorize the work.
            </div>
            <button
              onClick={() => setShowApproveModal(true)}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>Accept Online</span>
            </button>
          </div>
        )}

        {/* Customizable Proposal Document */}
        <DocumentTemplateView doc={quote} type="quote" showControls={true} />
      </div>

      {/* Acceptance Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Accept & Authorize Proposal</h3>
              </div>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-medium"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Quotation Amount
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {formatCurrency(quote.grandTotalCents, quote.currency)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Proposal {quote.quoteNumber}</div>
            </div>

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Authorizing Representative Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={clientSignName}
                  onChange={(e) => setClientSignName(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                By clicking "Authorize & Accept", you confirm your approval of this proposal from{' '}
                <span className="font-semibold text-slate-700">
                  {quote.organizationSnapshot?.name}
                </span>{' '}
                according to the terms outlined above.
              </div>

              <button
                type="submit"
                disabled={approving}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{approving ? 'Confirming Acceptance...' : 'Authorize & Accept Proposal'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

