'use client';

const WORKLET_URL = '/worklets/pcm-capture-processor.js';
const OUTPUT_SAMPLE_RATE = 24000;

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export function base64ToPcmFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const byteLen = binary.length;
  const bytes = new Uint8Array(byteLen);
  for (let i = 0; i < byteLen; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const sampleCount = Math.floor(byteLen / 2);
  const floats = new Float32Array(sampleCount);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let i = 0; i < sampleCount; i++) {
    const int16 = view.getInt16(i * 2, true);
    floats[i] = int16 / 32768;
  }

  return floats;
}

export interface VoiceAudioCallbacks {
  onPcmFrame: (base64Pcm16k: string) => void;
  onInputRms?: (rms: number) => void;
  onPlaybackChange?: (isPlaying: boolean) => void;
}

/**
 * Manages full-duplex Web Audio API capture (AudioWorklet -> 16kHz PCM) and
 * interruptible playback (24kHz PCM) with leak-free resource disposal.
 */
export class VoiceAudioEngine {
  private captureContext: AudioContext | null = null;
  private playbackContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private silentSink: GainNode | null = null;

  private activePlaybackNodes = new Set<AudioBufferSourceNode>();
  private nextPlaybackTime = 0;
  private muted = false;
  private disposed = false;

  constructor(private readonly callbacks: VoiceAudioCallbacks) {}

  async start(): Promise<void> {
    if (this.disposed) return;

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone capture is not supported in this browser context (requires HTTPS or localhost).');
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });

    if (this.disposed) {
      this.stopTracks();
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    this.captureContext = new AudioCtx({ latencyHint: 'interactive' });
    await this.captureContext.resume();
    await this.captureContext.audioWorklet.addModule(WORKLET_URL);

    try {
      this.playbackContext = new AudioCtx({
        sampleRate: OUTPUT_SAMPLE_RATE,
        latencyHint: 'interactive',
      });
    } catch {
      this.playbackContext = new AudioCtx({ latencyHint: 'interactive' });
    }
    await this.playbackContext.resume();

    this.sourceNode = this.captureContext.createMediaStreamSource(this.mediaStream);
    this.workletNode = new AudioWorkletNode(this.captureContext, 'pcm-capture-processor');

    this.workletNode.port.onmessage = (event: MessageEvent) => {
      if (this.disposed || this.muted) return;
      const data = event.data;
      if (data?.type === 'pcm' && data.buffer instanceof ArrayBuffer) {
        if (typeof data.rms === 'number') {
          this.callbacks.onInputRms?.(data.rms);
        }
        const b64 = arrayBufferToBase64(data.buffer);
        this.callbacks.onPcmFrame(b64);
      }
    };

    // Route through a 0-gain node so Chrome/Safari keep AudioWorklet rendering without mic echo
    this.silentSink = this.captureContext.createGain();
    this.silentSink.gain.value = 0;

    this.sourceNode.connect(this.workletNode);
    this.workletNode.connect(this.silentSink);
    this.silentSink.connect(this.captureContext.destination);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.mediaStream) {
      for (const track of this.mediaStream.getAudioTracks()) {
        track.enabled = !muted;
      }
    }
    if (muted) {
      this.callbacks.onInputRms?.(0);
    }
  }

  enqueuePlayback(base64Pcm24k: string): void {
    if (this.disposed || !this.playbackContext) return;
    if (this.playbackContext.state === 'suspended') {
      void this.playbackContext.resume();
    }

    const floats = base64ToPcmFloat32(base64Pcm24k);
    if (floats.length === 0) return;

    const buffer = this.playbackContext.createBuffer(1, floats.length, OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(new Float32Array(floats), 0);

    const source = this.playbackContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.playbackContext.destination);

    const now = this.playbackContext.currentTime;
    const startAt = Math.max(now + 0.02, this.nextPlaybackTime);
    this.nextPlaybackTime = startAt + buffer.duration;

    if (this.activePlaybackNodes.size === 0) {
      this.callbacks.onPlaybackChange?.(true);
    }

    this.activePlaybackNodes.add(source);
    source.onended = () => {
      this.activePlaybackNodes.delete(source);
      try {
        source.disconnect();
      } catch {
        // ignore already disconnected node
      }
      if (this.activePlaybackNodes.size === 0) {
        this.callbacks.onPlaybackChange?.(false);
      }
    };

    source.start(startAt);
  }

  flushPlayback(): void {
    for (const source of this.activePlaybackNodes) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore
      }
    }
    this.activePlaybackNodes.clear();
    this.nextPlaybackTime = 0;
    this.callbacks.onPlaybackChange?.(false);
  }

  private stopTracks(): void {
    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.flushPlayback();

    try {
      this.workletNode?.port.close();
      this.workletNode?.disconnect();
      this.sourceNode?.disconnect();
      this.silentSink?.disconnect();
    } catch {
      // ignore teardown errors
    }

    this.stopTracks();

    if (this.captureContext && this.captureContext.state !== 'closed') {
      await this.captureContext.close().catch(() => {});
    }
    if (this.playbackContext && this.playbackContext.state !== 'closed') {
      await this.playbackContext.close().catch(() => {});
    }

    this.captureContext = null;
    this.playbackContext = null;
  }
}

