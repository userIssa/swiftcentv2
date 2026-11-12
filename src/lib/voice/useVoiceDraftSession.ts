'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Session } from '@google/genai';
import { VoiceAudioEngine } from './audio-io';
import { executeVoiceToolCall } from './tool-executor';
import { GEMINI_LIVE_MODEL } from './tool-declarations';
import { VoiceSessionUsageAccumulator } from './usage-tracker';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';
import {
  VoiceConnectionState,
  VoiceDocumentDraft,
  VoiceDraftActions,
  VoiceSessionTokenResponse,
  VoiceTranscriptEntry,
} from './types';

export const INACTIVITY_AUTO_END_MS = 2 * 60 * 1000;
const AUTO_END_FALLBACK_MS = 7000;
const AUTO_END_POST_PLAYBACK_MS = 220;
const AUTO_END_SILENT_GRACE_MS = 1800;
const MAX_TEXT_MESSAGE_CHARS = 500;
const LIVE_CONNECT_TIMEOUT_MS = 18000;
const MAX_RECONNECT_ATTEMPTS = 3;

export interface UseVoiceDraftSessionOptions {
  draft: VoiceDocumentDraft;
  clients: Array<{ _id: string; name: string; email?: string }>;
  actions: VoiceDraftActions;
}

export interface UseVoiceDraftSessionReturn {
  connectionState: VoiceConnectionState;
  errorMessage: string | null;
  errorCode: string | null;
  isMuted: boolean;
  isAssistantSpeaking: boolean;
  inputRms: number;
  transcripts: VoiceTranscriptEntry[];
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  toggleMute: () => void;
  sendTextMessage: (text: string) => Promise<void>;
  clearTranscripts: () => void;
}

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function makeEntryId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function useVoiceDraftSession({
  draft,
  clients,
  actions,
}: UseVoiceDraftSessionOptions): UseVoiceDraftSessionReturn {
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [inputRms, setInputRms] = useState(0);
  const [transcripts, setTranscripts] = useState<VoiceTranscriptEntry[]>([]);

  // Latest mutable refs so live callbacks & tool executors never read stale closures
  const draftRef = useRef<VoiceDocumentDraft>(draft);
  const clientsRef = useRef(clients);
  const actionsRef = useRef(actions);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    clientsRef.current = clients;
  }, [clients]);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  const sessionRef = useRef<Session | null>(null);
  const audioRef = useRef<VoiceAudioEngine | null>(null);
  const resumeHandleRef = useRef<string | null>(null);
  const activeTokenRef = useRef<{ token: string; model: string; expireAtMs: number } | null>(null);
  const usageLogIdRef = useRef<string | null>(null);
  const usageAccumulatorRef = useRef<VoiceSessionUsageAccumulator | null>(null);
  const usageSyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledToolIdsRef = useRef<Set<string>>(new Set());
  const manualStopRef = useRef(false);
  const reconnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const isPlayingRef = useRef(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAutoEndRef = useRef<{ reason: string; turnFinished: boolean } | null>(null);
  const autoEndGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoEndFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appendSystemOrAction = useCallback((speaker: 'action' | 'system', text: string) => {
    setTranscripts((prev) => [
      ...prev.slice(-60),
      {
        id: makeEntryId(speaker),
        speaker,
        text,
        timestamp: nowTimeLabel(),
        isFinal: true,
      },
    ]);
  }, []);

  const upsertStreamingTranscript = useCallback(
    (speaker: 'user' | 'assistant', chunkText: string, mode: 'append' | 'replace', isFinal: boolean) => {
      if (!chunkText) return;
      setTranscripts((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.speaker === speaker && !last.isFinal) {
          next[next.length - 1] = {
            ...last,
            text: mode === 'replace' ? chunkText : `${last.text}${chunkText}`,
            isFinal,
            timestamp: nowTimeLabel(),
          };
          return next;
        }
        next.push({
          id: makeEntryId(speaker),
          speaker,
          text: chunkText.trimStart(),
          isFinal,
          timestamp: nowTimeLabel(),
        });
        return next.slice(-60);
      });
    },
    []
  );

  const finalizeOpenTranscripts = useCallback(() => {
    setTranscripts((prev) =>
      prev.map((entry) => (entry.isFinal ? entry : { ...entry, isFinal: true }))
    );
  }, []);

  const clearAllSessionTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (autoEndGraceTimerRef.current) {
      clearTimeout(autoEndGraceTimerRef.current);
      autoEndGraceTimerRef.current = null;
    }
    if (autoEndFallbackTimerRef.current) {
      clearTimeout(autoEndFallbackTimerRef.current);
      autoEndFallbackTimerRef.current = null;
    }
    if (usageSyncTimerRef.current) {
      clearInterval(usageSyncTimerRef.current);
      usageSyncTimerRef.current = null;
    }
  }, []);

  const flushVoiceUsage = useCallback(
    (status: 'active' | 'ended', endReason?: string, useBeacon = false) => {
      const usageLogId = usageLogIdRef.current;
      const accumulator = usageAccumulatorRef.current;
      if (!usageLogId || !accumulator) return;

      const snapshot = accumulator.getSnapshot();
      const payload = JSON.stringify({
        usageLogId,
        status,
        endReason,
        ...snapshot,
      });

      if (status === 'ended') {
        usageLogIdRef.current = null;
        usageAccumulatorRef.current = null;
      }

      if (useBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        try {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/voice/usage', blob);
          return;
        } catch {
          // fallback to fetch keepalive below
        }
      }

      void fetch('/api/voice/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: status === 'ended',
      }).catch(() => {
        // non-blocking telemetry
      });
    },
    []
  );

  const teardownHardwareAndSocket = useCallback(async () => {
    clearAllSessionTimers();
    pendingAutoEndRef.current = null;
    isPlayingRef.current = false;

    const activeSession = sessionRef.current;
    sessionRef.current = null;
    if (activeSession) {
      try {
        activeSession.close();
      } catch {
        // ignore close error
      }
    }

    const activeAudio = audioRef.current;
    audioRef.current = null;
    if (activeAudio) {
      await activeAudio.dispose();
    }

    setInputRms(0);
    setIsAssistantSpeaking(false);
  }, [clearAllSessionTimers]);

  const endSessionWithReason = useCallback(
    async (systemNotice?: string, endReason = 'user_stop') => {
      manualStopRef.current = true;
      resumeHandleRef.current = null;
      activeTokenRef.current = null;
      flushVoiceUsage('ended', endReason);
      try {
        sessionRef.current?.sendRealtimeInput({ audioStreamEnd: true });
      } catch {
        // ignore if socket already closed
      }
      await teardownHardwareAndSocket();
      finalizeOpenTranscripts();
      setIsMuted(false);
      setConnectionState('idle');
      if (systemNotice) {
        appendSystemOrAction('system', systemNotice);
      }
    },
    [appendSystemOrAction, finalizeOpenTranscripts, flushVoiceUsage, teardownHardwareAndSocket]
  );

  const scheduleGracefulAutoEnd = useCallback(
    (delayMs: number) => {
      if (autoEndGraceTimerRef.current) {
        clearTimeout(autoEndGraceTimerRef.current);
      }
      autoEndGraceTimerRef.current = setTimeout(() => {
        const pending = pendingAutoEndRef.current;
        if (!pending) return;
        const notice =
          pending.reason === 'off_topic_refusal'
            ? 'Voice session ended due to off-topic requests.'
            : 'Voice session ended.';
        void endSessionWithReason(notice, pending.reason);
      }, delayMs);
    },
    [endSessionWithReason]
  );

  const requestAutoEndSession = useCallback(
    (reason: string) => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      pendingAutoEndRef.current = { reason, turnFinished: false };

      // Mute mic capture immediately so ambient noise does not interrupt the goodbye remark
      if (audioRef.current) {
        audioRef.current.setMuted(true);
        setIsMuted(true);
      }

      if (autoEndFallbackTimerRef.current) {
        clearTimeout(autoEndFallbackTimerRef.current);
      }
      autoEndFallbackTimerRef.current = setTimeout(() => {
        if (!pendingAutoEndRef.current) return;
        const notice =
          reason === 'off_topic_refusal'
            ? 'Voice session ended due to off-topic requests.'
            : 'Voice session ended.';
        void endSessionWithReason(notice, reason);
      }, AUTO_END_FALLBACK_MS);
    },
    [endSessionWithReason]
  );

  const resetInactivityTimer = useCallback(() => {
    if (pendingAutoEndRef.current) return;
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      if (sessionRef.current || audioRef.current) {
        void endSessionWithReason(
          'Voice session ended after 2 minutes of inactivity.',
          'inactivity_timeout'
        );
      }
    }, INACTIVITY_AUTO_END_MS);
  }, [endSessionWithReason]);

  const fetchToken = useCallback(async (): Promise<{ token: string; model: string; expireAtMs: number }> => {
    const data: VoiceSessionTokenResponse = await fetchJsonWithBuffer('/api/voice/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: draftRef.current.organizationId,
        documentType: draftRef.current.documentType,
      }),
      timeoutMs: 20000,
      retry: true,
    });

    if (!data.success || !data.token) {
      const err = new Error(data.error || 'Failed to provision voice session');
      (err as any).code = data.code || 'SESSION_ERROR';
      throw err;
    }

    const expireAtMs = data.expireTime ? new Date(data.expireTime).getTime() : Date.now() + 18 * 60 * 1000;
    const tokenObj = {
      token: data.token,
      model: data.model || GEMINI_LIVE_MODEL,
      expireAtMs,
    };
    activeTokenRef.current = tokenObj;
    usageLogIdRef.current = data.usageLogId || null;
    usageAccumulatorRef.current = new VoiceSessionUsageAccumulator(Date.now());
    return tokenObj;
  }, []);

  const connectWebSocket = useCallback(
    async (isReconnect: boolean) => {
      const cached = activeTokenRef.current;
      const needsFreshToken =
        !cached || Date.now() > cached.expireAtMs - 60 * 1000 || !isReconnect;

      const tokenBundle = needsFreshToken ? await fetchToken() : cached;

      const ai = new GoogleGenAI({
        apiKey: tokenBundle.token,
        apiVersion: 'v1alpha',
      });

      const handleServerMessage = async (msg: LiveServerMessage) => {
        if (msg.usageMetadata) {
          usageAccumulatorRef.current?.recordUsageMetadata(msg.usageMetadata);
        }

        if (msg.sessionResumptionUpdate?.resumable && msg.sessionResumptionUpdate.newHandle) {
          resumeHandleRef.current = msg.sessionResumptionUpdate.newHandle;
        }

        if (msg.goAway) {
          // Proactively rotate connection using resumption handle before GoAway deadline
          if (!manualStopRef.current && !reconnectingRef.current) {
            reconnectingRef.current = true;
            setConnectionState('reconnecting');
            appendSystemOrAction('system', 'Refreshing live session seamlessly...');
            try {
              sessionRef.current?.close();
            } catch {
              // ignore
            }
            try {
              await connectWebSocket(true);
              setConnectionState('connected');
            } catch (err: any) {
              setErrorMessage(err?.message || 'Reconnection failed');
              setConnectionState('error');
            } finally {
              reconnectingRef.current = false;
            }
          }
          return;
        }

        if (msg.toolCallCancellation?.ids) {
          for (const id of msg.toolCallCancellation.ids) {
            cancelledToolIdsRef.current.add(id);
          }
        }

        if (msg.toolCall?.functionCalls && msg.toolCall.functionCalls.length > 0) {
          resetInactivityTimer();
          usageAccumulatorRef.current?.recordToolCalls(msg.toolCall.functionCalls.length);
          const functionResponses = [];

          for (const fc of msg.toolCall.functionCalls) {
            if (fc.id && cancelledToolIdsRef.current.has(fc.id)) {
              cancelledToolIdsRef.current.delete(fc.id);
              continue;
            }
            const response = await executeVoiceToolCall(fc, {
              draftRef,
              clientsDirectoryRef: clientsRef,
              actions: actionsRef.current,
              onActionLog: (actionText) => appendSystemOrAction('action', actionText),
              onRequestEndSession: requestAutoEndSession,
            });
            functionResponses.push(response);
          }

          if (functionResponses.length > 0 && sessionRef.current) {
            sessionRef.current.sendToolResponse({ functionResponses });
          }
        }

        const content = msg.serverContent;
        if (!content) return;

        if (content.interrupted) {
          audioRef.current?.flushPlayback();
          finalizeOpenTranscripts();
        }

        if (content.modelTurn?.parts) {
          const hasAudioChunk = content.modelTurn.parts.some((p) => Boolean(p.inlineData?.data));
          if (hasAudioChunk && autoEndGraceTimerRef.current) {
            clearTimeout(autoEndGraceTimerRef.current);
            autoEndGraceTimerRef.current = null;
          }
          for (const part of content.modelTurn.parts) {
            if (part.inlineData?.data) {
              audioRef.current?.enqueuePlayback(part.inlineData.data);
            }
          }
        }

        if (content.interimInputTranscription?.text) {
          resetInactivityTimer();
          upsertStreamingTranscript('user', content.interimInputTranscription.text, 'replace', false);
        }

        if (content.inputTranscription?.text) {
          resetInactivityTimer();
          upsertStreamingTranscript('user', content.inputTranscription.text, 'append', false);
        }

        if (content.outputTranscription?.text) {
          resetInactivityTimer();
          upsertStreamingTranscript('assistant', content.outputTranscription.text, 'append', false);
        }

        if (content.turnComplete || content.generationComplete) {
          usageAccumulatorRef.current?.commitTurn();
          finalizeOpenTranscripts();
          resetInactivityTimer();
        }

        if (content.turnComplete && pendingAutoEndRef.current) {
          pendingAutoEndRef.current.turnFinished = true;
          if (!isPlayingRef.current) {
            scheduleGracefulAutoEnd(AUTO_END_SILENT_GRACE_MS);
          }
        }
      };

      let timedOut = false;
      const connectPromise = ai.live.connect({
        model: tokenBundle.model,
        config: {
          sessionResumption: resumeHandleRef.current
            ? { handle: resumeHandleRef.current }
            : {},
        },
        callbacks: {
          onopen: () => {
            reconnectAttemptsRef.current = 0;
            flushVoiceUsage('active');
            if (usageSyncTimerRef.current) clearInterval(usageSyncTimerRef.current);
            usageSyncTimerRef.current = setInterval(() => {
              flushVoiceUsage('active');
            }, 15000);
          },
          onmessage: (msg) => {
            void handleServerMessage(msg);
          },
          onerror: (errEvent) => {
            console.error('Gemini Live WebSocket error:', errEvent);
          },
          onclose: (closeEvent) => {
            if (manualStopRef.current || reconnectingRef.current) return;
            if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && resumeHandleRef.current) {
              reconnectingRef.current = true;
              reconnectAttemptsRef.current += 1;
              setConnectionState('reconnecting');
              setTimeout(() => {
                void connectWebSocket(true)
                  .then(() => {
                    setConnectionState('connected');
                  })
                  .catch((err) => {
                    flushVoiceUsage('ended', 'reconnect_failed');
                    setErrorMessage(err?.message || `Connection closed (${closeEvent.code})`);
                    setConnectionState('error');
                  })
                  .finally(() => {
                    reconnectingRef.current = false;
                  });
              }, 750);
            } else {
              flushVoiceUsage('ended', 'disconnect');
              setConnectionState('idle');
              if (closeEvent.reason) {
                appendSystemOrAction('system', `Session ended: ${closeEvent.reason}`);
              }
            }
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          timedOut = true;
          reject(new Error('Voice connection timed out after 18s. Please tap the orb to retry.'));
        }, LIVE_CONNECT_TIMEOUT_MS);
      });

      const session = await Promise.race([connectPromise, timeoutPromise]);
      if (timedOut) {
        try {
          session.close();
        } catch {
          // ignore
        }
        return;
      }

      sessionRef.current = session;
    },
    [
      appendSystemOrAction,
      fetchToken,
      finalizeOpenTranscripts,
      flushVoiceUsage,
      requestAutoEndSession,
      resetInactivityTimer,
      scheduleGracefulAutoEnd,
      upsertStreamingTranscript,
    ]
  );

  const startSession = useCallback(async () => {
    if (connectionState === 'connected' || connectionState === 'initializing') return;

    manualStopRef.current = false;
    setErrorMessage(null);
    setErrorCode(null);
    setIsMuted(false);
    setConnectionState('initializing');

    try {
      await teardownHardwareAndSocket();

      const engine = new VoiceAudioEngine({
        onPcmFrame: (base64Pcm16k) => {
          try {
            sessionRef.current?.sendRealtimeInput({
              audio: {
                data: base64Pcm16k,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } catch {
            // ignore transient frame during reconnect
          }
        },
        onInputRms: (rms) => {
          setInputRms(rms);
          if (rms > 0.08) {
            resetInactivityTimer();
          }
        },
        onPlaybackChange: (playing) => {
          isPlayingRef.current = playing;
          setIsAssistantSpeaking(playing);
          if (!playing && pendingAutoEndRef.current?.turnFinished) {
            scheduleGracefulAutoEnd(AUTO_END_POST_PLAYBACK_MS);
          }
        },
      });

      audioRef.current = engine;
      await engine.start();
      await connectWebSocket(false);

      resetInactivityTimer();
      setConnectionState('connected');
      appendSystemOrAction(
        'system',
        `Voice Copilot connected for ${draftRef.current.documentType}. Speak naturally to build your draft.`
      );
    } catch (err: any) {
      flushVoiceUsage('ended', 'init_error');
      await teardownHardwareAndSocket();
      setErrorCode(err?.code || 'INIT_ERROR');
      setErrorMessage(err?.message || 'Unable to start voice session');
      setConnectionState('error');
    }
  }, [
    appendSystemOrAction,
    connectWebSocket,
    connectionState,
    flushVoiceUsage,
    resetInactivityTimer,
    scheduleGracefulAutoEnd,
    teardownHardwareAndSocket,
  ]);

  const stopSession = useCallback(async () => {
    await endSessionWithReason();
  }, [endSessionWithReason]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current || !sessionRef.current || pendingAutoEndRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.setMuted(nextMuted);
    setIsMuted(nextMuted);
    if (nextMuted) {
      audioRef.current.flushPlayback();
      setConnectionState('paused');
      try {
        sessionRef.current.sendRealtimeInput({ audioStreamEnd: true });
      } catch {
        // ignore
      }
    } else {
      resetInactivityTimer();
      setConnectionState('connected');
    }
  }, [isMuted, resetInactivityTimer]);

  const sendTextMessage = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim().slice(0, MAX_TEXT_MESSAGE_CHARS);
      if (!trimmed) return;

      if (!sessionRef.current || pendingAutoEndRef.current) {
        appendSystemOrAction('system', 'Start Voice Copilot first before sending live instructions.');
        return;
      }

      resetInactivityTimer();
      upsertStreamingTranscript('user', trimmed, 'replace', true);
      sessionRef.current.sendRealtimeInput({ text: trimmed });
    },
    [appendSystemOrAction, resetInactivityTimer, upsertStreamingTranscript]
  );

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
  }, []);

  useEffect(() => {
    const handlePageHide = () => {
      flushVoiceUsage('ended', 'page_unload', true);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', handlePageHide);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', handlePageHide);
      }
      manualStopRef.current = true;
      flushVoiceUsage('ended', 'unmount', true);
      void teardownHardwareAndSocket();
    };
  }, [flushVoiceUsage, teardownHardwareAndSocket]);

  return {
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
    clearTranscripts,
  };
}

