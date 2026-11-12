import React from 'react';

export function CelestialBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 no-print"
    >
      {/* Central concentric orbital vortex matching the landing hero */}
      <div className="absolute top-[24%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full border border-sky-400/[0.14] shadow-[0_0_120px_rgba(56,189,248,0.16)_inset]" />
      <div className="absolute top-[24%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1040px] h-[1040px] rounded-full border border-sky-400/[0.07]" />
      <div className="absolute top-[24%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1380px] h-[1380px] rounded-full border border-white/[0.03]" />

      {/* Diffused celestial sky-blue & indigo glows so backdrop-blur diffuses rich color */}
      <div className="absolute top-[16%] left-[54%] -translate-x-1/2 -translate-y-1/2 w-[860px] h-[480px] bg-gradient-to-b from-sky-400/24 via-blue-600/14 to-transparent blur-[125px] rounded-full" />
      <div className="absolute bottom-[6%] right-[6%] w-[560px] h-[440px] bg-gradient-to-tr from-blue-600/18 via-sky-400/12 to-transparent blur-[130px] rounded-full" />
      <div className="absolute bottom-[18%] left-[10%] w-[460px] h-[400px] bg-gradient-to-tr from-indigo-500/16 via-sky-500/10 to-transparent blur-[130px] rounded-full" />
    </div>
  );
}

