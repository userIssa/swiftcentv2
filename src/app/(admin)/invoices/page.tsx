'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Trash2,
  Building,
  Download,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency } from '@/engine/calculator';
import { InvoiceStatus } from '@/engine/state-machine';
import { useActiveBusiness } from '@/context/ActiveBusinessContext';

const TABS = [
  { id: 'all', label: 'All Invoices' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'partially_paid', label: 'Partial' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
];

export default function InvoicesListPage() {
  const { activeBusiness } = useActiveBusiness();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [businessFilter, setBusinessFilter] = useState<'all' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadInvoices = async (status = selectedTab, bFilter = businessFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status !== 'all') params.append('status', status);
      if (bFilter === 'active' && activeBusiness?._id) {
        params.append('organizationId', activeBusiness._id);
      }
      const qs = params.toString();
      const url = qs ? `/api/invoices?${qs}` : '/api/invoices';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.invoices) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(selectedTab, businessFilter);
  }, [selectedTab, businessFilter, activeBusiness?._id]);

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to permanently delete Invoice ${invoiceNumber}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadInvoices();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const invNumber = (inv.invoiceNumber || '').toLowerCase();
    const clientName = (inv.clientSnapshot?.name || inv.clientId?.name || '').toLowerCase();
    return invNumber.includes(term) || clientName.includes(term);
  });

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      alert('No invoices available to export');
      return;
    }

    const headers = [
      'Invoice Number',
      'Client Name',
      'Client Email',
      'Issue Date',
      'Due Date',
      'Status',
      'Subtotal',
      'Tax',
      'Total',
      'Amount Paid',
      'Balance Due',
      'Currency',
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      `"${(inv.clientSnapshot?.name || inv.clientId?.name || '').replace(/"/g, '""')}"`,
      `"${(inv.clientSnapshot?.email || inv.clientId?.email || '').replace(/"/g, '""')}"`,
      inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : '',
      inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
      inv.status,
      ((inv.subtotalCents || 0) / 100).toFixed(2),
      ((inv.taxTotalCents || 0) / 100).toFixed(2),
      ((inv.grandTotalCents || 0) / 100).toFixed(2),
      ((inv.paidCents || 0) / 100).toFixed(2),
      ((inv.balanceDueCents || 0) / 100).toFixed(2),
      inv.organizationSnapshot?.currency || 'USD',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `swiftcent-invoices-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your invoice lifecycle, view audit logs, and accept payments.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </Link>
        </div>
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
              placeholder="Search invoice # or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-400">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-16 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No invoices found</p>
            <p className="text-xs text-slate-400 mt-1">Try switching filters or creating a new invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Invoice Number</th>
                  <th className="px-6 py-3.5 font-semibold">Client</th>
                  <th className="px-6 py-3.5 font-semibold">Issue Date</th>
                  <th className="px-6 py-3.5 font-semibold">Due Date</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Total</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Balance Due</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <Link href={`/invoices/${inv._id}`} className="hover:text-blue-600">
                        {inv.invoiceNumber}
                      </Link>
                      {inv.organizationSnapshot?.name && (
                        <div className="text-[11px] text-slate-400 font-normal">
                          By: {inv.organizationSnapshot.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="font-medium">
                        {inv.clientSnapshot?.name || inv.clientId?.name || 'Customer'}
                      </div>
                      <div className="text-xs text-slate-400">{inv.clientSnapshot?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status as InvoiceStatus} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {formatCurrency(inv.grandTotalCents, inv.currency)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {inv.balanceDueCents === 0 ? (
                        <span className="text-emerald-600 text-xs">Paid</span>
                      ) : (
                        <span className="text-slate-900">
                          {formatCurrency(inv.balanceDueCents, inv.currency)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/portal/${inv.publicAccessToken}`}
                          target="_blank"
                          title="Open Client Portal"
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/invoices/${inv._id}`}
                          className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded border border-blue-200 inline-flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => handleDeleteInvoice(inv._id, inv.invoiceNumber)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Invoice"
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

