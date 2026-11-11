'use client';

import React, { useEffect, useState } from 'react';
import {
  Building,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  Globe,
  Mail,
  Receipt,
  FileText,
  Trash2,
  Edit3,
} from 'lucide-react';
import { LogoUploader } from '@/components/LogoUploader';
import { useActiveBusiness } from '@/context/ActiveBusinessContext';

export default function BusinessDirectoryPage() {
  const { refreshBusinesses } = useActiveBusiness();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteBusiness = async (orgId: string, orgName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${orgName}"? All associated quotes and invoices for this business will be permanently removed.`
      )
    ) {
      return;
    }

    try {
      setDeletingId(orgId);
      const res = await fetch(`/api/organizations/${orgId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadOrganizations();
        await refreshBusinesses();
      } else {
        alert(data.error || 'Failed to delete business');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [logoUrl, setLogoUrl] = useState('');
  const [quotePrefix, setQuotePrefix] = useState('QTE');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [taxId, setTaxId] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('USA');

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organizations');
      const data = await res.json();
      if (data.success && data.organizations) {
        setOrganizations(data.organizations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const handleOpenCreate = () => {
    setEditingOrg(null);
    setName('');
    setEmail('');
    setCurrency('USD');
    setLogoUrl('');
    setQuotePrefix('QTE');
    setInvoicePrefix('INV');
    setTaxId('');
    setStreet('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('USA');
    setShowModal(true);
  };

  const handleOpenEdit = (org: any) => {
    setEditingOrg(org);
    setName(org.name || '');
    setEmail(org.email || '');
    setCurrency(org.currency || 'USD');
    setLogoUrl(org.branding?.logoUrl || '');
    setQuotePrefix(org.quotePrefix || 'QTE');
    setInvoicePrefix(org.invoicePrefix || 'INV');
    setTaxId(org.taxId || '');
    setStreet(org.address?.street || '');
    setCity(org.address?.city || '');
    setState(org.address?.state || '');
    setPostalCode(org.address?.postalCode || '');
    setCountry(org.address?.country || 'USA');
    setShowModal(true);
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Business name and email are required');
      return;
    }

    try {
      setSubmitting(true);
      const url = editingOrg ? `/api/organizations/${editingOrg._id}` : '/api/organizations';
      const method = editingOrg ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          currency,
          quotePrefix: quotePrefix.trim(),
          invoicePrefix: invoicePrefix.trim(),
          taxId: taxId.trim(),
          address: {
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            country: country.trim(),
          },
          branding: {
            logoUrl: logoUrl.trim(),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingOrg(null);
        await loadOrganizations();
        await refreshBusinesses();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Registered Businesses
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Register your company to display your business name and logo on all quotes, proposals, and invoices.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Business</span>
        </button>
      </div>

      {/* Grid of Registered Businesses */}
      {loading ? (
        <div className="p-16 text-center text-sm text-slate-400">Loading registered businesses...</div>
      ) : organizations.length === 0 ? (
        <div className="p-16 bg-white rounded-xl border border-slate-200 text-center">
          <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No businesses registered yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Register your business profile and upload your logo to customize all outgoing client documents.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register First Business</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div
              key={org._id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  {org.branding?.logoUrl ? (
                    <img
                      src={org.branding.logoUrl}
                      alt={org.name}
                      className="w-14 h-14 object-contain rounded-lg border border-slate-200 bg-white p-1 shadow-2xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {org.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(org)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Business Profile & Logo"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBusiness(org._id, org.name)}
                      disabled={deletingId === org._id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Business"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-lg text-slate-900">{org.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{org.email}</span>
                  </div>
                  {org.taxId && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Tax ID: <span className="font-medium text-slate-700">{org.taxId}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <div>
                    Currency: <span className="font-semibold text-slate-700">{org.currency}</span>
                  </div>
                  <div>
                    Quote Prefix: <span className="font-mono text-slate-700 font-semibold">{org.quotePrefix || 'QTE'}</span>
                  </div>
                  <div>
                    Invoice Prefix: <span className="font-mono text-slate-700 font-semibold">{org.invoicePrefix || 'INV'}</span>
                  </div>
                  {org.address?.city && (
                    <div>
                      Location: {org.address.city}, {org.address.country || 'USA'}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Branding live on quotes & invoices</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register / Edit Business Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingOrg ? 'Edit Business Profile' : 'Register Your Business'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Your business name and logo will automatically brand your quotes, proposals, and invoices.
              </p>
            </div>

            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Business / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Design Agency, Swift Technologies..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="md:col-span-2">
                  <LogoUploader value={logoUrl} onChange={setLogoUrl} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Business Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="billing@yourbusiness.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Default Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="CAD">CAD ($) - Canadian Dollar</option>
                    <option value="AUD">AUD ($) - Australian Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Quote Number Prefix
                  </label>
                  <input
                    type="text"
                    placeholder="QTE"
                    value={quotePrefix}
                    onChange={(e) => setQuotePrefix(e.target.value.toUpperCase())}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Invoice Number Prefix
                  </label>
                  <input
                    type="text"
                    placeholder="INV"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tax ID / VAT Registration #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. US-EIN-12-3456789 or GB999999973"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="123 Commerce St"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="San Francisco"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="USA"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  {submitting
                    ? editingOrg
                      ? 'Saving Changes...'
                      : 'Registering...'
                    : editingOrg
                    ? 'Save Changes'
                    : 'Register Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

