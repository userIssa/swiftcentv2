'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useVoiceDock } from '@/context/VoiceDockContext';
import {
  Mic,
  MicOff,
  Search,
  Receipt,
  FileText,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  CornerDownLeft,
} from 'lucide-react';

interface DashboardActionHubProps {
  userName?: string;
  businessName?: string;
  currency?: string;
  overdueCount?: number;
  outstandingCents?: number;
}

export function DashboardActionHub({
  userName,
  businessName,
  currency = 'USD',
  overdueCount = 0,
  outstandingCents = 0,
}: DashboardActionHubProps) {
  const router = useRouter();
  const { triggerStartSession } = useVoiceDock();
  const [commandText, setCommandText] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  // Time-aware greeting
  const [greeting, setGreeting] = useState('Welcome back');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Instant invocation of the live SwiftCent Co-Pilot
  const startListening = () => {
    triggerStartSession();
  };

  // Natural Language Intent Processor for Typed Commands
  const processIntent = (query: string) => {
    const q = query.trim().toLowerCase();

    // Invoices
    if (q.includes('new invoice') || q.includes('create invoice') || q.includes('make invoice') || q.includes('bill client') || q.includes('start billing')) {
      setVoiceFeedback('Opening new invoice draft...');
      setTimeout(() => router.push('/invoices/new'), 400);
      return;
    }

    // Voice Invoice
    if (q.includes('voice invoice') || q.includes('speak invoice') || q.includes('draft invoice')) {
      setVoiceFeedback('Launching Voice Invoice Copilot...');
      triggerStartSession();
      setTimeout(() => router.push('/invoices/new'), 400);
      return;
    }

    // Proposals / Quotes
    if (q.includes('quote') || q.includes('proposal') || q.includes('estimate')) {
      if (q.includes('new') || q.includes('create') || q.includes('draft')) {
        setVoiceFeedback('Opening proposal creator...');
        setTimeout(() => router.push('/quotes/new'), 400);
      } else {
        setVoiceFeedback('Opening proposals list...');
        setTimeout(() => router.push('/quotes'), 400);
      }
      return;
    }

    // Payments / Unpaid / Reports
    if (q.includes('payment') || q.includes('unpaid') || q.includes('overdue') || q.includes('receivable') || q.includes('outstanding') || q.includes('money')) {
      setVoiceFeedback('Navigating to unpaid receivables & reports...');
      setTimeout(() => router.push('/reports'), 400);
      return;
    }

    // Reports / Revenue
    if (q.includes('report') || q.includes('revenue') || q.includes('analytics') || q.includes('financial') || q.includes('aging') || q.includes('stat')) {
      setVoiceFeedback('Opening financial reports...');
      setTimeout(() => router.push('/reports'), 400);
      return;
    }

    // Clients
    if (q.includes('client') || q.includes('customer') || q.includes('contact')) {
      setVoiceFeedback('Opening clients directory...');
      setTimeout(() => router.push('/clients'), 400);
      return;
    }

    // Settings / Business
    if (q.includes('setting') || q.includes('profile') || q.includes('business')) {
      setVoiceFeedback('Opening settings...');
      setTimeout(() => router.push('/settings'), 400);
      return;
    }

    // Default: Trigger Co-Pilot to assist directly
    triggerStartSession();
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandText.trim()) {
      triggerStartSession();
      return;
    }
    processIntent(commandText);
  };

  return (
    <div className="space-y-4">
      {/* =========================================================================
          HERO ACTION HUB (WHAT CAN I HELP YOU DO?) - AI CAPSULE & ORB
         ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 border transition-all duration-300 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-sky-400/10 border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:from-[#110e1a] dark:via-[#0c0c0c] dark:to-[#080d1a] dark:border-white/10 dark:shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
        {/* Soft Ambient Aurora Backing Glows */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-pink-400/20 dark:bg-purple-900/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-blue-400/20 dark:bg-blue-900/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Greeting & Workspace Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                {greeting}, {userName ? userName.split(' ')[0] : 'Partner'}
              </span>
              {businessName && (
                <>
                  <span className="text-slate-300 dark:text-neutral-700">•</span>
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200/80 dark:text-sky-300 dark:bg-sky-950/70 dark:border-sky-400/20 px-2.5 py-0.5 rounded-full">
                    {businessName}
                  </span>
                </>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-neutral-500">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>Voice & Natural AI Navigation</span>
            </div>
          </div>

          {/* Prompt Headline */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            What can I help you do?
          </h1>

          {/* MAIN AI CAPSULE INPUT BAR (WITH PURPLE PULSING & ROTATING ORB) */}
          <form
            onSubmit={handleCommandSubmit}
            className="relative flex items-center bg-white dark:bg-[#141414] border border-slate-200/90 dark:border-white/12 rounded-2xl sm:rounded-full p-1.5 sm:p-2 pl-4 sm:pl-5 shadow-sm focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-400/60 dark:focus-within:border-purple-400/40 transition-all gap-2"
          >
            {/* Search / AI Sparkle Icon */}
            <Search className="w-4 h-4 text-slate-400 dark:text-neutral-500 shrink-0 pointer-events-none" />

            {/* Natural Language Task Input */}
            <input
              type="text"
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              placeholder="Ask SwiftCent or type a task: 'create invoice', 'open proposals', 'track payments'..."
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 py-2"
            />

            {/* Action Group: Purple Rotating & Pulsing Orb + Ask Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* THE PURPLE BALL MIC BUTTON (PULSES & ROTATES) */}
              <button
                type="button"
                onClick={startListening}
                className="relative group p-0 rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95 animate-orb-pulse shrink-0"
                title="Tap to Speak with SwiftCent Co-Pilot"
                aria-label="SwiftCent Co-Pilot"
              >
                {/* Glow ring on hover / active */}
                <span className="absolute -inset-1 rounded-full bg-purple-500/30 blur-sm group-hover:bg-purple-500/50 transition-all pointer-events-none" />

                {/* Spherical rotating orb image from uploaded asset */}
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-purple-300/40 dark:border-purple-400/40 shadow-inner">
                  <img
                    src="/images/swift-orb.jpg"
                    alt="SwiftCent Co-Pilot"
                    className="w-full h-full object-cover scale-[1.38] animate-orb-spin-slow group-hover:animate-orb-spin-fast"
                  />

                  {/* Glass highlight overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
                </div>

                {/* Center Frosted Glass Microphone Glyph */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Mic className="w-4 h-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] group-hover:scale-110 transition-transform opacity-95" />
                </div>
              </button>

              {/* Enter / Ask Button */}
              <button
                type="submit"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Execute command"
              >
                <span>Ask</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Voice Feedback Banner */}
          {voiceFeedback && (
            <div className="mt-3 px-3.5 py-2.5 rounded-2xl bg-purple-50/90 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-400/30 text-purple-900 dark:text-purple-200 text-xs flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 animate-spin" />
              <span>{voiceFeedback}</span>
            </div>
          )}

          {/* QUICK ACTION TABS: ICONS THAT EXPAND CLEANLY ON HOVER */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-3.5">
            <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-500 mr-0.5">
              Quick:
            </span>

            {/* Quick Action 1: Create Invoice */}
            <Link
              href="/invoices/new"
              className="group relative flex items-center h-9 px-2.5 rounded-full bg-white/90 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 hover:border-blue-400/60 dark:hover:border-blue-400/40 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 shadow-2xs hover:shadow-xs transition-all duration-300 ease-out cursor-pointer"
              title="Create Invoice — Bill a client in seconds"
            >
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out whitespace-nowrap flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Create Invoice
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:text-neutral-400 dark:group-hover:text-blue-300 shrink-0" />
              </div>
            </Link>

            {/* Quick Action 2: New Proposal */}
            <Link
              href="/quotes/new"
              className="group relative flex items-center h-9 px-2.5 rounded-full bg-white/90 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 hover:border-indigo-400/60 dark:hover:border-indigo-400/40 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 shadow-2xs hover:shadow-xs transition-all duration-300 ease-out cursor-pointer"
              title="New Proposal — Send scopes for approval"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out whitespace-nowrap flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  New Proposal
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 dark:text-neutral-400 dark:group-hover:text-indigo-300 shrink-0" />
              </div>
            </Link>

            {/* Quick Action 3: Track Payments */}
            <Link
              href="/invoices?status=unpaid"
              className="group relative flex items-center h-9 px-2.5 rounded-full bg-white/90 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 hover:border-amber-400/60 dark:hover:border-amber-400/40 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 shadow-2xs hover:shadow-xs transition-all duration-300 ease-out cursor-pointer"
              title="Track Payments — Unpaid & overdue accounts"
            >
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out whitespace-nowrap flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Track Payments
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600 dark:text-neutral-400 dark:group-hover:text-amber-300 shrink-0" />
              </div>
            </Link>

            {/* Quick Action 4: Business Reports */}
            <Link
              href="/reports"
              className="group relative flex items-center h-9 px-2.5 rounded-full bg-white/90 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 hover:border-emerald-400/60 dark:hover:border-emerald-400/40 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 shadow-2xs hover:shadow-xs transition-all duration-300 ease-out cursor-pointer"
              title="Business Reports — Revenue, cashflow & aging"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out whitespace-nowrap flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Business Reports
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 dark:text-neutral-400 dark:group-hover:text-emerald-300 shrink-0" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Urgent Attention Bar (if overdue exists) */}
      {overdueCount > 0 && (
        <Link
          href="/invoices?status=overdue"
          className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200 text-xs font-semibold flex items-center justify-between hover:bg-rose-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>
              {overdueCount} {overdueCount === 1 ? 'invoice is' : 'invoices are'} overdue. Tap to review accounts and send reminders.
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        </Link>
      )}
    </div>
  );
}

