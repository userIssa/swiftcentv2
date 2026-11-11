'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ResolvedClientCandidate,
  VoiceDocumentDraft,
  VoiceDocumentType,
  VoiceDraftActions,
  VoiceFormLineItem,
} from './types';

interface UseDocumentVoiceBridgeParams {
  documentType: VoiceDocumentType;
  organizationId: string;
  selectedClientId: string;
  currency: string;
  issueDate: string;
  dueOrValidDate: string;
  notes: string;
  terms: string;
  items: VoiceFormLineItem[];
  setClientById: (id: string) => void;
  setClients: React.Dispatch<React.SetStateAction<any[]>>;
  setCurrency: (currency: string) => void;
  setIssueDate: (date: string) => void;
  setDueOrValidDate: (date: string) => void;
  setNotes: (notes: string) => void;
  setTerms: (terms: string) => void;
  setItems: React.Dispatch<React.SetStateAction<VoiceFormLineItem[]>>;
}

export function useDocumentVoiceBridge(params: UseDocumentVoiceBridgeParams) {
  const [voiceDefaultExpanded, setVoiceDefaultExpanded] = useState(false);
  const [voiceFlashField, setVoiceFlashField] = useState<string | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      if (search.get('voice') === '1') {
        setVoiceDefaultExpanded(true);
      }
    }
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const handleFieldFlash = useCallback((field: string) => {
    setVoiceFlashField(field);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setVoiceFlashField(null);
    }, 1500);
  }, []);

  const draft: VoiceDocumentDraft = useMemo(
    () => ({
      documentType: params.documentType,
      organizationId: params.organizationId,
      selectedClientId: params.selectedClientId,
      currency: params.currency,
      issueDate: params.issueDate,
      dueOrValidDate: params.dueOrValidDate,
      notes: params.notes,
      terms: params.terms,
      items: params.items,
    }),
    [
      params.documentType,
      params.organizationId,
      params.selectedClientId,
      params.currency,
      params.issueDate,
      params.dueOrValidDate,
      params.notes,
      params.terms,
      params.items,
    ]
  );

  const handleClientCreated = useCallback(
    (client: ResolvedClientCandidate) => {
      params.setClients((prev) => {
        if (prev.some((c) => c._id === client._id)) return prev;
        return [...prev, client].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      });
      params.setClientById(client._id);
    },
    [params.setClients, params.setClientById]
  );

  const actions: VoiceDraftActions = useMemo(
    () => ({
      setClientById: params.setClientById,
      onClientCreated: handleClientCreated,
      setCurrency: params.setCurrency,
      setIssueDate: params.setIssueDate,
      setDueOrValidDate: params.setDueOrValidDate,
      setNotes: params.setNotes,
      setTerms: params.setTerms,
      setItems: params.setItems,
      onFieldFlash: handleFieldFlash,
    }),
    [
      params.setClientById,
      handleClientCreated,
      params.setCurrency,
      params.setIssueDate,
      params.setDueOrValidDate,
      params.setNotes,
      params.setTerms,
      params.setItems,
      handleFieldFlash,
    ]
  );

  return {
    draft,
    actions,
    voiceDefaultExpanded,
    voiceFlashField,
  };
}

