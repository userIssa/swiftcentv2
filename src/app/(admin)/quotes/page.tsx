'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Receipt,
  Trash2,
  Building,
} from 'lucide-react';
import { QuoteStatusBadge } from '@/components/QuoteStatusBadge';
import { formatCurrency } from '@/engine/calculator';
import { QuoteStatus } from '@/models/Quote';
import { useActiveBusiness } from '@/context/ActiveBusinessContext';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';

const TABS = [
  { id: 'all', label: 'All Quotes' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'approved', label: 'Approved' },
  { id: 'converted', label: 'Converted' },
];

export default function QuotesListPage() {
  const { activeBusiness, loading: businessLoading } = useActiveBusiness();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [businessFilter, setBusinessFilter] = useState<'all' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadQuotes = async (status = selectedTab, bFilter = businessFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status !== 'all') params.append('status', status);
      if (bFilter === 'active' && activeBusiness?._id) {
        params.append('organizationId', activeBusiness._id);
      }
      const qs = params.toString();
      const url = qs ? `/api/quotes?${qs}` : '/api/quotes';
      const data = await fetchJsonWithBuffer(url, { timeoutMs: 15000, retry: true });
      if (data.success && data.quotes) {
        setQuotes(data.quotes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessLoading) {
      setLoading(true);
      return;
    }
    loadQuotes(selectedTab, businessFilter);
  }, [selectedTab, businessFilter, activeBusiness?._id, businessLoading]);

  const filteredQuotes = quotes.filter((q) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const qNumber = (q.quoteNumber || '').toLowerCase();
    const clientName = (q.clientSnapshot?.name || q.clientId?.name || '').toLowerCase();
    return qNumber.includes(term) || clientName.includes(term);
  });

  const handleDeleteQuote = async (quoteId: string, quoteNumber: string) => {
    if (!confirm(`Are you sure you want to permanently delete Quote ${quoteNumber}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadQuotes();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quotes & Estimates</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create proposals with your custom business branding, track client approvals, and convert to invoices in one click.
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Quote</span>
        </Link>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center overflow-x-auto space-x-1 pb-2 md:pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {activeBusiness && (
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium shrink-0">
              <button
                onClick={() => setBusinessFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  businessFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Entities
              </button>
              <button
                onClick={() => setBusinessFilter('active')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  businessFilter === 'active'
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={`Filter by ${activeBusiness.name}`}
              >
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span className="max-w-[120px] truncate">{activeBusiness.name}</span>
              </button>
            </div>
          )}

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search quote # or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-400">Loading quotes...</div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No quotes found</p>
            <p className="text-xs text-slate-400 mt-1">
              Start by sending a proposal to a client or prospect.
            </p>
            <Link
              href="/quotes/new"
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Quote</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Quote #</th>
                  <th className="px-6 py-3.5 font-semibold">Client</th>
                  <th className="px-6 py-3.5 font-semibold">Issued</th>
                  <th className="px-6 py-3.5 font-semibold">Valid Until</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Total</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <Link href={`/quotes/${q._id}`} className="hover:text-blue-600">
                        {q.quoteNumber}
                      </Link>
                      {q.organizationSnapshot?.name && (
                        <div className="text-[11px] text-slate-400 font-normal">
                          By: {q.organizationSnapshot.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="font-medium">
                        {q.clientSnapshot?.name || q.clientId?.name || 'Client'}
                      </div>
                      <div className="text-xs text-slate-400">{q.clientSnapshot?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(q.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(q.validUntil).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <QuoteStatusBadge status={q.status as QuoteStatus} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {formatCurrency(q.grandTotalCents, q.currency)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {q.convertedInvoiceId ? (
                          <Link
                            href={`/invoices/${q.convertedInvoiceId._id || q.convertedInvoiceId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 rounded border border-purple-200"
                            title="View converted invoice"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Invoice</span>
                          </Link>
                        ) : null}
                        <Link
                          href={`/portal/quotes/${q.publicAccessToken}`}
                          target="_blank"
                          title="Open Client Proposal View"
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/quotes/${q._id}`}
                          className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded border border-blue-200 inline-flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => handleDeleteQuote(q._id, q.quoteNumber)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Quote"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

