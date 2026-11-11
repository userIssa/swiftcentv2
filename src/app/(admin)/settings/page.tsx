'use client';

import React, { useState, useEffect } from 'react';
import { useActiveBusiness } from '@/context/ActiveBusinessContext';
import { useAuth } from '@/context/AuthContext';
import { CurrencySelect } from '@/components/CurrencySelect';
import { SearchableCombobox } from '@/components/SearchableCombobox';
import {
  BANKING_REGION_PRESETS,
  getBankingPreset,
  inferDefaultBankingRegion,
} from '@/lib/banking-regions';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';
import { clearSampleWorkspaceData, loadSampleWorkspaceData } from '@/lib/sample-data-client';
import {
  CreditCard,
  Building,
  Check,
  Shield,
  FileText,
  DollarSign,
  Save,
  Lock,
  Globe,
  Landmark,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Database,
  Trash2,
} from 'lucide-react';

export default function SettingsPage() {
  const { activeBusiness, refreshBusinesses } = useActiveBusiness();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sampleAction, setSampleAction] = useState<'load' | 'clear' | null>(null);
  const [sampleMessage, setSampleMessage] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const handleSampleAction = async (mode: 'load' | 'clear') => {
    try {
      setSampleAction(mode);
      setSampleMessage(null);
      const data =
        mode === 'load'
          ? await loadSampleWorkspaceData(activeBusiness?._id)
          : await clearSampleWorkspaceData(activeBusiness?._id);
      if (data.success) {
        setSampleMessage(
          data.message ||
            (mode === 'load'
              ? 'Sample data populated.'
              : 'Sample data removed from your workspace.')
        );
        await refreshBusinesses();
      } else {
        alert(data.error || `Failed to ${mode} sample data`);
      }
    } catch (err: any) {
      alert(err.message || `Error trying to ${mode} sample data`);
    } finally {
      setSampleAction(null);
    }
  };

  // Form State
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [quotePrefix, setQuotePrefix] = useState('QTE');
  const [taxId, setTaxId] = useState('');

  // Global Bank Transfer & Settlement State
  const [bankRegion, setBankRegion] = useState('global');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [bankInstructions, setBankInstructions] = useState('');

  useEffect(() => {
    if (activeBusiness) {
      setCurrency(activeBusiness.currency || 'USD');
      setInvoicePrefix(activeBusiness.invoicePrefix || 'INV');
      setQuotePrefix(activeBusiness.quotePrefix || 'QTE');
      setTaxId(activeBusiness.taxId || '');

      // Load full organization details with cold-start retry buffer
      fetchJsonWithBuffer(`/api/organizations/${activeBusiness._id}`, {
        timeoutMs: 15000,
        retry: true,
      })
        .then((data) => {
          if (data.success && data.organization) {
            const org = data.organization;
            setStripeEnabled(org.paymentGateways?.stripeEnabled ?? false);
            setStripePublishableKey(org.paymentGateways?.stripePublishableKey || '');
            setStripeSecretKey(org.paymentGateways?.stripeSecretKey || '');

            if (org.wireInstructions) {
              setBankRegion(
                org.wireInstructions.bankRegion ||
                  inferDefaultBankingRegion(org.currency || activeBusiness.currency)
              );
              setBankName(org.wireInstructions.bankName || '');
              setAccountName(org.wireInstructions.accountName || '');
              setAccountNumber(org.wireInstructions.accountNumber || '');
              setRoutingNumber(org.wireInstructions.routingNumber || '');
              setSwiftCode(org.wireInstructions.swiftCode || '');
              setBankInstructions(org.wireInstructions.instructions || '');
            } else {
              setBankRegion(inferDefaultBankingRegion(org.currency || activeBusiness.currency));
              setBankInstructions('');
            }
          }
        })
        .catch(console.error);
    }
  }, [activeBusiness?._id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?._id) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/organizations/${activeBusiness._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency,
          invoicePrefix,
          quotePrefix,
          taxId,
          paymentGateways: {
            stripeEnabled,
            stripePublishableKey,
            stripeSecretKey,
          },
          wireInstructions: {
            bankRegion,
            bankName,
            accountName,
            accountNumber,
            routingNumber,
            swiftCode,
            instructions: bankInstructions,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        await refreshBusinesses();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to update settings');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const bankingPreset = getBankingPreset(bankRegion, currency);

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings & Integrations
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage payment gateways, bank transfer details, and billing policies for{' '}
          <span className="font-semibold text-slate-800">{activeBusiness?.name || 'your workspace'}</span>.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Stripe & Payment Gateways */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Online Payments (Stripe)</h3>
                <p className="text-xs text-slate-400">Accept Credit/Debit cards, Apple Pay, and Google Pay</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={stripeEnabled}
                onChange={(e) => setStripeEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Stripe Publishable Key
              </label>
              <input
                type="text"
                placeholder="pk_test_51Mz..."
                value={stripePublishableKey}
                onChange={(e) => setStripePublishableKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Stripe Secret Key
              </label>
              <div className="relative">
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  placeholder="sk_test_51Mz..."
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-9 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Customer payment credentials are tokenized directly with Stripe and never hit your server.</span>
          </div>
        </div>

        {/* Section 2: Global Bank Transfer & Settlement Instructions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Bank Transfer & Settlement Details</h3>
                <p className="text-xs text-slate-400">
                  Works globally for NUBAN, SEPA / IBAN, Sort Code, BSB, IFSC, ACH, and SWIFT wires
                </p>
              </div>
            </div>

            <div className="w-full sm:w-[21rem] shrink-0">
              <SearchableCombobox
                value={bankRegion}
                onChange={setBankRegion}
                searchCaption="Select Banking Region"
                ariaLabel="Banking Region / Transfer System"
                options={BANKING_REGION_PRESETS.map((preset) => ({
                  value: preset.id,
                  label: preset.label,
                  icon: preset.flag,
                  searchText: [
                    preset.label,
                    preset.routingLabel,
                    preset.accountLabel,
                    preset.swiftLabel,
                  ].join(' '),
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                placeholder={bankingPreset.bankPlaceholder}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Account Holder / Beneficiary Name
              </label>
              <input
                type="text"
                placeholder={bankingPreset.accountHolderPlaceholder}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {bankingPreset.accountLabel}
              </label>
              <input
                type="text"
                placeholder={bankingPreset.accountPlaceholder}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {bankingPreset.routingLabel}
              </label>
              <input
                type="text"
                placeholder={bankingPreset.routingPlaceholder}
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {bankingPreset.swiftLabel}
              </label>
              <input
                type="text"
                placeholder={bankingPreset.swiftPlaceholder}
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Additional Settlement Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder={bankingPreset.instructionsPlaceholder}
                value={bankInstructions}
                onChange={(e) => setBankInstructions(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Billing & Document Defaults */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Document Defaults & Currency</h3>
              <p className="text-xs text-slate-400">Prefixes, Tax ID, and default currency rules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Currency
              </label>
              <CurrencySelect
                value={currency}
                onChange={setCurrency}
                compact
                ariaLabel="Default Currency"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Quote Prefix
              </label>
              <input
                type="text"
                value={quotePrefix}
                onChange={(e) => setQuotePrefix(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tax ID / VAT / TIN Registration
              </label>
              <input
                type="text"
                placeholder="e.g. VAT, TIN, GST, ABN, or EIN"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {user?.canLoadSampleData && (
        <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Developer Account · Sample Data</h3>
                <p className="text-xs text-slate-400">
                  Visible only to accounts allowlisted in <code className="text-sky-300">DEV_SAMPLE_ACCOUNT_EMAILS</code>.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSampleAction('load')}
                disabled={sampleAction !== null}
                className="inline-flex items-center gap-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{sampleAction === 'load' ? 'Loading...' : 'Load Sample Data'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSampleAction('clear')}
                disabled={sampleAction !== null}
                className="inline-flex items-center gap-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-400/30 font-bold px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{sampleAction === 'clear' ? 'Removing...' : 'Clear Sample Data'}</span>
              </button>
            </div>
          </div>
          {sampleMessage && (
            <div className="text-xs text-emerald-300 font-medium pt-1">
              ✓ {sampleMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

