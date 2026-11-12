'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { CelestialBackdrop } from '@/components/CelestialBackdrop';

export function PortalViewport({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isDark } = useTheme();

  return (
    <div
      className={`swiftcent-theme-root min-h-screen relative overflow-x-hidden ${
        isDark ? 'bg-[#030611] text-slate-100' : 'bg-slate-100 text-slate-900'
      } ${className}`}
    >
      {isDark && <CelestialBackdrop />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

