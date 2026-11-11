'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Calculator,
  UserPlus,
  Building,
} from 'lucide-react';
import { calculateInvoice, formatCurrency } from '@/engine/calculator';
import { RawLineItem } from '@/types/financial';
import { NumericInput } from '@/components/NumericInput';
import { VoiceDraftCopilot } from '@/components/VoiceDraftCopilot';
import { useActiveBusiness } from '@/context/ActiveBusinessContext';
import { draftItemsToRawLineItems } from '@/lib/voice/catalog-matcher';
import { useDocumentVoiceBridge } from '@/lib/voice/useDocumentVoiceBridge';
import { VoiceFormLineItem } from '@/lib/voice/types';

type FormLineItem = VoiceFormLineItem;

export default function NewInvoicePage() {
  const router = useRouter();
  const { activeBusiness } = useActiveBusiness();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Payment is appreciated within 14 days of receipt.');
  const [terms, setTerms] = useState(
    'Standard payment terms apply. Please reference the invoice number when submitting payments.'
  );

  const [items, setItems] = useState<FormLineItem[]>([
    {
      id: '1',
      description: 'Professional Consulting / Engineering Services',
      quantity: '10',
      unitPrice: '150',
      discountType: 'percentage',
      discountValue: '0',
      taxName: 'Tax',
      taxRate: '0',
      taxMethod: 'exclusive',
    },
  ]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [orgsRes, clientsRes, prodsRes] = await Promise.all([
          fetch('/api/organizations'),
          fetch('/api/clients'),
          fetch('/api/products'),
        ]);
        const [orgsData, clientsData, prodsData] = await Promise.all([
          orgsRes.json(),
          clientsRes.json(),
          prodsRes.json(),
        ]);

        if (orgsData.success && orgsData.organizations?.length > 0) {
          setOrganizations(orgsData.organizations);
          const preferredId =
            activeBusiness?._id && orgsData.organizations.some((o: any) => o._id === activeBusiness._id)
              ? activeBusiness._id
              : orgsData.organizations[0]._id;
          setSelectedOrgId(preferredId);
          const chosen = orgsData.organizations.find((o: any) => o._id === preferredId);
          if (chosen?.currency) setCurrency(chosen.currency);
        }

        if (clientsData.success && clientsData.clients?.length > 0) {
          setClients(clientsData.clients);
          setSelectedClientId(clientsData.clients[0]._id);
        }

        if (prodsData.success && prodsData.products?.length > 0) {
          setProducts(prodsData.products);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [activeBusiness?._id]);

  const selectedOrg = organizations.find((o) => o._id === selectedOrgId);

  // Compute live calculation using financial engine
  const rawLineItems: RawLineItem[] = draftItemsToRawLineItems(items);

  const liveCalculation = calculateInvoice(rawLineItems, 0);

  const {
    draft: voiceDraft,
    actions: voiceActions,
    voiceDefaultExpanded,
    voiceFlashField,
  } = useDocumentVoiceBridge({
    documentType: 'invoice',
    organizationId: selectedOrgId,
    selectedClientId,
    currency,
    issueDate,
    dueOrValidDate: dueDate,
    notes,
    terms,
    items,
    setClientById: setSelectedClientId,
    setClients,
    setCurrency,
    setIssueDate,
    setDueOrValidDate: setDueDate,
    setNotes,
    setTerms,
    setItems,
  });

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        description: '',
        quantity: '1',
        unitPrice: '0',
        discountType: 'percentage',
        discountValue: '0',
        taxName: 'Tax',
        taxRate: '0',
        taxMethod: 'exclusive',
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateItem = (id: string, field: keyof FormLineItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleSave = async (autoSend: boolean = false) => {
    if (!selectedClientId) {
      alert('Please select or create a client first.');
      return;
    }

    if (items.some((it) => !it.description.trim())) {
      alert('Please fill out descriptions for all line items.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        organizationId: selectedOrgId,
        clientId: selectedClientId,
        currency,
        issueDate,
        dueDate,
        items: rawLineItems,
        notes,
        terms,
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      const createdInvoiceId = data.invoice._id;

      if (autoSend) {
        await fetch(`/api/invoices/${createdInvoiceId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor: 'admin' }),
        });
      }

      router.push(`/invoices/${createdInvoiceId}`);
    } catch (err: any) {
      alert('Error creating invoice: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="@container space-y-6 pb-24">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Link
            href="/invoices"
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">New Invoice</h1>
            <p className="text-xs text-slate-500">Draft a new invoice with real-time financial math.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleSave(false)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Save & Send</span>
          </button>
        </div>
      </div>

      {/* Production Voice-to-Invoice Copilot */}
      <VoiceDraftCopilot
        draft={voiceDraft}
        clients={clients}
        actions={voiceActions}
        defaultExpanded={voiceDefaultExpanded}
      />

      <div className="grid grid-cols-1 @4xl:grid-cols-3 gap-6">
        {/* Left Form: Client, Dates, Line Items */}
        <div className="@4xl:col-span-2 space-y-6">
          {/* Business Branding Picker */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                  Issuing Business
                </h2>
              </div>
              <Link
                href="/business"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                + Register New Business
              </Link>
            </div>

            <div className="grid grid-cols-1 @lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Registered Business <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => {
                    setSelectedOrgId(e.target.value);
                    const chosen = organizations.find((o) => o._id === e.target.value);
                    if (chosen?.currency) setCurrency(chosen.currency);
                  }}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Business Logo Preview Card */}
              {selectedOrg && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                  {selectedOrg.branding?.logoUrl ? (
                    <img
                      src={selectedOrg.branding.logoUrl}
                      alt={selectedOrg.name}
                      className="w-12 h-12 object-contain rounded border border-slate-200 bg-white p-1"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {selectedOrg.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-sm text-slate-900">{selectedOrg.name}</div>
                    <div className="text-xs text-slate-500">
                      {selectedOrg.taxId ? `Tax ID: ${selectedOrg.taxId}` : selectedOrg.email}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium">
                      ✓ Will appear on invoice header & public portal
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Client & Metadata Card */}
          <div
            className={`bg-white p-6 rounded-xl border shadow-sm space-y-4 transition-all duration-300 ${
              voiceFlashField && ['client', 'currency', 'dates'].includes(voiceFlashField)
                ? 'border-blue-400 ring-2 ring-blue-500/25'
                : 'border-slate-200'
            }`}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Invoice Details
            </h2>

            <div className="grid grid-cols-1 @lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Client <span className="text-rose-500">*</span>
                </label>
                {loading ? (
                  <div className="text-xs text-slate-400 py-2">Loading clients...</div>
                ) : clients.length === 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-500">No clients found!</span>
                    <Link
                      href="/clients"
                      className="text-xs text-blue-600 underline font-medium"
                    >
                      Create one first
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div
            className={`bg-white p-6 rounded-xl border shadow-sm space-y-4 transition-all duration-300 ${
              voiceFlashField === 'items'
                ? 'border-blue-400 ring-2 ring-blue-500/25'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Line Items
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((it, idx) => {
                const calculated = liveCalculation.items[idx];
                return (
                  <div
                    key={it.id}
                    className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-slate-600">
                            Description <span className="text-rose-500">*</span>
                          </label>
                          {products.length > 0 && (
                            <select
                              className="text-[11px] text-blue-600 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/60 rounded px-2 py-0.5 font-medium cursor-pointer transition-colors"
                              value=""
                              onChange={(e) => {
                                const p = products.find((prod) => prod._id === e.target.value);
                                if (p) {
                                  updateItem(it.id, 'description', p.name + (p.description ? ` - ${p.description}` : ''));
                                  updateItem(it.id, 'unitPrice', (p.unitPriceCents / 100).toString());
                                  if (p.taxRate !== undefined) updateItem(it.id, 'taxRate', p.taxRate.toString());
                                  if (p.taxMethod) updateItem(it.id, 'taxMethod', p.taxMethod);
                                }
                              }}
                            >
                              <option value="" disabled>+ Fill from Catalog</option>
                              {products.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name} (${(p.unitPriceCents / 100).toFixed(2)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Website Development, Support Retainer..."
                          value={it.description}
                          onChange={(e) => updateItem(it.id, 'description', e.target.value)}
                          className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors mt-6"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 @md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Qty</label>
                        <NumericInput
                          value={it.quantity}
                          onChange={(val) => updateItem(it.id, 'quantity', val)}
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Unit Price ($)
                        </label>
                        <NumericInput
                          value={it.unitPrice}
                          onChange={(val) => updateItem(it.id, 'unitPrice', val)}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Discount (%)
                        </label>
                        <NumericInput
                          value={it.discountValue}
                          onChange={(val) => updateItem(it.id, 'discountValue', val)}
                          placeholder="0"
                          max={100}
                          suffix="%"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Tax Rate (%)
                        </label>
                        <NumericInput
                          value={it.taxRate}
                          onChange={(val) => updateItem(it.id, 'taxRate', val)}
                          placeholder="0"
                          suffix="%"
                        />
                      </div>
                    </div>

                    {calculated && (
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                        <span>
                          Net: {formatCurrency(calculated.netSubtotalCents, currency)}
                          {calculated.lineTaxCents > 0 &&
                            ` + Tax: ${formatCurrency(calculated.lineTaxCents, currency)}`}
                        </span>
                        <span className="font-bold text-slate-900">
                          Total: {formatCurrency(calculated.lineTotalCents, currency)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-slate-400" />
              <span>Add Another Line Item</span>
            </button>
          </div>

          {/* Notes & Terms Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Client Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes visible to the client..."
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Terms
              </label>
              <textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms, bank details, wire instructions..."
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Real-time Calculation Summary */}
        <div className="space-y-6">
          <div className="sticky top-24 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calculator className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Financial Summary</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(liveCalculation.summary.subtotalCents, currency)}</span>
              </div>

              {liveCalculation.summary.totalDiscountCents > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Total Discount</span>
                  <span>
                    -{formatCurrency(liveCalculation.summary.totalDiscountCents, currency)}
                  </span>
                </div>
              )}

              {liveCalculation.summary.totalTaxCents > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Total Tax</span>
                  <span>{formatCurrency(liveCalculation.summary.totalTaxCents, currency)}</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline font-bold text-lg text-slate-900">
                <span>Grand Total</span>
                <span className="text-blue-600">
                  {formatCurrency(liveCalculation.summary.grandTotalCents, currency)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => handleSave(true)}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Processing...' : 'Save & Dispatch'}</span>
              </button>

              <button
                onClick={() => handleSave(false)}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Save as Draft</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

