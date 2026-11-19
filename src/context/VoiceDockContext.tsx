'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { VoicePanelMode } from '@/lib/voice/dock-layout';
import { VoiceDocumentDraft, VoiceDraftActions } from '@/lib/voice/types';

export interface CopilotDraftBridge {
  documentType: 'invoice' | 'quote';
  draft: VoiceDocumentDraft;
  clients: Array<{ _id: string; name: string; email?: string }>;
  actions: VoiceDraftActions;
}

interface VoiceDockContextValue {
  dockOffsetPx: number;
  setDockOffsetPx: (px: number) => void;
  panelMode: VoicePanelMode;
  setPanelMode: React.Dispatch<React.SetStateAction<VoicePanelMode>>;
  activeBridge: CopilotDraftBridge | null;
  registerDraftBridge: (bridge: CopilotDraftBridge | null) => void;
  startSessionTrigger: number;
  triggerStartSession: () => void;
}

const VoiceDockContext = createContext<VoiceDockContextValue>({
  dockOffsetPx: 0,
  setDockOffsetPx: () => {},
  panelMode: 'collapsed',
  setPanelMode: () => {},
  activeBridge: null,
  registerDraftBridge: () => {},
  startSessionTrigger: 0,
  triggerStartSession: () => {},
});

export function VoiceDockProvider({ children }: { children: React.ReactNode }) {
  const [dockOffsetPx, setDockOffsetPx] = useState(0);
  const [panelMode, setPanelMode] = useState<VoicePanelMode>('collapsed');
  const [activeBridge, setActiveBridge] = useState<CopilotDraftBridge | null>(null);
  const [startSessionTrigger, setStartSessionTrigger] = useState(0);

  const registerDraftBridge = useCallback((bridge: CopilotDraftBridge | null) => {
    setActiveBridge(bridge);
  }, []);

  const triggerStartSession = useCallback(() => {
    setPanelMode((prev) => (prev === 'collapsed' ? 'compact' : prev));
    setStartSessionTrigger((prev) => prev + 1);
  }, []);

  return (
    <VoiceDockContext.Provider
      value={{
        dockOffsetPx,
        setDockOffsetPx,
        panelMode,
        setPanelMode,
        activeBridge,
        registerDraftBridge,
        startSessionTrigger,
        triggerStartSession,
      }}
    >
      {children}
    </VoiceDockContext.Provider>
  );
}

export function useVoiceDock() {
  return useContext(VoiceDockContext);
}

