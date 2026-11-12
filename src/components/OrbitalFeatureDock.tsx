'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Building,
  FileText,
  Zap,
  ShieldCheck,
  CreditCard,
  Lock,
  Users,
  Calculator,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SparkleStar } from '@/components/SparkleStar';

export interface OrbitalFeatureItem {
  id: string;
  title: string;
  description: string;
  tag: string;
  icon: 'building' | 'quote' | 'zap' | 'shield' | 'sparkle' | 'card' | 'lock' | 'users' | 'calc';
}

export const ORBITAL_FEATURES: OrbitalFeatureItem[] = [
  {
    id: 'multi-business',
    title: 'Multi-Business Management',
    description: 'Run distinct brands, logos, currencies, and numbering sequences in one login.',
    tag: 'Workspaces',
    icon: 'building',
  },
  {
    id: 'quotes',
    title: 'Quotes & Estimates',
    description: 'Share branded proposals with instant online approval links for clients.',
    tag: 'Proposals',
    icon: 'quote',
  },
  {
    id: 'conversion',
    title: '1-Click Invoice Conversion',
    description: 'Turn approved quotes into live, payable invoices without re-typing line items.',
    tag: 'Automation',
    icon: 'zap',
  },
  {
    id: 'security',
    title: 'Bank & Global Rail Details',
    description: 'Supports NUBAN, SEPA IBAN, Sort Code, BSB, IFSC, ACH, and SWIFT settlement rails.',
    tag: 'Global Rails',
    icon: 'shield',
  },
  {
    id: 'precision',
    title: '100% Penny-Exact Math Engine',
    description: 'Deterministic integer-cent ledger across discounts, inclusive & exclusive taxes.',
    tag: 'Core Engine',
    icon: 'sparkle',
  },
  {
    id: 'checkout',
    title: 'Online Card & Wallet Checkout',
    description: 'Let clients settle balances via Stripe checkout or direct local bank transfers.',
    tag: 'Payments',
    icon: 'card',
  },
  {
    id: 'audit',
    title: 'Audit-Ready Ledger Records',
    description: 'Immutable point-in-time document snapshots preserve tax and pricing history.',
    tag: 'Compliance',
    icon: 'lock',
  },
  {
    id: 'clients',
    title: 'Per-Brand Client Directory',
    description: 'Organize customer contacts, tax IDs, and portal statements per workspace.',
    tag: 'Directory',
    icon: 'users',
  },
  {
    id: 'calculator',
    title: 'Voice Copilot & Live Tax Calc',
    description: 'Draft itemized quotes & invoices hands-free in any currency with live totals.',
    tag: 'AI Copilot',
    icon: 'calc',
  },
];

export const DEFAULT_ORBITAL_INDEX = 4;
export const ORBITAL_SLOT_STEP_PX = 60;

export function clampOrbitalIndex(index: number, total: number = ORBITAL_FEATURES.length): number {
  return Math.max(0, Math.min(total - 1, index));
}

export function computeOrbitalSnapIndex(
  currentIndex: number,
  dragDeltaX: number,
  slotStepPx: number = ORBITAL_SLOT_STEP_PX,
  total: number = ORBITAL_FEATURES.length
): number {
  const shifted = currentIndex - dragDeltaX / slotStepPx;
  return clampOrbitalIndex(Math.round(shifted), total);
}

function renderOrbIcon(icon: OrbitalFeatureItem['icon'], isActive: boolean) {
  const cls = isActive
    ? 'w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.85)]'
    : 'w-4 h-4';

  switch (icon) {
    case 'building':
      return <Building className={cls} />;
    case 'quote':
      return <FileText className={cls} />;
    case 'zap':
      return <Zap className={cls} />;
    case 'shield':
      return <ShieldCheck className={cls} />;
    case 'sparkle':
      return <SparkleStar className={cls} />;
    case 'card':
      return <CreditCard className={cls} />;
    case 'lock':
      return <Lock className={cls} />;
    case 'users':
      return <Users className={cls} />;
    case 'calc':
      return <Calculator className={cls} />;
  }
}

export function OrbitalFeatureDock() {
  const [activeIndex, setActiveIndex] = useState(DEFAULT_ORBITAL_INDEX);
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    pointerId: number | null;
    startX: number;
    hasCaptured: boolean;
    deltaX: number;
  }>({
    pointerId: null,
    startX: 0,
    hasCaptured: false,
    deltaX: 0,
  });
  const suppressClickRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const wheelResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxTrackShiftPx = DEFAULT_ORBITAL_INDEX * ORBITAL_SLOT_STEP_PX;
  const baseOffsetPx = (DEFAULT_ORBITAL_INDEX - activeIndex) * ORBITAL_SLOT_STEP_PX;
  const clampedTrackOffsetPx = Math.max(
    -maxTrackShiftPx - 28,
    Math.min(maxTrackShiftPx + 28, baseOffsetPx + dragDeltaX)
  );

  const liveFloatIndex = Math.max(
    0,
    Math.min(ORBITAL_FEATURES.length - 1, activeIndex - dragDeltaX / ORBITAL_SLOT_STEP_PX)
  );
  const focusedIndex = Math.round(liveFloatIndex);
  const focusedFeature = ORBITAL_FEATURES[focusedIndex] || ORBITAL_FEATURES[DEFAULT_ORBITAL_INDEX];

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    suppressClickRef.current = false;
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      hasCaptured: false,
      deltaX: 0,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (drag.pointerId !== e.pointerId) return;

    const deltaX = e.clientX - drag.startX;
    drag.deltaX = deltaX;

    if (!drag.hasCaptured && Math.abs(deltaX) > 6) {
      drag.hasCaptured = true;
      suppressClickRef.current = true;
      setIsDragging(true);
      try {
        stageRef.current?.setPointerCapture(e.pointerId);
      } catch {
        // ignore if element unmounted or unsupported
      }
    }

    if (drag.hasCaptured) {
      setDragDeltaX(deltaX);
    }
  };

  const finishDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (drag.pointerId !== e.pointerId) return;

    const wasCaptured = drag.hasCaptured;
    const finalDeltaX = drag.deltaX;

    dragStateRef.current = {
      pointerId: null,
      startX: 0,
      hasCaptured: false,
      deltaX: 0,
    };

    if (wasCaptured) {
      try {
        stageRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setActiveIndex((prev) => computeOrbitalSnapIndex(prev, finalDeltaX));
      setDragDeltaX(0);
      setIsDragging(false);
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 40);
    }
  }, []);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Respond smoothly to horizontal trackpad swipes without hijacking vertical scroll
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 4) {
      return;
    }
    e.preventDefault();
    wheelAccumRef.current += e.deltaX;

    if (Math.abs(wheelAccumRef.current) >= 38) {
      const step = wheelAccumRef.current > 0 ? 1 : -1;
      wheelAccumRef.current = 0;
      setActiveIndex((prev) => clampOrbitalIndex(prev + step));
    }

    if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
    wheelResetTimerRef.current = setTimeout(() => {
      wheelAccumRef.current = 0;
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIndex((prev) => clampOrbitalIndex(prev - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIndex((prev) => clampOrbitalIndex(prev + 1));
    }
  };

  return (
    <div
      className="mt-16 pt-2 select-none"
      role="region"
      aria-roledescription="carousel"
      aria-label="Platform capabilities interactive slider"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Interactive Orbital Slider Row */}
      <div className="relative flex items-center justify-center">
        {/* Left step button + connector ray */}
        <div className="hidden sm:flex items-center gap-2 z-20 shrink-0">
          <div className="hidden lg:block w-12 h-[1px] bg-gradient-to-r from-transparent to-sky-400/30" />
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => clampOrbitalIndex(prev - 1))}
            disabled={activeIndex === 0}
            aria-label="Slide capabilities left"
            className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:border-sky-400/40 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Draggable Track Stage */}
        <div
          ref={stageRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onWheel={handleWheel}
          className={`relative w-full max-w-[560px] h-20 overflow-hidden touch-pan-y flex items-center justify-center ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
          }}
        >
          {/* Fixed Center Radiant Aura */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-sky-400/25 blur-xl animate-pulse"
          />

          {/* Sliding Track anchored around exact center */}
          <div
            className={`relative h-full flex items-center ${
              isDragging ? '' : 'transition-transform duration-300 ease-out'
            }`}
            style={{
              width: `${ORBITAL_FEATURES.length * ORBITAL_SLOT_STEP_PX}px`,
              transform: `translate3d(${clampedTrackOffsetPx}px, 0, 0)`,
            }}
          >
            {ORBITAL_FEATURES.map((item, idx) => {
              const distance = Math.abs(idx - liveFloatIndex);
              const isFocused = idx === focusedIndex;
              const proximityScale =
                distance < 0.5
                  ? 1.18
                  : distance < 1.5
                  ? 1.0
                  : distance < 2.5
                  ? 0.94
                  : 0.88;
              const proximityOpacity = Math.max(0.42, 1 - distance * 0.14);

              return (
                <div
                  key={item.id}
                  style={{ width: `${ORBITAL_SLOT_STEP_PX}px` }}
                  className="shrink-0 flex items-center justify-center"
                >
                  <button
                    type="button"
                    aria-label={item.title}
                    aria-pressed={isFocused}
                    title={item.title}
                    onClick={() => {
                      if (suppressClickRef.current) return;
                      setActiveIndex(idx);
                    }}
                    style={{
                      transform: `scale(${proximityScale})`,
                      opacity: proximityOpacity,
                    }}
                    className={`relative rounded-full flex items-center justify-center backdrop-blur-xl cursor-pointer ${
                      isDragging ? '' : 'transition-all duration-300 ease-out'
                    } ${
                      isFocused
                        ? 'w-12 h-12 bg-gradient-to-tr from-sky-400/25 via-blue-500/30 to-sky-300/35 border border-sky-300/60 text-white shadow-[0_0_28px_rgba(56,189,248,0.55)] z-10'
                        : 'w-10 h-10 bg-white/[0.04] border border-white/[0.09] text-slate-400 hover:text-white hover:border-sky-400/45 shadow-lg'
                    }`}
                  >
                    {renderOrbIcon(item.icon, isFocused)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right step button + connector ray */}
        <div className="hidden sm:flex items-center gap-2 z-20 shrink-0">
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => clampOrbitalIndex(prev + 1))}
            disabled={activeIndex === ORBITAL_FEATURES.length - 1}
            aria-label="Slide capabilities right"
            className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:border-sky-400/40 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="hidden lg:block w-12 h-[1px] bg-gradient-to-l from-transparent to-sky-400/30" />
        </div>
      </div>

      {/* Live Focused Capability Readout */}
      <div className="mt-4 max-w-md mx-auto">
        <div className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/90 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-full">
              {focusedFeature.tag}
            </span>
            <span className="text-xs font-semibold text-white">{focusedFeature.title}</span>
          </div>
          <p className="mt-1 text-[11.5px] text-slate-400 leading-relaxed">
            {focusedFeature.description}
          </p>
        </div>

        {/* Interactive Dot Rail + Hint */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {ORBITAL_FEATURES.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Select ${item.title}`}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                idx === focusedIndex
                  ? 'w-5 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                  : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

