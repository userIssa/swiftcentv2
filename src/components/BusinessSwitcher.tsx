'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useActiveBusiness } from '@/context/ActiveBusinessContext';
import { CurrencySelect } from '@/components/CurrencySelect';
import { ChevronDown, Check, Plus, Coins } from 'lucide-react';

interface BusinessSwitcherProps {
  collapsed?: boolean;
  dark?: boolean;
}

export function BusinessSwitcher({ collapsed = false, dark = false }: BusinessSwitcherProps) {
  const { activeBusiness, businesses, setActiveBusinessId, refreshBusinesses } = useActiveBusiness();
  const [open, setOpen] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleQuickCurrencyChange = async (nextCurrency: string) => {
    if (!activeBusiness?._id || nextCurrency === activeBusiness.currency) return;
    try {
      setSavingCurrency(true);
      const res = await fetch(`/api/organizations/${activeBusiness._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: nextCurrency }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshBusinesses();
      }
    } catch (err) {
      console.error('Failed to update default currency', err);
    } finally {
      setSavingCurrency(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeBusiness) return null;

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={collapsed ? `${activeBusiness.name} (${activeBusiness.currency || 'USD'})` : undefined}
        className={`group relative w-full flex items-center transition-all cursor-pointer overflow-hidden ${
          collapsed
            ? `justify-center p-1 rounded-xl ${
                dark ? 'hover:bg-white/[0.08]' : 'hover:bg-slate-100'
              }`
              : `justify-between gap-2.5 p-2.5 rounded-xl border ${
                  dark
                    ? 'border-white/[0.1] bg-gradient-to-r from-[#1a1c20] via-[#17191d] to-[#23262e] hover:border-white/20 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'border-slate-200/90 bg-gradient-to-r from-slate-50/90 via-white to-blue-50/60 hover:border-blue-300/80 text-slate-800 shadow-2xs'
                }`
        }`}
      >
        {!collapsed && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -right-4 -top-4 w-20 h-20 rounded-full blur-xl ${
              dark ? 'bg-white/[0.06]' : 'bg-blue-400/15'
            }`}
          />
        )}
        <div className={`relative flex items-center gap-2.5 min-w-0 ${collapsed ? 'justify-center' : ''}`}>
          {activeBusiness.branding?.logoUrl ? (
            <img
              src={activeBusiness.branding.logoUrl}
              alt={activeBusiness.name}
              className={`object-contain border p-0.5 bg-white shrink-0 ${
                collapsed ? 'w-10 h-10 rounded-xl' : 'w-9 h-9 rounded-xl'
              } ${dark ? 'border-white/15' : 'border-slate-200'}`}
            />
          ) : (
            <div
              className={`flex items-center justify-center font-bold shrink-0 ${
                collapsed ? 'w-10 h-10 rounded-xl text-sm' : 'w-9 h-9 rounded-xl text-xs'
              } ${
                dark
                  ? 'bg-gradient-to-br from-white/15 via-white/[0.07] to-white/[0.02] border border-white/15 text-white shadow-inner'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs'
              }`}
            >
              {activeBusiness.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 text-left">
              <div
                className={`truncate text-[13px] font-semibold leading-tight ${
                  dark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {activeBusiness.name}
              </div>
              <div
                className={`text-[11px] truncate mt-0.5 ${
                  dark ? 'text-zinc-400' : 'text-slate-400'
                }`}
              >
                {activeBusiness.currency || 'USD'} · Switch workspace
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <ChevronDown
            className={`relative w-3.5 h-3.5 shrink-0 ${dark ? 'text-zinc-400' : 'text-slate-400'}`}
          />
        )}
      </button>

      {open && (
        <div
          className={`absolute mt-2 rounded-2xl shadow-2xl border py-2 z-[70] ${
            collapsed ? 'left-full ml-3 top-0 mt-0 w-60' : 'left-0 w-full'
          } ${
            dark
              ? 'bg-[#1c1f27] border-white/10 text-slate-100'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Switch Business
          </div>

          <div
            className={`max-h-60 overflow-y-auto divide-y ${
              dark ? 'divide-white/5' : 'divide-slate-100'
            }`}
          >
            {businesses.map((b) => (
              <button
                key={b._id}
                onClick={() => {
                  setActiveBusinessId(b._id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                  dark
                    ? `hover:bg-white/[0.06] ${b._id === activeBusiness._id ? 'bg-white/[0.08]' : ''}`
                    : `hover:bg-slate-50 ${b._id === activeBusiness._id ? 'bg-blue-50/50' : ''}`
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {b.branding?.logoUrl ? (
                    <img
                      src={b.branding.logoUrl}
                      alt={b.name}
                      className="w-6 h-6 rounded-full object-contain border border-slate-200 p-0.5 bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {b.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-semibold truncate ${
                        dark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {b.name}
                    </div>
                    <div className="text-[10px] text-slate-400">{b.currency || 'USD'}</div>
                  </div>
                </div>
                {b._id === activeBusiness._id && (
                  <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div
            className={`pt-2 mt-1 border-t px-3 pb-2 space-y-1.5 ${
              dark ? 'border-white/10' : 'border-slate-100'
            }`}
          >
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Coins className="w-3 h-3 text-slate-400" />
              <span>Preferred Currency</span>
            </label>
            <CurrencySelect
              compact
              variant={dark ? 'dark' : 'light'}
              value={activeBusiness.currency || 'USD'}
              disabled={savingCurrency}
              onChange={handleQuickCurrencyChange}
              ariaLabel="Preferred Workspace Currency"
            />
          </div>

          <div
            className={`pt-1.5 border-t px-2 ${
              dark ? 'border-white/10' : 'border-slate-100'
            }`}
          >
            <Link
              href="/business"
              onClick={() => setOpen(false)}
              className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                dark
                  ? 'text-sky-400 hover:bg-white/[0.06]'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Business</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
