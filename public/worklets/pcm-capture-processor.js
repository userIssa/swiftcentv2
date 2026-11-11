/**
 * AudioWorkletProcessor that captures microphone audio at any hardware sample rate
 * (typically 44.1kHz or 48kHz), resamples via linear interpolation to 16kHz mono,
 * quantizes to signed 16-bit little-endian PCM, and emits ~40ms frames (640 samples)
 * with normalized RMS metering over a zero-copy transferable ArrayBuffer.
 */
class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    this.frameSize = 640; // 40ms @ 16kHz (within Gemini Live's 20-100ms optimal window)
    this.outputBuffer = new Int16Array(this.frameSize);
    this.outputIndex = 0;
    this.rmsAccumulator = 0;

    // Fractional cursor across input quanta to maintain phase continuity when downsampling
    this.inputTail = 0;
    this.hasPrevSample = false;
    this.prevSample = 0;
  }

  emitFrameIfFull() {
    if (this.outputIndex < this.frameSize) return;

    const rms = Math.sqrt(this.rmsAccumulator / this.frameSize);
    const frameCopy = new Int16Array(this.outputBuffer);

    this.port.postMessage(
      {
        type: 'pcm',
        buffer: frameCopy.buffer,
        rms: Math.min(1, rms * 3.5),
      },
      [frameCopy.buffer]
    );

    this.outputIndex = 0;
    this.rmsAccumulator = 0;
  }

  pushOutputSample(floatSample) {
    const clamped = Math.max(-1, Math.min(1, floatSample));
    const int16 = clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
    this.outputBuffer[this.outputIndex++] = int16;
    this.rmsAccumulator += clamped * clamped;
    this.emitFrameIfFull();
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const ch0 = input[0];
    if (!ch0 || ch0.length === 0) return true;

    // Mix down multi-channel hardware input cleanly if needed
    const channelCount = input.length;
    const mono = channelCount === 1 ? ch0 : new Float32Array(ch0.length);
    if (channelCount > 1) {
      for (let i = 0; i < ch0.length; i++) {
        let sum = 0;
        for (let c = 0; c < channelCount; c++) {
          sum += input[c][i] || 0;
        }
        mono[i] = sum / channelCount;
      }
    }

    if (sampleRate === this.targetSampleRate) {
      for (let i = 0; i < mono.length; i++) {
        this.pushOutputSample(mono[i]);
      }
      return true;
    }

    const ratio = sampleRate / this.targetSampleRate;
    let pos = this.inputTail;

    if (!this.hasPrevSample) {
      this.prevSample = mono[0];
      this.hasPrevSample = true;
    }

    while (pos < mono.length) {
      const idx = Math.floor(pos);
      const frac = pos - idx;
      const s0 = idx === 0 ? this.prevSample : mono[idx - 1];
      const s1 = mono[idx];
      const interpolated = s0 + (s1 - s0) * frac;
      this.pushOutputSample(interpolated);
      pos += ratio;
    }

    this.inputTail = pos - mono.length;
    this.prevSample = mono[mono.length - 1];
    return true;
  }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor);

