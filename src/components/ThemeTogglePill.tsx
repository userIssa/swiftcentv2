'use client';

import React from 'react';
import type { AppTheme } from '@/context/ThemeContext';

interface ThemeTogglePillProps {
  theme: AppTheme;
  onChange: (nextTheme: AppTheme) => void;
}

function SunGlyph({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-[22px] h-[22px] transition-all duration-300 ${
        active
          ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)] scale-105'
          : 'text-amber-300/60 scale-95'
      }`}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
        <line x1="12" y1="2.2" x2="12" y2="4.3" />
        <line x1="12" y1="19.7" x2="12" y2="21.8" />
        <line x1="2.2" y1="12" x2="4.3" y2="12" />
        <line x1="19.7" y1="12" x2="21.8" y2="12" />
        <line x1="5.1" y1="5.1" x2="6.6" y2="6.6" />
        <line x1="17.4" y1="17.4" x2="18.9" y2="18.9" />
        <line x1="18.9" y1="5.1" x2="17.4" y2="6.6" />
        <line x1="6.6" y1="17.4" x2="5.1" y2="18.9" />
      </g>
    </svg>
  );
}

function MoonGlyph({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-[20px] h-[20px] transition-all duration-300 ${
        active
          ? 'text-slate-100 drop-shadow-[0_0_8px_rgba(186,230,253,0.75)] scale-105'
          : 'text-slate-400/70 scale-95'
      }`}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.354 14.354A8.5 8.5 0 0 1 9.646 3.646a.6.6 0 0 0-.73-.73A9.5 9.5 0 1 0 21.084 15.084a.6.6 0 0 0-.73-.73Z" />
    </svg>
  );
}

export function ThemeTogglePill({ theme, onChange }: ThemeTogglePillProps) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Glass Mode'}
      title={isDark ? 'Dark Glass active — click for Light Mode' : 'Light Mode active — click for Dark Glass'}
      onClick={() => onChange(isDark ? 'light' : 'dark')}
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(148, 197, 255, 0.16) 0%, rgba(255, 255, 255, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(186, 220, 255, 0.55) 0%, rgba(235, 246, 255, 0.35) 100%)',
        border: isDark
          ? '1.5px solid rgba(186, 225, 255, 0.28)'
          : '1.5px solid rgba(255, 255, 255, 0.85)',
        boxShadow: isDark
          ? 'inset 0 1px 2px rgba(255, 255, 255, 0.28), inset 0 -2px 6px rgba(56, 189, 248, 0.15), 0 8px 24px rgba(0, 0, 0, 0.45)'
          : 'inset 0 1.5px 3px rgba(255, 255, 255, 0.9), inset 0 -2px 6px rgba(147, 197, 253, 0.35), 0 8px 20px rgba(59, 130, 246, 0.12)',
      }}
      className="relative inline-flex items-center w-[100px] h-[48px] rounded-full p-1 backdrop-blur-2xl select-none cursor-pointer transition-all duration-300 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
    >
      {/* Liquid Glass Sliding Thumb Lens */}
      <span
        aria-hidden="true"
        style={{
          background: isDark
            ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.22) 0%, rgba(125, 211, 252, 0.12) 55%, rgba(255, 255, 255, 0.16) 100%)'
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.78) 0%, rgba(224, 242, 254, 0.36) 55%, rgba(255, 255, 255, 0.6) 100%)',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.32)'
            : '1px solid rgba(255, 255, 255, 0.92)',
          boxShadow: isDark
            ? 'inset 0 1.5px 2px rgba(255, 255, 255, 0.42), inset 0 -1.5px 3px rgba(56, 189, 248, 0.2), 0 4px 12px rgba(0, 0, 0, 0.35)'
            : 'inset 0 1.5px 2px rgba(255, 255, 255, 0.95), inset 0 -1.5px 3px rgba(147, 197, 253, 0.28), 0 4px 12px rgba(15, 23, 42, 0.1)',
          transform: isDark ? 'translateX(44px)' : 'translateX(0px)',
        }}
        className="absolute left-1 top-1 w-[46px] h-[38px] rounded-full backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
      />

      {/* Sun (Light Mode) & Moon (Dark Glass) Positions */}
      <span className="relative z-10 w-[46px] h-full flex items-center justify-center">
        <SunGlyph active={!isDark} />
      </span>
      <span className="relative z-10 w-[46px] h-full flex items-center justify-center">
        <MoonGlyph active={isDark} />
      </span>
    </button>
  );
}

