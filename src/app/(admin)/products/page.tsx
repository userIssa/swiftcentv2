'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Percent,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '@/engine/calculator';
import { getCurrencySymbol } from '@/lib/currencies';
import { useActiveBusiness } from '@/context/ActiveBusinessContext';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';

interface ProductItem {
  _id: string;
  name: string;
  description?: string;
  unitPriceCents: number;
  taxRate?: number;
  taxMethod?: 'exclusive' | 'inclusive';
}

export default function ProductsPage() {
  const { activeBusiness, loading: businessLoading } = useActiveBusiness();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [taxMethod, setTaxMethod] = useState<'exclusive' | 'inclusive'>('exclusive');
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const url = activeBusiness?._id
        ? `/api/products?organizationId=${activeBusiness._id}`
        : '/api/products';
      const data = await fetchJsonWithBuffer(url, { timeoutMs: 15000, retry: true });
      if (data.success && data.products) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessLoading) {
      setLoading(true);
      return;
    }
    loadProducts();
  }, [activeBusiness?._id, businessLoading]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setUnitPrice('');
    setTaxRate('0');
    setTaxMethod('exclusive');
    setShowModal(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setUnitPrice((p.unitPriceCents / 100).toFixed(2));
    setTaxRate(String(p.taxRate || 0));
    setTaxMethod(p.taxMethod || 'exclusive');
    setShowModal(true);
  };

  const handleDelete = async (id: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}" from your catalog?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadProducts();
      } else {
        alert(data.error || 'Failed to delete product');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a product or service name');
      return;
    }

    const priceCents = Math.round(parseFloat(unitPrice || '0') * 100);
    if (priceCents < 0) {
      alert('Price cannot be negative');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        organizationId: activeBusiness?._id,
        name: name.trim(),
        description: description.trim(),
        unitPriceCents: priceCents,
        taxRate: parseFloat(taxRate) || 0,
        taxMethod,
      };

      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        await loadProducts();
      } else {
        alert(data.error || 'Failed to save product');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Products & Services
            </h1>
            {activeBusiness?.name && (
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-full">
                {activeBusiness.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pre-configured deliverables, items, and billing rates for 1-click invoice and quote creation.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Product / Service</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Package className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Catalog Items ({filtered.length})
            </h2>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalog by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-3 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 text-sm">No products or services yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your standard service packages or hourly rates to auto-fill them when drafting invoices.
            </p>
            <div className="mt-4">
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Item</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Item & Deliverable</th>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold">Default Price</th>
                  <th className="pb-3 font-semibold">Tax Rate</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                    </td>
                    <td className="py-3.5 pr-4 max-w-xs text-slate-500 truncate">
                      {item.description || '—'}
                    </td>
                    <td className="py-3.5 pr-4 font-semibold text-slate-900">
                      {formatCurrency(item.unitPriceCents, activeBusiness?.currency || 'USD')}
                    </td>
                    <td className="py-3.5 pr-4">
                      {item.taxRate && item.taxRate > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.taxRate}% {item.taxMethod || 'exclusive'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No Tax</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id, item.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Product */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Catalog Item' : 'New Product / Service'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item / Deliverable Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Infrastructure Setup, Retainer, UI Audit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed breakdown of work or deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Unit Price ({activeBusiness?.currency || 'USD'}) *
                  </label>
                  <div className="relative">
                    <span className="text-[11px] font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {getCurrencySymbol(activeBusiness?.currency || 'USD')}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <div className="relative">
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tax Calculation Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTaxMethod('exclusive')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      taxMethod === 'exclusive'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Exclusive (Added on top)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxMethod('inclusive')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      taxMethod === 'inclusive'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Inclusive (Included in price)
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

