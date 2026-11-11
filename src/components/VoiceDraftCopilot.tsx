'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  MessageCircle,
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle2,
  Square,
  X,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { useVoiceDraftSession } from '@/lib/voice/useVoiceDraftSession';
import { VoiceDocumentDraft, VoiceDraftActions } from '@/lib/voice/types';
import { computeVoiceDockGeometry, VoicePanelMode } from '@/lib/voice/dock-layout';
import { useVoiceDock } from '@/context/VoiceDockContext';

interface VoiceDraftCopilotProps {
  draft: VoiceDocumentDraft;
  clients: Array<{ _id: string; name: string; email?: string }>;
  actions: VoiceDraftActions;
  defaultExpanded?: boolean;
}

const WAVEFORM_WEIGHTS = [0.45, 0.78, 1.0, 0.72, 0.48];

export function VoiceDraftCopilot({
  draft,
  clients,
  actions,
  defaultExpanded = false,
}: VoiceDraftCopilotProps) {
  const { setDockOffsetPx } = useVoiceDock();

  const [panelMode, setPanelMode] = useState<VoicePanelMode>(
    defaultExpanded ? 'compact' : 'collapsed'
  );
  const [activeTab, setActiveTab] = useState<'orb' | 'chat'>('orb');
  const [viewportWidth, setViewportWidth] = useState<number>(1280);
  const [textInput, setTextInput] = useState('');
  const feedEndRef = useRef<HTMLDivElement>(null);

  const {
    connectionState,
    errorMessage,
    errorCode,
    isMuted,
    isAssistantSpeaking,
    inputRms,
    transcripts,
    startSession,
    stopSession,
    toggleMute,
    sendTextMessage,
  } = useVoiceDraftSession({ draft, clients, actions });

  // Track viewport width to clamp sidebar width responsively so receipts/forms remain spacious
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncWidth = () => setViewportWidth(window.innerWidth);
    syncWidth();
    window.addEventListener('resize', syncWidth);
    return () => window.removeEventListener('resize', syncWidth);
  }, []);

  useEffect(() => {
    if (defaultExpanded) {
      setPanelMode((prev) => (prev === 'collapsed' ? 'compact' : prev));
    }
  }, [defaultExpanded]);

  const geometry = useMemo(
    () => computeVoiceDockGeometry(viewportWidth, panelMode),
    [viewportWidth, panelMode]
  );

  // Inform AdminLayout so main workspace & receipt previews reflow smoothly alongside the right sidebar
  useEffect(() => {
    setDockOffsetPx(geometry.pushOffsetPx);
    return () => setDockOffsetPx(0);
  }, [geometry.pushOffsetPx, setDockOffsetPx]);

  useEffect(() => {
    if (activeTab === 'chat') {
      feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [transcripts, activeTab]);

  const isLive =
    connectionState === 'connected' ||
    connectionState === 'paused' ||
    connectionState === 'reconnecting';

  const docLabel = draft.documentType === 'invoice' ? 'Invoice' : 'Quote';

  const recentActions = useMemo(
    () => transcripts.filter((t) => t.speaker === 'action').slice(-2),
    [transcripts]
  );

  const latestDialogue = useMemo(() => {
    const dialogue = transcripts.filter(
      (t) => t.speaker === 'assistant' || t.speaker === 'user'
    );
    return dialogue[dialogue.length - 1] || null;
  }, [transcripts]);

  const statusHeadline =
    connectionState === 'initializing'
      ? 'Connecting...'
      : isAssistantSpeaking
        ? 'Speaking...'
        : connectionState === 'connected'
          ? 'Listening...'
          : connectionState === 'reconnecting'
            ? 'Reconnecting...'
            : connectionState === 'paused'
              ? 'Mic paused'
              : connectionState === 'error'
                ? 'Connection issue'
                : 'Ready to draft';

  const handleCenterMicAction = async () => {
    if (connectionState === 'initializing') return;
    if (!isLive) {
      await startSession();
    } else {
      toggleMute();
    }
  };

  const handleRightDockAction = async () => {
    if (isLive) {
      await stopSession();
    } else {
      setPanelMode('collapsed');
    }
  };

  const handleToggleMaximize = () => {
    setPanelMode((prev) => (prev === 'maximized' ? 'compact' : 'maximized'));
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const msg = textInput;
    setTextInput('');
    await sendTextMessage(msg);
  };

  // Smooth voice-reactive scale for the iridescent center sphere
  const orbScale =
    connectionState === 'connected' && !isMuted
      ? 1 + Math.min(0.14, inputRms * 0.16)
      : isAssistantSpeaking
        ? 1.07
        : 1;

  // ---------------------------------------------------------------------------
  // 1. COLLAPSED: Floating Iridescent Circle Orb Launcher (Bottom-Right)
  // ---------------------------------------------------------------------------
  if (panelMode === 'collapsed') {
    return (
      <div className="fixed bottom-6 right-6 z-40 no-print flex items-center gap-3">
        {isLive && (
          <button
            type="button"
            onClick={() => setPanelMode('compact')}
            className="flex items-center gap-2 bg-white/95 backdrop-blur-md text-slate-800 border border-indigo-200/80 shadow-lg rounded-full px-3.5 py-2 text-xs font-semibold hover:bg-white transition-all cursor-pointer animate-in fade-in slide-in-from-right-2"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionState === 'paused'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span>{isAssistantSpeaking ? 'Copilot Speaking' : statusHeadline}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setPanelMode('compact')}
          aria-label={`Open SwiftCent Voice ${docLabel} Copilot`}
          title={`Open Voice ${docLabel} Copilot`}
          className="group relative w-16 h-16 rounded-full cursor-pointer focus:outline-none transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          {/* Ambient Pastel Halo */}
          <span
            className={`absolute -inset-1.5 rounded-full bg-gradient-to-tr from-sky-400/50 via-indigo-400/45 to-fuchsia-400/50 blur-md transition-opacity duration-300 ${
              isLive ? 'opacity-95 animate-pulse' : 'opacity-65 group-hover:opacity-100'
            }`}
          />

          {/* Circular Iridescent Swirled Orb Asset */}
          <span className="relative block w-full h-full rounded-full overflow-hidden ring-2 ring-white/90 shadow-[0_12px_30px_rgba(99,102,241,0.38)] bg-indigo-100">
            <img
              src="/images/voice-orb.jpg"
              alt="SwiftCent Voice Copilot"
              className="w-full h-full object-cover scale-[1.16] rounded-full select-none"
            />
            <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/15 to-white/30 pointer-events-none" />
          </span>

          {/* Tiny Hover Prompt Label */}
          {!isLive && (
            <span className="hidden sm:flex items-center gap-1 absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900/90 text-white text-[11px] font-medium px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
              <Sparkles className="w-3 h-3 text-sky-300" />
              <span>Voice Draft</span>
            </span>
          )}
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. EXPANDED: Responsive Side-Docked Copilot (Desktop) / Sheet (Mobile)
  // ---------------------------------------------------------------------------
  const containerClasses = geometry.isDesktopSplit
    ? 'fixed top-0 right-0 bottom-0 z-40 no-print flex flex-col border-l border-white/80 shadow-[-14px_0_40px_rgba(79,70,229,0.12)] transition-[width] duration-300 ease-out'
    : panelMode === 'maximized'
      ? 'fixed inset-2 top-14 rounded-3xl z-50 no-print flex flex-col border border-white/80 shadow-2xl transition-all duration-300 ease-out overflow-hidden'
      : 'fixed inset-x-3 bottom-3 h-[60vh] rounded-3xl z-50 no-print flex flex-col border border-white/80 shadow-2xl transition-all duration-300 ease-out overflow-hidden';

  return (
    <>
      {/* Subtle backdrop only on mobile sheet overlay */}
      {!geometry.isDesktopSplit && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40 no-print"
          onClick={() => setPanelMode('collapsed')}
        />
      )}

      <aside
        className={`${containerClasses} bg-gradient-to-b from-[#d9e5ff] via-[#ebe0ff] to-[#f4efff] text-slate-800`}
        style={geometry.isDesktopSplit ? { width: `${geometry.panelWidthPx}px` } : undefined}
        aria-label={`Voice ${docLabel} Copilot`}
      >
        {/* Top Frosted Glass Control Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setPanelMode('collapsed')}
            title="Minimize back to floating orb"
            aria-label="Minimize to floating orb"
            className="w-9 h-9 rounded-full bg-white/50 hover:bg-white/80 border border-white/75 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            {geometry.isDesktopSplit ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <div className="text-center min-w-0">
            <div className="text-xs font-bold tracking-tight text-slate-800 truncate">
              Voice {docLabel} Copilot
            </div>
            <div className="text-[10px] font-medium text-slate-600/80 truncate">
              {draft.currency} Live Draft
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleMaximize}
              title={panelMode === 'maximized' ? 'Minimize sidebar width' : 'Maximize sidebar width'}
              aria-label={
                panelMode === 'maximized' ? 'Minimize panel' : 'Maximize panel'
              }
              className="w-9 h-9 rounded-full bg-white/50 hover:bg-white/80 border border-white/75 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              {panelMode === 'maximized' ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setPanelMode('collapsed')}
              title="Close panel (keep orb floating)"
              aria-label="Close panel"
              className="w-9 h-9 rounded-full bg-white/50 hover:bg-white/80 border border-white/75 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error / Setup Notice Banner */}
        {errorMessage && (
          <div className="mx-4 mt-2 rounded-2xl border border-amber-200 bg-white/85 backdrop-blur-md p-3 flex items-start gap-2.5 text-xs text-slate-800 shadow-xs shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <div className="font-bold text-slate-900">
                {errorCode === 'MISSING_API_KEY' ? 'Gemini API Key Required' : 'Voice Issue'}
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Main Body: Orb View (Default) OR Chat/Transcript View */}
        {activeTab === 'orb' ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-between px-5 py-3 overflow-y-auto">
            {/* Live Headline */}
            <div className="text-center pt-1">
              <div className="text-base font-semibold italic text-slate-700 tracking-tight">
                {statusHeadline}
              </div>
            </div>

            {/* Centerpiece Swirled 3D Iridescent Orb */}
            <div className="relative flex items-center justify-center my-2 shrink-0">
              {/* Outer Pulse Rings */}
              <div
                className={`absolute rounded-full bg-gradient-to-tr from-sky-300/40 via-indigo-300/35 to-fuchsia-300/40 blur-xl transition-all duration-300 ${
                  connectionState === 'connected' && !isMuted
                    ? 'w-52 h-52 opacity-90'
                    : isAssistantSpeaking
                      ? 'w-52 h-52 opacity-95 animate-pulse'
                      : 'w-44 h-44 opacity-50'
                }`}
              />

              <button
                type="button"
                onClick={handleCenterMicAction}
                disabled={connectionState === 'initializing'}
                title={
                  !isLive
                    ? 'Tap to start Voice Copilot'
                    : isMuted
                      ? 'Tap to resume microphone'
                      : 'Tap to mute microphone'
                }
                style={{ transform: `scale(${orbScale})` }}
                className={`relative rounded-full overflow-hidden ring-4 ring-white/70 shadow-[0_22px_50px_rgba(129,140,248,0.38)] transition-transform duration-150 cursor-pointer focus:outline-none ${
                  panelMode === 'compact' && !geometry.isDesktopSplit
                    ? 'w-32 h-32'
                    : 'w-44 h-44'
                }`}
              >
                <img
                  src="/images/voice-orb.jpg"
                  alt="Interactive Voice Orb"
                  className="w-full h-full object-cover scale-[1.15] rounded-full select-none"
                />
                <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />
              </button>
            </div>

            {/* Spoken Guidance / Latest Dialogue + Live Action Badges */}
            <div className="w-full max-w-[300px] space-y-2.5 text-center">
              <p className="text-xs sm:text-sm font-medium text-slate-700/90 leading-relaxed line-clamp-3">
                {latestDialogue
                  ? latestDialogue.text
                  : `Speak naturally to build your ${docLabel.toLowerCase()} — client, items, discounts, and terms.`}
              </p>

              {recentActions.length > 0 && (
                <div className="space-y-1.5">
                  {recentActions.map((act) => (
                    <div
                      key={act.id}
                      className="inline-flex w-full items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/75 backdrop-blur-sm border border-emerald-200/80 text-[11px] font-semibold text-emerald-800 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{act.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reactive White Minimalist Waveform */}
            <div className="flex items-center justify-center gap-1.5 h-7 pt-1" aria-hidden="true">
              {WAVEFORM_WEIGHTS.map((weight, idx) => {
                const energy =
                  connectionState === 'connected' && !isMuted
                    ? Math.max(0.24, Math.min(1, inputRms * weight * 1.5))
                    : isAssistantSpeaking
                      ? 0.45 + ((idx % 2 === 0 ? 0.35 : 0.15))
                      : 0.22;
                return (
                  <span
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-100 ${
                      isLive ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]' : 'bg-white/70'
                    }`}
                    style={{ height: `${Math.round(energy * 26)}px` }}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* CHAT / LEDGER TRANSCRIPT VIEW */
          <div className="flex-1 min-h-0 flex flex-col px-4 py-2 gap-2.5">
            <div className="flex-1 min-h-0 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 p-3 overflow-y-auto space-y-2.5 shadow-inner">
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500 px-4 space-y-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <p className="font-medium text-slate-600">
                    Conversation & draft updates appear here.
                  </p>
                  <p className="text-[11px] italic text-slate-500">
                    Tap the mic below and say: &ldquo;Create a {docLabel.toLowerCase()} for Tesla
                    for 2 engineering sprints.&rdquo;
                  </p>
                </div>
              ) : (
                transcripts.map((entry) => {
                  if (entry.speaker === 'action') {
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800 bg-emerald-50/90 border border-emerald-200 rounded-xl px-2.5 py-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="flex-1 leading-snug">{entry.text}</span>
                      </div>
                    );
                  }

                  if (entry.speaker === 'system') {
                    return (
                      <div
                        key={entry.id}
                        className="text-[11px] text-slate-500 text-center italic py-0.5"
                      >
                        {entry.text}
                      </div>
                    );
                  }

                  const isUser = entry.speaker === 'user';
                  return (
                    <div
                      key={entry.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-2xs ${
                          isUser
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-800 border border-slate-200/70'
                        }`}
                      >
                        <span>{entry.text}</span>
                        {!entry.isFinal && (
                          <span className="inline-block w-1.5 h-3 ml-1 bg-current opacity-60 animate-pulse align-middle" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={feedEndRef} />
            </div>

            {/* Inline Silent Text Adjust Input */}
            <form onSubmit={handleSendText} className="flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={!isLive}
                placeholder={
                  isLive
                    ? 'Type adjustment (e.g. "Add 10% discount")...'
                    : 'Tap the mic below to start voice session...'
                }
                className="flex-1 text-xs bg-white/80 backdrop-blur-sm border border-white rounded-xl px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!isLive || !textInput.trim()}
                aria-label="Send instruction"
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 cursor-pointer transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Bottom Circular Control Dock (Matching Reference Screenshot 1) */}
        <div className="px-6 pt-2 pb-5 flex items-center justify-center gap-6 shrink-0">
          {/* Left Circle: Toggle Orb View <-> Chat Transcript View */}
          <button
            type="button"
            onClick={() => setActiveTab((prev) => (prev === 'orb' ? 'chat' : 'orb'))}
            title={activeTab === 'orb' ? 'Open chat & action feed' : 'Return to orb view'}
            aria-label={activeTab === 'orb' ? 'Open chat transcript' : 'Show voice orb'}
            className={`relative w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-sm ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-white/55 hover:bg-white/85 text-slate-700 border-white/80'
            }`}
          >
            {activeTab === 'orb' ? (
              <MessageCircle className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {activeTab === 'orb' && transcripts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-white" />
            )}
          </button>

          {/* Center Big Glowing Mic Circle */}
          <button
            type="button"
            onClick={handleCenterMicAction}
            disabled={connectionState === 'initializing'}
            title={
              !isLive
                ? 'Start Voice Draft'
                : isMuted
                  ? 'Resume Mic'
                  : 'Pause Mic'
            }
            aria-label={!isLive ? 'Start voice' : isMuted ? 'Resume mic' : 'Mute mic'}
            className="relative w-16 h-16 rounded-full p-1.5 bg-white/45 backdrop-blur-md shadow-[0_10px_28px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 transition-transform cursor-pointer disabled:opacity-60"
          >
            {connectionState === 'connected' && !isMuted && (
              <span className="absolute -inset-1 rounded-full border-2 border-indigo-400/60 animate-ping pointer-events-none" />
            )}
            <span
              className={`w-full h-full rounded-full flex items-center justify-center text-white shadow-inner transition-colors ${
                connectionState === 'paused'
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                  : 'bg-gradient-to-tr from-sky-400 via-indigo-500 to-violet-600'
              }`}
            >
              {connectionState === 'initializing' ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </span>
          </button>

          {/* Right Circle: Stop Active Session OR Close Panel back to Orb */}
          <button
            type="button"
            onClick={handleRightDockAction}
            title={isLive ? 'End voice session' : 'Minimize to floating orb'}
            aria-label={isLive ? 'End voice session' : 'Minimize to floating orb'}
            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-sm ${
              isLive
                ? 'bg-rose-500/15 hover:bg-rose-500 hover:text-white text-rose-600 border-rose-300/70'
                : 'bg-white/55 hover:bg-white/85 text-slate-700 border-white/80'
            }`}
          >
            {isLive ? <Square className="w-4 h-4 fill-current" /> : <X className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  );
}
