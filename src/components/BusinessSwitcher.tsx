'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useActiveBusiness } from '@/context/ActiveBusinessContext';
import { Building, ChevronDown, Check, Plus } from 'lucide-react';

export function BusinessSwitcher() {
  const { activeBusiness, businesses, setActiveBusinessId } = useActiveBusiness();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {activeBusiness.branding?.logoUrl ? (
            <img
              src={activeBusiness.branding.logoUrl}
              alt={activeBusiness.name}
              className="w-5 h-5 rounded object-contain border border-slate-200 p-0.5 bg-white shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              {activeBusiness.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <span className="truncate font-semibold text-slate-800 text-left">
            {activeBusiness.name}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-full min-w-[220px] bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
          <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Switch Business
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {businesses.map((b) => (
              <button
                key={b._id}
                onClick={() => {
                  setActiveBusinessId(b._id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                  b._id === activeBusiness._id ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {b.branding?.logoUrl ? (
                    <img
                      src={b.branding.logoUrl}
                      alt={b.name}
                      className="w-6 h-6 rounded object-contain border border-slate-200 p-0.5 bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {b.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {b.name}
                    </div>
                    <div className="text-[10px] text-slate-400">{b.currency || 'USD'}</div>
                  </div>
                </div>
                {b._id === activeBusiness._id && (
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-2 mt-1 border-t border-slate-100 px-2">
            <Link
              href="/business"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
