'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Building,
  Plus,
  Receipt,
  Trash2,
  Edit3,
  Download,
} from 'lucide-react';
import { useActiveBusiness } from '@/context/ActiveBusinessContext';
import { CurrencySelect } from '@/components/CurrencySelect';
import { CountrySelect } from '@/components/CountrySelect';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';

export default function ClientsPage() {
  const { activeBusiness, loading: businessLoading } = useActiveBusiness();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [taxId, setTaxId] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState(14);

  const loadClients = async () => {
    try {
      setLoading(true);
      const url = activeBusiness?._id ? `/api/clients?organizationId=${activeBusiness._id}` : '/api/clients';
      const data = await fetchJsonWithBuffer(url, { timeoutMs: 15000, retry: true });
      if (data.success && data.clients) {
        setClients(data.clients);
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
    loadClients();
  }, [activeBusiness?._id, businessLoading]);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setName('');
    setEmail('');
    setPhone('');
    setCurrency(activeBusiness?.currency || 'USD');
    setTaxId('');
    setStreet('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('');
    setPaymentTermsDays(14);
    setShowModal(true);
  };

  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setName(client.name || '');
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setCurrency(client.currency || 'USD');
    setTaxId(client.taxId || '');
    setStreet(client.billingAddress?.street || '');
    setCity(client.billingAddress?.city || '');
    setState(client.billingAddress?.state || '');
    setPostalCode(client.billingAddress?.postalCode || '');
    setCountry(client.billingAddress?.country || '');
    setPaymentTermsDays(client.paymentTermsDays || 14);
    setShowModal(true);
  };

  const handleDeleteClient = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete client "${clientName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadClients();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Please enter client name and email');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        name,
        email,
        phone,
        currency,
        taxId,
        billingAddress: {
          street,
          city,
          state,
          postalCode,
          country,
        },
        paymentTermsDays,
        organizationId: activeBusiness?._id,
      };

      const url = editingClient ? `/api/clients/${editingClient._id}` : '/api/clients';
      const method = editingClient ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        await loadClients();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (clients.length === 0) {
      alert('No clients available to export');
      return;
    }

    const headers = [
      'Name',
      'Email',
      'Phone',
      'Currency',
      'Tax ID',
      'Street',
      'City',
      'State',
      'Postal Code',
      'Country',
      'Payment Terms (Days)',
    ];

    const rows = clients.map((c) => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      c.currency || 'USD',
      `"${(c.taxId || '').replace(/"/g, '""')}"`,
      `"${(c.billingAddress?.street || '').replace(/"/g, '""')}"`,
      `"${(c.billingAddress?.city || '').replace(/"/g, '""')}"`,
      `"${(c.billingAddress?.state || '').replace(/"/g, '""')}"`,
      `"${(c.billingAddress?.postalCode || '').replace(/"/g, '""')}"`,
      `"${(c.billingAddress?.country || '').replace(/"/g, '""')}"`,
      c.paymentTermsDays || 14,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `swiftcent-clients-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your client contacts, billing profiles, and payment terms.
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
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-400">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No clients in directory yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first customer to start invoicing.</p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Client Name</th>
                  <th className="px-6 py-3.5 font-semibold">Contact Email</th>
                  <th className="px-6 py-3.5 font-semibold">Location</th>
                  <th className="px-6 py-3.5 font-semibold">Terms</th>
                  <th className="px-6 py-3.5 font-semibold">Currency</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {c.billingAddress?.city ? `${c.billingAddress.city}, ${c.billingAddress.country || ''}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      Net {c.paymentTermsDays || 14} days
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      {c.currency || 'USD'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/invoices/new`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
                          title="Create invoice for client"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Invoice</span>
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Client"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(c._id, c.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              {editingClient ? 'Edit Client Profile' : 'Add New Client'}
            </h3>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Client / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="billing@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Default Currency</label>
                  <CurrencySelect
                    value={currency}
                    onChange={setCurrency}
                    compact
                    ariaLabel="Client Default Currency"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payment Terms (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(parseInt(e.target.value) || 0)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tax ID / VAT / TIN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. VAT, TIN, GST, ABN, or EIN"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="Street and number"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                  <CountrySelect
                    value={country}
                    onChange={setCountry}
                    ariaLabel="Client Country"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {editingClient ? 'Save Changes' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
