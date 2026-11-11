'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Users,
  PieChart,
  Percent,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency } from '@/engine/calculator';
import { useActiveBusiness } from '@/context/ActiveBusinessContext';

interface AgingBucket {
  label: string;
  rangeDays: string;
  invoiceCount: number;
  balanceCents: number;
  color: string;
  badgeBg: string;
}

interface ClientRanking {
  clientId: string;
  clientName: string;
  clientEmail: string;
  invoiceCount: number;
  totalInvoicedCents: number;
  totalCollectedCents: number;
  outstandingCents: number;
  sharePercent: number;
}

interface TaxSummary {
  taxName: string;
  rate: number;
  method: string;
  taxableBaseCents: number;
  totalTaxCents: number;
}

export default function ReportsPage() {
  const { activeBusiness } = useActiveBusiness();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const orgId = activeBusiness?._id;
        const invUrl = orgId ? `/api/invoices?organizationId=${orgId}` : '/api/invoices';
        const quoteUrl = orgId ? `/api/quotes?organizationId=${orgId}` : '/api/quotes';

        const [invRes, quoteRes] = await Promise.all([fetch(invUrl), fetch(quoteUrl)]);
        const [invData, quoteData] = await Promise.all([invRes.json(), quoteRes.json()]);

        if (invData.success && invData.invoices) {
          setInvoices(invData.invoices);
        }
        if (quoteData.success && quoteData.quotes) {
          setQuotes(quoteData.quotes);
        }
      } catch (err) {
        console.error('Failed to load reports data', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeBusiness?._id]);

  const currency = activeBusiness?.currency || 'USD';

  // 1. Calculate A/R Aging Schedule
  const now = new Date();
  const agingBuckets: AgingBucket[] = [
    {
      label: 'Current (Not Due)',
      rangeDays: 'Due in future',
      invoiceCount: 0,
      balanceCents: 0,
      color: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: '1 – 30 Days Overdue',
      rangeDays: '1 to 30 days',
      invoiceCount: 0,
      balanceCents: 0,
      color: 'bg-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      label: '31 – 60 Days Overdue',
      rangeDays: '31 to 60 days',
      invoiceCount: 0,
      balanceCents: 0,
      color: 'bg-orange-500',
      badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      label: '61 – 90 Days Overdue',
      rangeDays: '61 to 90 days',
      invoiceCount: 0,
      balanceCents: 0,
      color: 'bg-rose-500',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      label: '90+ Days Overdue',
      rangeDays: '> 90 days',
      invoiceCount: 0,
      balanceCents: 0,
      color: 'bg-red-700',
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
    },
  ];

  let totalOutstandingCents = 0;
  let totalInvoicedCents = 0;
  let totalCollectedCents = 0;

  for (const inv of invoices) {
    if (inv.status === 'void') continue;

    totalInvoicedCents += inv.grandTotalCents || 0;
    totalCollectedCents += inv.paidCents || 0;
    const balance = inv.balanceDueCents || 0;
    totalOutstandingCents += balance;

    if (balance > 0) {
      const dueDate = new Date(inv.dueDate);
      const diffMs = now.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        // Current / Not yet due
        agingBuckets[0].invoiceCount += 1;
        agingBuckets[0].balanceCents += balance;
      } else if (diffDays <= 30) {
        agingBuckets[1].invoiceCount += 1;
        agingBuckets[1].balanceCents += balance;
      } else if (diffDays <= 60) {
        agingBuckets[2].invoiceCount += 1;
        agingBuckets[2].balanceCents += balance;
      } else if (diffDays <= 90) {
        agingBuckets[3].invoiceCount += 1;
        agingBuckets[3].balanceCents += balance;
      } else {
        agingBuckets[4].invoiceCount += 1;
        agingBuckets[4].balanceCents += balance;
      }
    }
  }

  // 2. Client Revenue Ranking
  const clientMap = new Map<string, ClientRanking>();

  for (const inv of invoices) {
    if (inv.status === 'void') continue;
    const clientId = inv.clientId?._id || inv.clientId || 'unknown';
    const clientName = inv.clientSnapshot?.name || inv.clientId?.name || 'Unnamed Client';
    const clientEmail = inv.clientSnapshot?.email || inv.clientId?.email || '';

    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, {
        clientId,
        clientName,
        clientEmail,
        invoiceCount: 0,
        totalInvoicedCents: 0,
        totalCollectedCents: 0,
        outstandingCents: 0,
        sharePercent: 0,
      });
    }

    const stat = clientMap.get(clientId)!;
    stat.invoiceCount += 1;
    stat.totalInvoicedCents += inv.grandTotalCents || 0;
    stat.totalCollectedCents += inv.paidCents || 0;
    stat.outstandingCents += inv.balanceDueCents || 0;
  }

  const clientRankings = Array.from(clientMap.values())
    .map((c) => ({
      ...c,
      sharePercent: totalInvoicedCents > 0 ? Math.round((c.totalInvoicedCents / totalInvoicedCents) * 100) : 0,
    }))
    .sort((a, b) => b.totalInvoicedCents - a.totalInvoicedCents);

  // 3. Quote Conversion Funnel
  const totalQuotes = quotes.length;
  const sentQuotes = quotes.filter((q) => q.status !== 'draft').length;
  const approvedQuotes = quotes.filter((q) => q.status === 'approved' || q.status === 'converted').length;
  const convertedQuotes = quotes.filter((q) => q.status === 'converted').length;
  const quoteConversionRate = totalQuotes > 0 ? Math.round((approvedQuotes / totalQuotes) * 100) : 0;

  // 4. Tax Summary
  const taxMap = new Map<string, TaxSummary>();

  for (const inv of invoices) {
    if (inv.status === 'void') continue;
    for (const item of inv.items || []) {
      for (const t of item.taxRates || []) {
        const key = `${t.name}_${t.rate}_${t.method}`;
        if (!taxMap.has(key)) {
          taxMap.set(key, {
            taxName: t.name,
            rate: t.rate,
            method: t.method || 'exclusive',
            taxableBaseCents: 0,
            totalTaxCents: 0,
          });
        }
        const summary = taxMap.get(key)!;
        summary.taxableBaseCents += item.netSubtotalCents || 0;
        summary.totalTaxCents += item.lineTaxCents || 0;
      }
    }
  }

  const taxSummaries = Array.from(taxMap.values()).sort((a, b) => b.totalTaxCents - a.totalTaxCents);

  // Export A/R Aging Schedule to CSV
  const handleExportAgingCSV = () => {
    const headers = ['Aging Bucket', 'Range', 'Unpaid Invoices', 'Outstanding Balance', 'Currency'];
    const rows = agingBuckets.map((b) => [
      `"${b.label}"`,
      `"${b.rangeDays}"`,
      b.invoiceCount,
      (b.balanceCents / 100).toFixed(2),
      currency,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `swiftcent-ar-aging-${now.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Financial & Aging Reports
            </h1>
            {activeBusiness?.name && (
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-full">
                {activeBusiness.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Accounts receivable aging schedule, client revenue concentrations, and quote conversion metrics.
          </p>
        </div>

        <button
          onClick={handleExportAgingCSV}
          className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Aging CSV</span>
        </button>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Receivables
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600 tracking-tight">
            {formatCurrency(totalOutstandingCents, currency)}
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Uncollected balance across all clients</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Collection Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 tracking-tight">
            {totalInvoicedCents > 0
              ? `${Math.round((totalCollectedCents / totalInvoicedCents) * 100)}%`
              : '0%'}
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            {formatCurrency(totalCollectedCents, currency)} cleared of {formatCurrency(totalInvoicedCents, currency)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Quote Conversion
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-indigo-600 tracking-tight">
            {quoteConversionRate}%
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            {approvedQuotes} approved of {totalQuotes} drafted quotes
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Client Base
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">
            {clientRankings.length}
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Clients with issued billing records</p>
        </div>
      </div>

      {/* Section 1: Accounts Receivable (A/R) Aging Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Accounts Receivable (A/R) Aging Schedule</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of pending receivables by time elapsed past invoice due date
            </p>
          </div>
          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
            Total Outstanding: {formatCurrency(totalOutstandingCents, currency)}
          </span>
        </div>

        {/* Visual Aging Bar */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {agingBuckets.map((b, idx) => {
              const pct = totalOutstandingCents > 0 ? (b.balanceCents / totalOutstandingCents) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={idx}
                  style={{ width: `${pct}%` }}
                  className={`${b.color} transition-all duration-300 relative group`}
                  title={`${b.label}: ${formatCurrency(b.balanceCents, currency)} (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>
        </div>

        {/* Aging Buckets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {agingBuckets.map((bucket, idx) => {
            const pct =
              totalOutstandingCents > 0 ? Math.round((bucket.balanceCents / totalOutstandingCents) * 100) : 0;
            return (
              <div
                key={idx}
                className="bg-slate-50/60 border border-slate-200/70 rounded-xl p-3.5 space-y-2 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bucket.badgeBg}`}>
                    {bucket.invoiceCount} {bucket.invoiceCount === 1 ? 'Inv' : 'Invs'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{pct}%</span>
                </div>
                <div className="text-base font-bold text-slate-900 tracking-tight">
                  {formatCurrency(bucket.balanceCents, currency)}
                </div>
                <div className="text-xs font-semibold text-slate-700 leading-tight">{bucket.label}</div>
                <div className="text-[10px] text-slate-400">{bucket.rangeDays}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 2: Top Clients by Revenue Ranking (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Client Revenue Concentration</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Top clients ranked by lifetime invoiced volume</p>
            </div>
          </div>

          {clientRankings.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No client billing data recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">Client</th>
                    <th className="pb-3 font-semibold">Invoices</th>
                    <th className="pb-3 font-semibold">Total Invoiced</th>
                    <th className="pb-3 font-semibold">Paid</th>
                    <th className="pb-3 font-semibold">Balance</th>
                    <th className="pb-3 font-semibold text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientRankings.slice(0, 8).map((client) => (
                    <tr key={client.clientId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="font-bold text-slate-900">{client.clientName}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                          {client.clientEmail}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-600 font-medium">{client.invoiceCount}</td>
                      <td className="py-3 pr-4 font-bold text-slate-900">
                        {formatCurrency(client.totalInvoicedCents, currency)}
                      </td>
                      <td className="py-3 pr-4 text-emerald-600 font-semibold">
                        {formatCurrency(client.totalCollectedCents, currency)}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-amber-600">
                        {formatCurrency(client.outstandingCents, currency)}
                      </td>
                      <td className="py-3 text-right">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                          {client.sharePercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 3: Quote Pipeline Conversion Funnel (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Quote Pipeline Conversion</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Proposal close efficiency & velocity</p>
          </div>

          <div className="space-y-4 pt-1">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-center">
              <span className="text-3xl font-extrabold text-indigo-600">{quoteConversionRate}%</span>
              <p className="text-xs font-semibold text-slate-700 mt-1">Proposal Win Rate</p>
              <p className="text-[10px] text-slate-400">Quotes accepted & converted into billed invoices</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-600 font-medium">1. Total Drafted Proposals</span>
                <span className="font-bold text-slate-900">{totalQuotes}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/60">
                <span className="text-blue-800 font-medium">2. Sent to Clients</span>
                <span className="font-bold text-blue-900">{sentQuotes}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                <span className="text-emerald-800 font-medium">3. Digitally Approved</span>
                <span className="font-bold text-emerald-900">{approvedQuotes}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/60">
                <span className="text-indigo-800 font-semibold">4. Converted to Invoices</span>
                <span className="font-bold text-indigo-900">{convertedQuotes}</span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/quotes"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                <span>View All Quotes</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Tax Liability Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-600" />
            <span>Tax Liability & Sales Tax Report</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated taxable gross and collected tax liabilities grouped by tax authority
          </p>
        </div>

        {taxSummaries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No tax collected across active invoices (0% default tax applied).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Tax Name</th>
                  <th className="pb-3 font-semibold">Configured Rate</th>
                  <th className="pb-3 font-semibold">Calculation Method</th>
                  <th className="pb-3 font-semibold">Net Taxable Gross</th>
                  <th className="pb-3 font-semibold text-right">Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxSummaries.map((tax, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-bold text-slate-900">{tax.taxName}</td>
                    <td className="py-3 text-slate-600 font-semibold">{tax.rate}%</td>
                    <td className="py-3 capitalize text-slate-500">{tax.method}</td>
                    <td className="py-3 font-semibold text-slate-800">
                      {formatCurrency(tax.taxableBaseCents, currency)}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-600">
                      {formatCurrency(tax.totalTaxCents, currency)}
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

