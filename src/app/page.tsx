'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ReceiptText,
  FileText,
  ShieldCheck,
  CreditCard,
  Building,
  ArrowRight,
  CheckCircle2,
  Zap,
  Lock,
  Layers,
  Calculator,
  ChevronRight,
  Users,
  Coins,
  FileCheck2,
  TrendingUp,
  Mic,
  Globe,
  Package,
  Landmark,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { OrbitalFeatureDock } from '@/components/OrbitalFeatureDock';
import { SparkleStar } from '@/components/SparkleStar';

export default function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'voice' | 'quotes' | 'invoices' | 'multibusiness' | 'global' | 'precision'
  >('voice');

  return (
    <div className="min-h-screen bg-[#030611] text-slate-100 selection:bg-sky-500/30 selection:text-white font-sans relative overflow-x-hidden">
      {/* Atmospheric Luminous Aura & Concentric Radial Vortex */}
      <div className="absolute top-[280px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full border border-sky-400/[0.12] pointer-events-none shadow-[0_0_100px_rgba(56,189,248,0.12)_inset]" />
      <div className="absolute top-[280px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[980px] h-[980px] rounded-full border border-sky-400/[0.06] pointer-events-none" />
      <div className="absolute top-[280px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1300px] h-[1300px] rounded-full border border-white/[0.02] pointer-events-none" />
      <div className="absolute top-[200px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-gradient-to-b from-sky-400/20 via-blue-600/10 to-transparent blur-[120px] pointer-events-none rounded-full" />

      {/* Permanently Floating Glass Pill Header / Navigation */}
      <header className="fixed top-5 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none">
        <div className="max-w-4xl mx-auto rounded-full bg-[#090e1c]/85 border border-white/[0.12] backdrop-blur-2xl px-6 py-2.5 flex items-center justify-between shadow-[0_16px_40px_rgba(0,0,0,0.7)] pointer-events-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-[0_0_16px_rgba(56,189,248,0.5)]">
              <SparkleStar className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white group-hover:text-sky-200 transition-colors">
              SwiftCent
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-normal text-slate-400">
            <a href="#capabilities" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#multi-business" className="hover:text-white transition-colors">
              Multi-Business
            </a>
            <a
              href="#multi-business"
              onClick={() => setActiveTab('precision')}
              className="hover:text-white transition-colors"
            >
              Math Engine
            </a>
            <a href="#use-cases" className="hover:text-white transition-colors">
              Who It's For
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              Why Switch
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-1.5 bg-[#c8e2fb] hover:bg-white text-[#051124] font-semibold px-4 py-1.5 rounded-full text-xs shadow-[0_0_20px_rgba(200,226,251,0.4)] transition-all transform hover:scale-105 active:scale-95"
              >
                <span>Dashboard ({user.name.split(' ')[0]})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-medium text-slate-300 hover:text-white px-2 py-1 transition-colors hidden sm:inline-block"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-1.5 bg-[#c8e2fb] hover:bg-white text-[#051124] font-semibold px-4 py-1.5 rounded-full text-xs shadow-[0_0_25px_rgba(200,226,251,0.4)] transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>Free Trial</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section (Matching Reference Mockup Aesthetic) */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        {/* Floating Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl text-xs text-slate-300 font-normal tracking-wide shadow-inner mb-8">
          <SparkleStar className="w-3 h-3 text-sky-300" />
          <span>#1 Multi-Entity Invoicing & Billing Engine</span>
        </div>

        {/* Hero Title (Frosted ice metallic gradient & balanced typography) */}
        <h1 className="text-4xl sm:text-6xl md:text-[68px] lg:text-[74px] font-medium tracking-[-0.035em] leading-[1.08] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#d6e7f7] to-[#7fa5c7]">
          The Billing Engine Built for Multi-Brand Precision
        </h1>

        {/* Subtitle (Concise, low-contrast, refined) */}
        <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-lg mx-auto font-normal leading-relaxed">
          Manage all your businesses in one place. Send custom-branded proposals, collect client approvals,
          and receive card payments with exact penny accuracy.
        </p>

        {/* Single Focused Primary CTA Button (Matching Reference) */}
        <div className="mt-9 flex items-center justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2.5 bg-[#c8e2fb] hover:bg-white text-[#051124] font-semibold text-sm px-7 py-3 rounded-full shadow-[0_0_35px_rgba(200,226,251,0.45)] transition-all transform hover:scale-105 active:scale-95"
          >
            <SparkleStar className="w-3.5 h-3.5 text-[#051124]" />
            <span>Start Free Trial</span>
          </Link>
        </div>

        {/* The Signature Interactive Orbital Feature Slider */}
        <OrbitalFeatureDock />
      </section>

      {/* Section 1: Core Platform Pillars (Refined Glassmorphism) */}
      <section id="capabilities" className="scroll-mt-28 py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] uppercase tracking-[0.2em] text-sky-400 font-semibold mb-2 block">
            Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white">
            Built for Real Business Needs
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Everything you need to send professional proposals, get paid faster, and keep all your businesses organized.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Voice Copilot */}
          <div className="group bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.07] hover:border-sky-400/30 rounded-2xl p-7 backdrop-blur-xl transition-all shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/20 text-sky-300 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Voice-to-Quote & Invoice AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Speak naturally to assign clients, add catalog items, switch currencies, and apply taxes with real-time AI typing captions powered by Gemini Live.
            </p>
            <div className="mt-5 pt-4 border-t border-white/[0.05]">
              <Link href="/invoices/new?voice=1" className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline font-medium">
                <span>Try Voice Drafting</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Global Currencies & Banking Rails */}
          <div className="group bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.07] hover:border-sky-400/30 rounded-2xl p-7 backdrop-blur-xl transition-all shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Global Currencies & Bank Rails</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose your preferred workspace currency, override per quote or invoice, and configure local NUBAN, SEPA IBAN, Sort Code, BSB, IFSC, ACH, or SWIFT details.
            </p>
            <div className="mt-5 pt-4 border-t border-white/[0.05]">
              <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline font-medium">
                <span>Configure Rails & Theme</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Multi-Business Profiles */}
          <div className="group bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.07] hover:border-sky-400/30 rounded-2xl p-7 backdrop-blur-xl transition-all shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/20 text-sky-300 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Multi-Business Profiles</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Register multiple brands or LLCs in one account. Upload custom logos, set independent prefixes, and switch active businesses in one click.
            </p>
            <div className="mt-5 pt-4 border-t border-white/[0.05]">
              <Link href="/business" className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline font-medium">
                <span>Manage Businesses</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Quotes Conversion */}
          <div className="group bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.07] hover:border-sky-400/30 rounded-2xl p-7 backdrop-blur-xl transition-all shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-300 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Quotes with 1-Click Conversion</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Send clients interactive proposals with 3 customizable templates. Clients approve online and turn the quote into an active invoice in one second.
            </p>
            <div className="mt-5 pt-4 border-t border-white/[0.05]">
              <Link href="/quotes" className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline font-medium">
                <span>Explore Quotes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 5: Catalog & Client Statements */}
          <div className="group bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.07] hover:border-sky-400/30 rounded-2xl p-7 backdrop-blur-xl transition-all shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/20 text-purple-300 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Product Catalog & Client Portals</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Save services and tax presets for 1-click line-item filling, and give clients live portal links with Stripe checkout and account statements.
            </p>
            <div className="mt-5 pt-4 border-t border-white/[0.05]">
              <Link href="/products" className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline font-medium">
                <span>Browse Catalog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 6: Guaranteed Math Accuracy */}
          <div className="group bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.07] hover:border-sky-400/30 rounded-2xl p-7 backdrop-blur-xl transition-all shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Guaranteed Math Accuracy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No awkward $0.01 rounding discrepancies. Subtotal minus Discounts plus Inclusive or Exclusive Taxes always balances to the exact penny.
            </p>
            <div className="mt-5 pt-4 border-t border-white/[0.05]">
              <Link href="/invoices" className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline font-medium">
                <span>Review Invoices</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Capability Tabs */}
      <section id="multi-business" className="scroll-mt-28 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-sky-400 font-semibold mb-1 block">
              Experience
            </span>
            <h2 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
              Designed for You and Your Clients
            </h2>
          </div>

          {/* Frosted Glass Tabs */}
          <div className="flex flex-wrap items-center justify-center bg-white/[0.03] p-1 rounded-2xl sm:rounded-full border border-white/[0.08] text-xs font-medium backdrop-blur-xl gap-1">
            <button
              onClick={() => setActiveTab('voice')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === 'voice' ? 'bg-[#c8e2fb] text-[#051124] font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Voice Copilot
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === 'global' ? 'bg-[#c8e2fb] text-[#051124] font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Global Rails
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === 'quotes' ? 'bg-[#c8e2fb] text-[#051124] font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Quotes
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === 'invoices' ? 'bg-[#c8e2fb] text-[#051124] font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('multibusiness')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === 'multibusiness' ? 'bg-[#c8e2fb] text-[#051124] font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Multi-Business
            </button>
            <button
              onClick={() => setActiveTab('precision')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === 'precision' ? 'bg-[#c8e2fb] text-[#051124] font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Math Engine
            </button>
          </div>
        </div>

        {/* Tab 0: Voice Copilot */}
        {activeTab === 'voice' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-8 lg:p-12 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="space-y-4">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-sky-300 bg-sky-500/10 border border-sky-400/20 px-3 py-1 rounded-full">
                Gemini Live Copilot
              </span>
              <h3 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
                Speak Your Draft Into Existence
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                Stop clicking through slow forms. Dictate your quote or invoice hands-free and watch items, discounts,
                taxes, and currency updates appear live with real-time AI typing captions.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Fuzzy-matches existing clients & products or creates new clients inline</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Supports instant currency switching per draft (NGN, GBP, EUR, USD, etc.)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Strict billing-only guardrails with automatic idle & spoken sign-off closure</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#080d1a]/90 rounded-2xl p-6 border border-sky-400/20 text-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-white">Voice Draft Copilot · Live</span>
                </div>
                <span className="text-[10px] font-semibold text-sky-300 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-full">
                  Speaking...
                </span>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3.5 text-xs text-slate-200 leading-relaxed">
                &ldquo;Added 2 Engineering Sprints at ₦750,000 each for Acme Labs with 7.5% VAT and net-14 terms.&rdquo;
                <span className="inline-block w-[2px] h-[1em] ml-1 bg-sky-300 animate-pulse align-text-bottom" />
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Assigned client Acme Labs · Currency switched to NGN</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-200 font-medium">
                  <SparkleStar className="w-3 h-3 text-sky-300 shrink-0" />
                  <span>Total calculated: ₦1,612,500.00 (penny-exact)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Global Rails & Multi-Currency */}
        {activeTab === 'global' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-8 lg:p-12 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="space-y-4">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-400/20 px-3 py-1 rounded-full">
                Borderless Billing
              </span>
              <h3 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
                Built for Every Country & Currency
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                No US-only lock-in. Pick any preferred business currency, switch currencies per quote or invoice,
                and display the exact local bank settlement fields your international clients expect.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Searchable flag selectors for global currencies, countries & banking rails</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Adapts fields for NUBAN, SEPA IBAN, Sort Code, BSB, IFSC, EFT & ACH</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Dark Glass default theme with 1-click liquid-glass Light Mode in Settings</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#080d1a]/90 rounded-2xl p-6 border border-white/[0.08] space-y-3 text-xs shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Landmark className="w-4 h-4 text-sky-300" />
                  <span>Regional Bank Rail Presets</span>
                </div>
                <span className="text-[10px] text-slate-400">Auto-mapped to Invoice Footer</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { flag: '🇳🇬', label: 'Nigeria & Africa', rail: 'NUBAN / SWIFT' },
                  { flag: '🇪🇺', label: 'Europe', rail: 'SEPA / IBAN' },
                  { flag: '🇬🇧', label: 'United Kingdom', rail: 'Sort Code / BACS' },
                  { flag: '🇺🇸', label: 'United States', rail: 'ACH / Wire' },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <span>{r.flag}</span>
                      <span>{r.label}</span>
                    </div>
                    <div className="text-[10.5px] text-sky-300">{r.rail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Quotes */}
        {activeTab === 'quotes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-8 lg:p-12 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="space-y-4">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-sky-300 bg-sky-500/10 border border-sky-400/20 px-3 py-1 rounded-full">
                Interactive Quotes
              </span>
              <h3 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
                Win Clients with Branded Proposals
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                Send custom estimates directly from your registered brand. Clients receive a private, secure link where they can review
                the scope of work and formally approve online in seconds.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Automatic proposal expiration dates for clear decision timelines</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Private client review page with one-click "Accept & Approve"</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Converts accepted quotes into invoices with zero retyping</span>
                </li>
              </ul>
            </div>

            {/* Document Preview Card */}
            <div className="bg-white rounded-2xl p-6 text-slate-900 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    AI
                  </div>
                  <div>
                    <div className="font-bold text-sm">Apex Interactive Inc.</div>
                    <div className="text-[11px] text-slate-500">Tax ID: US-APX-987654</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-blue-600">QTE-01004</div>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                    Approved
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-medium text-slate-700">UI/UX Architecture & Prototyping</span>
                  <span className="font-bold">$15,000.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-medium text-slate-700">Cloud Platform Deployment</span>
                  <span className="font-bold">$5,000.00</span>
                </div>
                <div className="pt-2 space-y-1 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800">$20,000.00</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Client Discount (10%):</span>
                    <span>-$2,000.00</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                    <span>Total Proposal:</span>
                    <span className="text-blue-600">$18,000.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Invoices */}
        {activeTab === 'invoices' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-8 lg:p-12 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="space-y-4">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 px-3 py-1 rounded-full">
                Get Paid Faster
              </span>
              <h3 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
                Branded Client Portals & Card Checkout
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                Provide your customers with a private payment page featuring your business logo, clear line items,
                and instant card checkout powered by Stripe.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Accept debit and credit cards with instant payment receipts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Real-time balance tracking and partial payment history</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>One-click PDF download for your client's accounting records</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#080d1a] rounded-2xl p-6 border border-white/[0.08] text-slate-300 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">Private Payment Portal</span>
                </div>
                <span className="text-[10px] text-slate-500">256-bit Encrypted</span>
              </div>
              <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] text-center mb-4">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                  Amount Due
                </div>
                <div className="text-3xl font-bold text-white mt-1">$4,850.00</div>
                <div className="text-xs text-emerald-400 font-medium mt-1">Due in 14 Days</div>
              </div>
              <button
                type="button"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay with Card (Stripe Checkout)</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Multi-Business */}
        {activeTab === 'multibusiness' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-8 lg:p-12 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="space-y-4">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-purple-300 bg-purple-500/10 border border-purple-400/20 px-3 py-1 rounded-full">
                Multi-Brand
              </span>
              <h3 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
                Manage Multiple Businesses from One Login
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                Whether you operate multiple LLCs, run separate brands for different client niches, or offer specialized consulting alongside an agency,
                SwiftCent lets you register unlimited business profiles with custom logos, separate invoice numbers, and individual currencies.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>One-click switcher in top navigation to change active company context</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Choose which company issues each quote or invoice with a simple dropdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Share your client directory across all your businesses seamlessly</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-2 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    SC
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                    Active
                  </span>
                </div>
                <div className="font-semibold text-white text-sm">SwiftCent Studios Inc.</div>
                <div className="text-[11px] text-slate-400">Prefix: SWC-01001</div>
                <div className="text-[10px] text-sky-400 font-medium">USD • San Francisco</div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-2 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                    AX
                  </div>
                  <span className="text-[10px] bg-white/[0.05] text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                    Registered
                  </span>
                </div>
                <div className="font-semibold text-white text-sm">Apex Interactive LLC</div>
                <div className="text-[11px] text-slate-400">Prefix: APX-01001</div>
                <div className="text-[10px] text-purple-300 font-medium">EUR • Berlin</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Math Engine */}
        {activeTab === 'precision' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-8 lg:p-12 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="space-y-4">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/20 px-3 py-1 rounded-full">
                Guaranteed Accuracy
              </span>
              <h3 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
                Totals You and Your Clients Can Always Trust
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                Have you ever sent an invoice where Subtotal minus Discount didn't match the Total because of rounding?
                SwiftCent guarantees your discounts, taxes, and grand totals always add up with complete transparency down to the exact penny.
              </p>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-amber-200/90 space-y-1">
                <div className="text-white font-semibold">
                  Subtotal − Total Discount + Total Tax = What Your Client Pays
                </div>
                <div className="text-slate-400 text-[11px]">
                  Always crystal-clear. Verified on every line item.
                </div>
              </div>
            </div>

            <div className="bg-[#080d1a] rounded-2xl p-6 border border-white/[0.08] space-y-3 text-xs shadow-2xl">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-white/[0.06] pb-2">
                Example Live Invoice Summary
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-mono text-white">$35,000.00</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-400">
                <span>Client Discount (10%):</span>
                <span className="font-mono">-$2,000.00</span>
              </div>
              <div className="flex justify-between py-1 text-slate-400">
                <span>Sales Tax (7.5%):</span>
                <span className="font-mono text-white">+$2,475.00</span>
              </div>
              <div className="flex justify-between py-2 border-t border-white/[0.06] font-bold text-sm text-white">
                <span>Grand Total:</span>
                <span className="font-mono text-sky-400">$35,475.00</span>
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero math confusion. What you see is exactly what your client pays.</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Built for Real-World Business Models */}
      <section id="use-cases" className="scroll-mt-28 py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] uppercase tracking-[0.2em] text-sky-400 font-semibold mb-2 block">
            Who It's For
          </span>
          <h2 className="text-3xl font-medium text-white tracking-tight">
            Built for Modern Businesses
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Engineered specifically for teams, contractors, and founders who want an easy and flexible billing tool.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.15] transition-colors backdrop-blur-xl">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-400/20 text-blue-300 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white text-sm mb-1.5">Creative & Dev Agencies</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Send interactive proposals for discovery and milestone work. Upon client approval, convert them instantly to active invoices.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.15] transition-colors backdrop-blur-xl">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-300 flex items-center justify-center mb-4">
              <Building className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white text-sm mb-1.5">Multi-Brand Founders</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Stop paying for 5 different software subscriptions. Manage all your LLCs, DBAs, and ventures from one centralized dashboard.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.15] transition-colors backdrop-blur-xl">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 flex items-center justify-center mb-4">
              <Coins className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white text-sm mb-1.5">Consultants & Freelancers</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Present a high-tier corporate image with custom logos, formal quotes, and direct credit card processing via Stripe.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.15] transition-colors backdrop-blur-xl">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-400/20 text-purple-300 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white text-sm mb-1.5">Global B2B Businesses</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Multi-currency invoicing (USD, NGN, EUR, GBP, CAD, AUD, INR & custom ISO codes) with regional bank transfer details and permanent audit-ready records.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Sleek Comparison Grid (Replacing Heavy Developer Table) */}
      <section id="comparison" className="scroll-mt-28 py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] uppercase tracking-[0.2em] text-sky-400 font-semibold mb-2 block">
            Why Switch?
          </span>
          <h2 className="text-3xl font-medium text-white tracking-tight">
            SwiftCent vs Traditional Invoicing Systems
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            A simpler, friendlier experience compared to legacy tools like Invoice Ninja.
          </p>
        </div>

        {/* Refined Glass Table */}
        <div className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/[0.03] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 font-semibold">What You Care About</th>
                  <th className="px-6 py-4 font-semibold text-sky-300">SwiftCent</th>
                  <th className="px-6 py-4 font-medium text-slate-500">Traditional Invoicing (e.g. Invoice Ninja)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                <tr className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">AI Voice-to-Document Drafting</td>
                  <td className="px-6 py-4 text-sky-200 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Gemini Live voice copilot fills line items, clients, taxes & currencies in real time</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">Slow manual typing across multi-tab legacy forms</td>
                </tr>
                <tr className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">Global Currencies & Bank Rails</td>
                  <td className="px-6 py-4 text-sky-200 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Per-document currency switching plus NUBAN, SEPA IBAN, Sort Code, IFSC, BSB, ACH & SWIFT</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">US-only ACH/ABA fields or rigid single-currency workspace lock-in</td>
                </tr>
                <tr className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">Managing Multiple Businesses</td>
                  <td className="px-6 py-4 text-sky-200 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Run all your companies & brands from one simple account</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">Requires paying for separate accounts or expensive enterprise upgrades</td>
                </tr>
                <tr className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">Custom Logo & Branding</td>
                  <td className="px-6 py-4 text-sky-200 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Drag & drop your logo with instant live preview on every document</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">Clunky file uploads with rigid formatting and strict image limits</td>
                </tr>
                <tr className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">Math & Rounding Accuracy</td>
                  <td className="px-6 py-4 text-sky-200 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>100% exact math — discounts, taxes, and totals always balance to the penny</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">Frequent $0.01 rounding errors on complex discounts and line taxes</td>
                </tr>
                <tr className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">Quotes to Invoices</td>
                  <td className="px-6 py-4 text-sky-200 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Clients approve proposals online and turn them into invoices in 1 click</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">Manual back-and-forth emails and retyping data into new invoices</td>
                </tr>
                <tr className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">Client Payment Experience</td>
                  <td className="px-6 py-4 text-sky-200 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Private, custom-branded payment links with zero ads or vendor watermarks</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">Generic portals with third-party branding and confusing logins</td>
                </tr>
                <tr className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">Audit & Record Protection</td>
                  <td className="px-6 py-4 text-sky-200 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Past invoices stay locked forever — updating your profile never changes past receipts</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">Changing your company profile accidentally alters historical records</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5: Atmospheric Bottom CTA Banner */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-blue-600/10 to-transparent blur-3xl pointer-events-none rounded-3xl" />
        <div className="relative bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-10 sm:p-14 shadow-2xl backdrop-blur-2xl">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white mx-auto mb-4 shadow-[0_0_25px_rgba(56,189,248,0.5)]">
            <SparkleStar className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
            Ready to Simplify Your Invoicing?
          </h3>
          <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Take control of your billing today. Create your first quote, register your business, or explore the dashboard.
          </p>
          <div className="mt-8 flex items-center justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-[#c8e2fb] hover:bg-white text-[#051124] font-semibold px-8 py-3.5 rounded-full text-xs sm:text-sm shadow-[0_0_30px_rgba(200,226,251,0.4)] transition-all transform hover:scale-105"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
              <SparkleStar className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-slate-400">SwiftCent Platform</span>
            <span>• Built for Multi-Entity Invoicing Simplicity</span>
          </div>
          <div className="flex items-center space-x-6 text-slate-400">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/quotes" className="hover:text-white transition-colors">
              Quotes
            </Link>
            <Link href="/invoices" className="hover:text-white transition-colors">
              Invoices
            </Link>
            <Link href="/business" className="hover:text-white transition-colors">
              Register Business
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
