'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  TrendingUp,
  Compass,
  SlidersHorizontal,
  ShieldCheck,
  Mail,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ThemeTogglePill } from '@/components/ThemeTogglePill';

const STEPS = [
  {
    id: 0,
    stepNumber: '01',
    title: 'Draft Smart Proposals',
    description:
      'Create itemized proposals, configure custom deliverables, and let clients review transparent scopes of work without friction or delay.',
    icon: Compass,
    image: '/images/step-01.jpg',
  },
  {
    id: 1,
    stepNumber: '02',
    title: 'Track Receivables Aging',
    description:
      'Evaluate real-time revenue, aging schedules, and cashflow trends before making critical corporate financial decisions.',
    icon: TrendingUp,
    image: '/images/step-02.jpg',
  },
  {
    id: 2,
    stepNumber: '03',
    title: 'Approve Client Portals',
    description:
      'Clients review itemized deliverables, accept proposals in tokenized portals, and transition accepted work into finalized invoices with one-click execution.',
    icon: SlidersHorizontal,
    image: '/images/step-03.jpg',
  },
  {
    id: 3,
    stepNumber: '04',
    title: 'Settle Ledger Payments',
    description:
      'Protect cash flow with deterministic integer-cent math, immutable audit ledgers, and bank-grade payment security across every single issued financial document.',
    icon: ShieldCheck,
    image: '/images/step-04.jpg',
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, isDark, setTheme } = useTheme();
  const [hoveredStep, setHoveredStep] = useState(1);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
        isDark ? 'bg-[#000000] text-neutral-100' : 'bg-[#ffffff] text-slate-900'
      }`}
    >
      {/* ----------------- TOP NAVIGATION BAR ----------------- */}
      <header className="mx-auto max-w-[1360px] px-6 sm:px-12 pt-6 pb-4 flex items-center justify-between text-sm">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group">
          <img
            src="/images/logo-light.png"
            alt="SwiftCent"
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02] dark:hidden"
          />
          <img
            src="/images/logo-dark.png"
            alt="SwiftCent"
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02] hidden dark:block"
          />
        </Link>

        {/* Right Controls */}
        <div className="flex items-center space-x-4">
          <ThemeTogglePill theme={theme} onChange={setTheme} size="sm" />
          <Link
            href={user ? '/dashboard' : '/login'}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity shadow-sm"
          >
            {user ? 'Dashboard' : 'Sign In'}
          </Link>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION (SWIFTCENT ASYMMETRICAL NOTCHED SHELF HERO)
         ========================================================================= */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-8 pt-4 pb-16 sm:pb-24">
        {/* Outer Canvas Container */}
        <div className="relative mx-auto max-w-[1240px]">
          {/* Desktop Layout (lg+) with authentic SwiftCent notched shelf cutout */}
          <div className="hidden lg:grid lg:grid-cols-12 items-stretch min-h-[600px]">
            {/* Left Column (col-span-7): Top Card + Bottom Stats Shelf */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              {/* Top Hero Card */}
              <div
                className={`relative p-10 xl:p-14 rounded-tl-[44px] rounded-bl-[44px] transition-colors border-l border-t border-b ${
                  isDark ? 'bg-[#111111] border-white/5' : 'bg-[#d3d7da] border-transparent'
                }`}
              >
                {/* Fillet in the bottom-right corner connecting to right column */}
                <div className="absolute top-full right-0 w-8 h-8 pointer-events-none overflow-hidden z-20">
                  <svg
                    viewBox="0 0 32 32"
                    className={`w-8 h-8 ${isDark ? 'text-[#111111]' : 'text-[#d3d7da]'}`}
                    fill="currentColor"
                  >
                    <path d="M 0 0 A 32 32 0 0 1 32 32 L 32 0 Z" />
                  </svg>
                </div>

                <div className="space-y-6 max-w-xl">
                  {/* Top Pill Badge */}
                  <div>
                    <div
                      className={`inline-flex items-center rounded-full text-xs px-4 py-1.5 shadow-sm border ${
                        isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-[#2a3038] border-transparent'
                      }`}
                    >
                      <span className="text-white/75 font-normal">5000+ invoices settled today</span>
                      <span className="font-semibold text-white ml-2.5 flex items-center gap-1.5">
                        <span>Start now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Headline */}
                  <h1
                    className={`text-5xl xl:text-[62px] font-bold tracking-[-0.035em] leading-[1.08] ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Automate Your Invoicing <br />
                    Faster with <br />
                    SwiftCent
                  </h1>

                  {/* Subtitle */}
                  <p
                    className={`text-sm xl:text-base leading-relaxed max-w-md font-normal ${
                      isDark ? 'text-neutral-400' : 'text-slate-600'
                    }`}
                  >
                    Speed up your cash flow with our high-precision billing engine for enterprises. Enjoy
                    deterministic, exact-cent calculations for a seamless, transparent invoice experience.
                  </p>

                  {/* Two Action Buttons */}
                  <div className="pt-4 flex items-center gap-3.5">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-slate-900 font-semibold text-sm shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
                    >
                      <span>Start billing now</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <a
                      href="#learn-more"
                      className="inline-flex items-center px-7 py-3.5 rounded-full bg-[#1e2024] hover:bg-black text-white font-semibold text-sm transition-all transform hover:scale-105 active:scale-95 shadow-md"
                    >
                      Learn more
                    </a>
                  </div>
                </div>
              </div>

              {/* Bottom Cutout Shelf & Stats Row */}
              <div className="pt-8 pb-4 pl-4 pr-6">
                <div className="grid grid-cols-4 gap-6 max-w-xl">
                  <div className="space-y-1">
                    <div
                      className={`text-3xl font-bold tracking-tight ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      100%
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">Precision</div>
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`text-3xl font-bold tracking-tight ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      &lt;60s
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">Settlement</div>
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`text-3xl font-bold tracking-tight ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      10k+
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">Invoices</div>
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`text-3xl font-bold tracking-tight ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      99.9%
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">Uptime</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (col-span-5): Full Height Card with 3D Robot Mascot */}
            <div
              className={`lg:col-span-5 relative rounded-tr-[44px] rounded-br-[44px] rounded-bl-[44px] flex items-end justify-center overflow-hidden transition-colors border-r border-t border-b ${
                isDark ? 'bg-[#111111] border-white/5' : 'bg-[#d3d7da] border-transparent'
              }`}
            >
              <img
                src="/images/robot-hd.png"
                alt="SwiftCent 3D Mascot Character"
                className="w-full h-auto max-h-[640px] object-contain object-bottom select-none pointer-events-none drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Mobile & Tablet Layout (< lg) */}
          <div className="lg:hidden space-y-8">
            <div
              className={`rounded-[36px] overflow-hidden p-8 sm:p-12 transition-colors border ${
                isDark ? 'bg-[#111111] border-white/5' : 'bg-[#d3d7da] border-transparent'
              }`}
            >
              <div className="space-y-6">
                {/* Badge */}
                <div
                  className={`inline-flex items-center rounded-full text-xs px-4 py-1.5 shadow-sm border ${
                    isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-[#2a3038] border-transparent'
                  }`}
                >
                  <span className="text-white/75 font-normal">5000+ invoices settled today</span>
                  <span className="font-semibold text-white ml-2.5 flex items-center gap-1.5">
                    <span>Start now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Headline */}
                <h1
                  className={`text-4xl sm:text-5xl font-bold tracking-[-0.035em] leading-[1.1] ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Automate Your Invoicing <br />
                  Faster with <br />
                  SwiftCent
                </h1>

                {/* Subtitle */}
                <p
                  className={`text-sm sm:text-base leading-relaxed font-normal ${
                    isDark ? 'text-neutral-400' : 'text-slate-600'
                  }`}
                >
                  Speed up your cash flow with our high-precision billing engine for enterprises. Enjoy
                  deterministic, exact-cent calculations for a seamless, transparent invoice experience.
                </p>

                {/* Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3.5">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-slate-900 font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    <span>Start billing now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#learn-more"
                    className="inline-flex items-center px-6 py-3 rounded-full bg-[#1e2024] text-white font-semibold text-xs sm:text-sm transition-all shadow-md"
                  >
                    Learn more
                  </a>
                </div>
              </div>

              {/* Robot mascot image */}
              <div className="pt-8 flex justify-center">
                <img
                  src="/images/robot-hd.png"
                  alt="SwiftCent 3D Mascot Character"
                  className="w-full max-w-[340px] sm:max-w-[420px] h-auto object-contain object-bottom drop-shadow-xl"
                />
              </div>
            </div>

            {/* Stats below card on mobile */}
            <div className="px-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <div
                    className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    100%
                  </div>
                  <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">Precision</div>
                </div>
                <div className="space-y-1">
                  <div
                    className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    &lt;60s
                  </div>
                  <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">Settlement</div>
                </div>
                <div className="space-y-1">
                  <div
                    className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    10k+
                  </div>
                  <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">Invoices</div>
                </div>
                <div className="space-y-1">
                  <div
                    className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    99.9%
                  </div>
                  <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: PROCESS & CORE CAPABILITIES (INSPO: HOW IT WORKS STEPPER)
         ========================================================================= */}
      <section id="how-it-works" className="mx-auto max-w-[1360px] px-6 sm:px-12 py-20 sm:py-28">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-14 sm:mb-16">
          {/* Badge with inspo corner accent */}
          <div className="inline-flex items-center justify-center">
            <div className="relative inline-block text-xs font-semibold tracking-wider">
              <div
                className={`absolute -top-2.5 left-0 w-3.5 h-2 border-t-2 border-l-2 rounded-tl-sm ${
                  isDark ? 'border-white' : 'border-neutral-900'
                }`}
              />
              <span
                className={`px-1 text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                How It Works
              </span>
            </div>
          </div>

          {/* Heading - explicitly respecting isDark so it can never be white on white */}
          <h2
            className={`text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-[-0.03em] leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            From Proposal to Settlement — Simplified
          </h2>

          {/* Subtitle - explicitly respecting isDark */}
          <p
            className={`text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-normal ${
              isDark ? 'text-neutral-400' : 'text-slate-600'
            }`}
          >
            Our streamlined engine helps you author, dispatch, and collect receivables without unnecessary complexity.
          </p>
        </div>

        {/* Desktop Interactive Expanding Stepper (lg+) with Hover Animation */}
        <div className="hidden lg:flex items-stretch gap-6 min-h-[460px]">
          {STEPS.map((step) => {
            const isHovered = hoveredStep === step.id;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                onMouseEnter={() => setHoveredStep(step.id)}
                onClick={() => setHoveredStep(step.id)}
                className={`group relative rounded-[28px] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) cursor-pointer overflow-hidden border ${
                  isHovered
                    ? isDark
                      ? 'flex-[2.3] xl:flex-[2.5] bg-[#141414] border-white/20 shadow-2xl shadow-black/80 p-6'
                      : 'flex-[2.3] xl:flex-[2.5] bg-white border-slate-300 shadow-xl shadow-slate-200/70 p-6'
                    : isDark
                      ? 'flex-1 bg-[#0a0a0a] border-white/10 hover:border-white/20 p-7'
                      : 'flex-1 bg-[#f8fafc] border-slate-200/90 hover:border-slate-300 hover:bg-slate-100/70 p-7'
                } flex flex-col justify-between`}
              >
                {/* TOP AREA: Image when hovered, Large Step Number when inactive */}
                <div className="relative">
                  {/* Big Number (Shown when inactive, fades out when hovered) */}
                  <div
                    className={`transition-all duration-300 ${
                      isHovered
                        ? 'opacity-0 h-0 overflow-hidden'
                        : `opacity-100 text-3xl sm:text-4xl font-bold tracking-tight mb-6 ${
                            isDark
                              ? 'text-neutral-700 group-hover:text-neutral-500'
                              : 'text-slate-300 group-hover:text-slate-400'
                          }`
                    }`}
                  >
                    {step.stepNumber}
                  </div>

                  {/* Image Banner (Smoothly scales & reveals when hovered) */}
                  <div
                    className={`transition-all duration-500 ease-out overflow-hidden rounded-[20px] shadow-sm ${
                      isDark ? 'bg-[#181818]' : 'bg-slate-100'
                    } ${
                      isHovered
                        ? 'h-[175px] sm:h-[195px] opacity-100 mb-5 scale-100'
                        : 'h-0 opacity-0 mb-0 scale-95 pointer-events-none'
                    }`}
                  >
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 select-none"
                    />
                  </div>
                </div>

                {/* BOTTOM AREA: Icon, Title, and Description */}
                <div className="flex flex-col justify-end">
                  {/* Icon in Circle Badge */}
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 mb-3.5 ${
                      isHovered
                        ? isDark
                          ? 'border-white/30 bg-white/15 text-white shadow-sm'
                          : 'border-slate-300 bg-slate-100 text-slate-900 shadow-xs'
                        : isDark
                          ? 'border-white/10 bg-white/5 text-neutral-400 group-hover:text-neutral-200'
                          : 'border-slate-200 bg-white text-slate-500 group-hover:text-slate-700 shadow-xs'
                    }`}
                  >
                    <Icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  {/* Title */}
                  <h3
                    className={`font-bold tracking-tight transition-all duration-300 leading-snug ${
                      isHovered
                        ? isDark
                          ? 'text-lg sm:text-xl text-white mb-2'
                          : 'text-lg sm:text-xl text-slate-900 mb-2'
                        : isDark
                          ? 'text-base text-neutral-200 group-hover:text-white'
                          : 'text-base text-slate-800 group-hover:text-slate-900'
                    }`}
                  >
                    {step.title}
                  </h3>

                  {/* Description (Smoothly reveals when hovered) */}
                  <div
                    className={`transition-all duration-400 ease-out ${
                      isHovered
                        ? 'opacity-100 max-h-28 mt-1'
                        : 'opacity-0 max-h-0 overflow-hidden'
                    }`}
                  >
                    <p
                      className={`text-xs sm:text-sm leading-relaxed font-normal ${
                        isDark ? 'text-neutral-300' : 'text-slate-600'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile & Tablet Stepper View (< lg) */}
        <div className="lg:hidden space-y-4">
          {/* Stepper Tabs */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => setHoveredStep(step.id)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  hoveredStep === step.id
                    ? isDark
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-slate-900 text-white shadow-sm'
                    : isDark
                      ? 'bg-[#141414] text-neutral-400'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {step.stepNumber}
              </button>
            ))}
          </div>

          {/* Active Card Display */}
          {(() => {
            const step = STEPS[hoveredStep];
            const Icon = step.icon;
            return (
              <div
                className={`rounded-[28px] p-6 shadow-md border ${
                  isDark
                    ? 'bg-[#141414] border-white/20'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div
                  className={`w-full h-[180px] rounded-[20px] overflow-hidden mb-6 relative ${
                    isDark ? 'bg-[#181818]' : 'bg-slate-100'
                  }`}
                >
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover select-none"
                  />
                </div>
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center mb-3 ${
                    isDark
                      ? 'border-white/30 bg-white/15 text-white'
                      : 'border-slate-300 bg-slate-100 text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h3
                  className={`text-xl font-bold tracking-tight mb-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-xs sm:text-sm leading-relaxed font-normal ${
                    isDark ? 'text-neutral-300' : 'text-slate-600'
                  }`}
                >
                  {step.description}
                </p>
              </div>
            );
          })()}
        </div>
      </section>

      {/* =========================================================================
          NEWSLETTER SECTION (ELEGANT FLOATING BENTO CARD)
         ========================================================================= */}
      <section className="mx-auto max-w-[1360px] px-6 sm:px-12 py-12 sm:py-16">
        <div
          className={`mx-auto max-w-[1240px] rounded-[32px] sm:rounded-[44px] p-8 sm:p-12 lg:p-16 border transition-all ${
            isDark
              ? 'bg-[#0c0c0c] border-white/10 shadow-2xl shadow-black/80'
              : 'bg-[#f8fafc] border-slate-200/90 shadow-xl'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
            {/* Left Column: Visual Banner */}
            <div className="lg:col-span-5 relative">
              <div
                className={`rounded-[24px] sm:rounded-[32px] overflow-hidden aspect-[4/3] relative shadow-md border ${
                  isDark ? 'border-white/10 bg-[#161616]' : 'border-slate-200 bg-white'
                }`}
              >
                <img
                  src="/images/step-01.jpg"
                  alt="Billing updates"
                  className="w-full h-full object-cover select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Right Column: Copy & Signup Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                  isDark
                    ? 'bg-neutral-800 text-neutral-300'
                    : 'bg-slate-200/70 text-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>STAY UPDATED</span>
              </div>

              {/* Headline */}
              <h2
                className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Get the latest <br />
                billing insights
              </h2>

              {/* Subtitle */}
              <p
                className={`text-sm sm:text-base leading-relaxed max-w-lg font-normal ${
                  isDark ? 'text-neutral-400' : 'text-slate-600'
                }`}
              >
                Join our newsletter to receive the latest billing releases, modern invoicing workflows,
                and financial updates directly in your inbox.
              </p>

              {/* Email Subscription Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail) setSubscribed(true);
                }}
                className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md"
              >
                <div className="relative flex-1">
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? 'text-neutral-500' : 'text-slate-400'
                    }`}
                  />
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Your email address"
                    className={`w-full pl-11 pr-4 py-3.5 rounded-full text-xs sm:text-sm border transition-all outline-none ${
                      isDark
                        ? 'bg-[#161616] border-white/10 text-white placeholder-neutral-500 focus:border-white/50'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-neutral-900 shadow-xs'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className={`px-7 py-3.5 rounded-full font-semibold text-xs sm:text-sm transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-white text-black hover:bg-neutral-200'
                      : 'bg-[#181c24] text-white hover:bg-black'
                  }`}
                >
                  {subscribed ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Subscribed!</span>
                    </>
                  ) : (
                    <>
                      <span>Subscribe</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER (FULL-WIDTH PAGE EXTENSION WITH PARTICLE MOUNTAIN & MONUMENTAL TYPOGRAPHY)
         ========================================================================= */}
      <footer className="w-full bg-[#000000] text-neutral-200 relative overflow-hidden mt-10 sm:mt-14 border-t border-white/10">
        {/* Top Row: Brand Info (Left) + Nav Columns (Right) */}
        <div className="relative z-10 mx-auto max-w-[1360px] px-6 sm:px-12 pt-8 sm:pt-10 lg:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Brand Column (col-span-5) */}
            <div className="lg:col-span-5 space-y-3">
              {/* Brand Logo */}
              <div className="flex items-center">
                <img
                  src="/images/logo-dark.png"
                  alt="SwiftCent"
                  className="h-8 sm:h-9 w-auto object-contain"
                />
              </div>

              {/* Mission Statement */}
              <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed font-normal">
                Enterprise billing tools and precision infrastructure for teams who move fast, every single day.
              </p>

              {/* Social Links */}
              <div className="flex items-center space-x-3 pt-0.5">
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold text-white transition-all hover:scale-110"
                  aria-label="X (Twitter)"
                >
                  𝕏
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold text-white transition-all hover:scale-110"
                  aria-label="LinkedIn"
                >
                  in
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold text-white transition-all hover:scale-110"
                  aria-label="GitHub"
                >
                  gh
                </a>
              </div>

              {/* Copyright */}
              <div className="pt-1 text-xs text-neutral-500 font-normal">
                © 2026 SwiftCent Inc. All rights reserved.
              </div>
            </div>

            {/* Right Navigation Columns (col-span-7) */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              {/* Product Column */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Product
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm">
                  <li>
                    <a href="#features" className="text-neutral-400 hover:text-white transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="text-neutral-400 hover:text-white transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#changelog" className="text-neutral-400 hover:text-white transition-colors">
                      Changelog
                    </a>
                  </li>
                  <li>
                    <a href="#integrations" className="text-neutral-400 hover:text-white transition-colors">
                      Integrations
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company Column */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Company
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm">
                  <li>
                    <a href="#about" className="text-neutral-400 hover:text-white transition-colors">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#careers" className="text-neutral-400 hover:text-white transition-colors">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="text-neutral-400 hover:text-white transition-colors">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="#press" className="text-neutral-400 hover:text-white transition-colors">
                      Press
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources Column */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Resources
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm">
                  <li>
                    <a href="#docs" className="text-neutral-400 hover:text-white transition-colors">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#blogs" className="text-neutral-400 hover:text-white transition-colors">
                      Blogs
                    </a>
                  </li>
                  <li>
                    <a href="#community" className="text-neutral-400 hover:text-white transition-colors">
                      Community
                    </a>
                  </li>
                  <li>
                    <a href="#tutorials" className="text-neutral-400 hover:text-white transition-colors">
                      Tutorials
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal Column */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Legal
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm">
                  <li>
                    <a href="#privacy" className="text-neutral-400 hover:text-white transition-colors">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#terms" className="text-neutral-400 hover:text-white transition-colors">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="#security" className="text-neutral-400 hover:text-white transition-colors">
                      Security
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Center Graphic: Luminous Particle Mountain Peak (Full Width) */}
        <div className="absolute inset-x-0 bottom-0 h-[180px] sm:h-[220px] lg:h-[260px] pointer-events-none select-none z-0 overflow-hidden">
          <img
            src="/images/footer-particles.jpg"
            alt=""
            className="w-full h-full object-cover object-bottom opacity-85 select-none"
          />
          {/* Soft gradient fade on sides and top */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-black/40 to-black pointer-events-none" />
        </div>

        {/* Bottom Layer: Monumental Typography Anchored Directly to Page Bottom */}
        <div className="relative z-10 pt-4 sm:pt-6 pb-0 text-center select-none overflow-hidden leading-none">
          <h2 className="text-[12vw] sm:text-[13vw] font-bold tracking-[-0.045em] text-white/95 leading-none select-none pointer-events-none font-sans drop-shadow-2xl">
            SwiftCent
          </h2>
        </div>
      </footer>
    </div>
  );
}
