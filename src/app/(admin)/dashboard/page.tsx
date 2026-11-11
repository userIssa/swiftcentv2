'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  Receipt,
  Search,
  FileText,
  ChevronDown,
  Mic,
  Database,
  Trash2,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { RevenueChart } from '@/components/RevenueChart';
import { formatCurrency } from '@/engine/calculator';
import { InvoiceStatus } from '@/engine/state-machine';
import { useActiveBusiness } from '@/context/ActiveBusinessContext';
import { useAuth } from '@/context/AuthContext';
import { clearSampleWorkspaceData, loadSampleWorkspaceData } from '@/lib/sample-data-client';

interface DashboardStats {
  totalInvoicedCents: number;
  totalCollectedCents: number;
  outstandingCents: number;
  overdueCount: number;
}

export default function DashboardPage() {
  const { activeBusiness } = useActiveBusiness();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoicedCents: 0,
    totalCollectedCents: 0,
    outstandingCents: 0,
    overdueCount: 0,
  });
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [sampleAction, setSampleAction] = useState<'load' | 'clear' | null>(null);
  const [sampleNotice, setSampleNotice] = useState<string | null>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchData = async (orgId?: string) => {
    try {
      setLoading(true);
      const url = orgId && orgId !== 'all' ? `/api/invoices?organizationId=${orgId}` : '/api/invoices';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.invoices) {
        setInvoices(data.invoices);
        calculateStats(data.invoices);
      } else {
        setInvoices([]);
        calculateStats([]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setInvoices([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invs: any[]) => {
    let invoiced = 0;
    let collected = 0;
    let outstanding = 0;
    let overdue = 0;

    for (const inv of invs) {
      if (inv.status !== 'void') {
        invoiced += inv.grandTotalCents || 0;
        collected += inv.paidCents || 0;
        outstanding += inv.balanceDueCents || 0;
        if (inv.status === 'overdue') {
          overdue += 1;
        }
      }
    }

    setStats({
      totalInvoicedCents: invoiced,
      totalCollectedCents: collected,
      outstandingCents: outstanding,
      overdueCount: overdue,
    });
  };

  const handleSampleDataAction = async (mode: 'load' | 'clear') => {
    try {
      setSampleAction(mode);
      const data =
        mode === 'load'
          ? await loadSampleWorkspaceData(activeBusiness?._id)
          : await clearSampleWorkspaceData(activeBusiness?._id);
      if (data.success) {
        setSampleNotice(
          data.message ||
            (mode === 'load'
              ? 'Sample data loaded into your workspace.'
              : 'Sample data removed from your workspace.')
        );
        await fetchData(activeBusiness?._id);
        setTimeout(() => setSampleNotice(null), 6000);
      } else {
        alert(data.error || `Failed to ${mode} sample data`);
      }
    } catch (err: any) {
      alert(err.message || `Error trying to ${mode} sample data`);
    } finally {
      setSampleAction(null);
    }
  };

  useEffect(() => {
    fetchData(activeBusiness?._id);
  }, [activeBusiness?._id]);

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const invNumber = (inv.invoiceNumber || '').toLowerCase();
    const clientName = (inv.clientSnapshot?.name || inv.clientId?.name || '').toLowerCase();
    const desc = (inv.items?.[0]?.description || '').toLowerCase();
    return invNumber.includes(term) || clientName.includes(term) || desc.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Financial Dashboard
            </h1>
            {activeBusiness?.name && (
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-full">
                {activeBusiness.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time receivables, payment performance, and invoice lifecycle overview
            {activeBusiness?.name ? ` for ${activeBusiness.name}` : ''}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {user?.canLoadSampleData && (
            <>
              <button
                type="button"
                onClick={() => handleSampleDataAction('load')}
                disabled={sampleAction !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Database className={`w-3.5 h-3.5 text-sky-400 ${sampleAction === 'load' ? 'animate-pulse' : ''}`} />
                <span>{sampleAction === 'load' ? 'Loading Sample Data...' : 'Load Sample Data'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSampleDataAction('clear')}
                disabled={sampleAction !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className={`w-3.5 h-3.5 text-rose-500 ${sampleAction === 'clear' ? 'animate-pulse' : ''}`} />
                <span>{sampleAction === 'clear' ? 'Removing Sample...' : 'Clear Sample Data'}</span>
              </button>
            </>
          )}

          <div className="relative" ref={createMenuRef}>
            <button
              type="button"
              onClick={() => setCreateMenuOpen(!createMenuOpen)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              aria-expanded={createMenuOpen}
              aria-haspopup="true"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${createMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {createMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <Link
                  href="/invoices/new"
                  onClick={() => setCreateMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-blue-50/60 hover:text-blue-700 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 group-hover:text-blue-700">New Invoice</div>
                    <div className="text-[10px] text-slate-400">Bill client & receive payment</div>
                  </div>
                </Link>
                <div className="h-px bg-slate-100 my-1 mx-2" />
                <Link
                  href="/quotes/new"
                  onClick={() => setCreateMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-700 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-700">New Quote</div>
                    <div className="text-[10px] text-slate-400">Price estimate for client approval</div>
                  </div>
                </Link>
                <div className="h-px bg-slate-100 my-1 mx-2" />
                <Link
                  href="/invoices/new?voice=1"
                  onClick={() => setCreateMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-sky-50/70 hover:text-sky-700 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 group-hover:text-sky-700">Voice Invoice Draft</div>
                    <div className="text-[10px] text-slate-400">Speak items with Gemini Live</div>
                  </div>
                </Link>
                <Link
                  href="/quotes/new?voice=1"
                  onClick={() => setCreateMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-sky-50/70 hover:text-sky-700 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 group-hover:text-sky-700">Voice Quote Draft</div>
                    <div className="text-[10px] text-slate-400">Speak scope & build proposal live</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {sampleNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sampleNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSampleNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Cards (The 4 Core Financial Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invoiced */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(stats.totalInvoicedCents)}
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">All issued invoices</p>
        </div>

        {/* Card 2: Collected Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Collected Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 tracking-tight">
            {formatCurrency(stats.totalCollectedCents)}
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Cleared client payments</p>
        </div>

        {/* Card 3: Outstanding Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Outstanding Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600 tracking-tight">
            {formatCurrency(stats.outstandingCents)}
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Awaiting payment / in flight</p>
        </div>

        {/* Card 4: Overdue Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-600 tracking-tight">
            {stats.overdueCount} {stats.overdueCount === 1 ? 'Invoice' : 'Invoices'}
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Requires follow-up</p>
        </div>
      </div>

      {/* Financial Performance & Revenue Trends Chart */}
      <RevenueChart invoices={invoices} currency={activeBusiness?.currency || 'USD'} />

      {/* Recent Invoices Table (The Full Core Financial Table) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Recent Invoices
            </h2>
            <Link
              href="/invoices"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice # or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-3 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 text-sm">No invoices generated yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by creating your first invoice for your clients.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Invoice</span>
              </Link>
              <Link
                href="/quotes/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Quote</span>
              </Link>
              {user?.canLoadSampleData && (
                <button
                  type="button"
                  onClick={() => handleSampleDataAction('load')}
                  disabled={sampleAction !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5 text-sky-300" />
                  <span>{sampleAction === 'load' ? 'Loading...' : 'Load Sample Data'}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="pb-3 font-medium">Invoice #</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Due Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                  <th className="pb-3 font-medium text-right">Balance</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.slice(0, 8).map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Invoice # */}
                    <td className="py-3.5 font-semibold text-slate-900">
                      <Link href={`/invoices/${inv._id}`} className="hover:text-blue-600">
                        {inv.invoiceNumber}
                      </Link>
                    </td>

                    {/* Client Name & Email */}
                    <td className="py-3.5 text-slate-700">
                      <div className="font-semibold text-slate-800">
                        {inv.clientSnapshot?.name || inv.clientId?.name || 'Unknown Client'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {inv.clientSnapshot?.email || inv.clientId?.email || ''}
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 text-slate-500">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td className="py-3.5">
                      <StatusBadge status={inv.status as InvoiceStatus} size="sm" />
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 text-right font-semibold text-slate-900">
                      {formatCurrency(inv.grandTotalCents, inv.currency)}
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 text-right font-semibold">
                      {inv.balanceDueCents === 0 ? (
                        <span className="text-emerald-600 font-medium">Paid in full</span>
                      ) : (
                        <span className="text-slate-900">
                          {formatCurrency(inv.balanceDueCents, inv.currency)}
                        </span>
                      )}
                    </td>

                    {/* Action Links */}
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/portal/${inv.publicAccessToken}`}
                          target="_blank"
                          title="Open Client Portal"
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/invoices/${inv._id}`}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                        >
                          Manage
                        </Link>
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
