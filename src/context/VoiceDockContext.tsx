'use client';

import React, { createContext, useContext, useState } from 'react';

interface VoiceDockContextValue {
  dockOffsetPx: number;
  setDockOffsetPx: (px: number) => void;
}

const VoiceDockContext = createContext<VoiceDockContextValue>({
  dockOffsetPx: 0,
  setDockOffsetPx: () => {},
});

export function VoiceDockProvider({ children }: { children: React.ReactNode }) {
  const [dockOffsetPx, setDockOffsetPx] = useState(0);

  return (
    <VoiceDockContext.Provider value={{ dockOffsetPx, setDockOffsetPx }}>
      {children}
    </VoiceDockContext.Provider>
  );
}

export function useVoiceDock() {
  return useContext(VoiceDockContext);
}

