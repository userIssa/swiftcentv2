export interface GeminiTokenTotals {
  promptTokenCount: number;
  responseTokenCount: number;
  thoughtsTokenCount: number;
  totalTokenCount: number;
}

export interface VoiceUsageSnapshot extends GeminiTokenTotals {
  durationSeconds: number;
  toolCallCount: number;
  turnCount: number;
}

function clampInt(val: unknown): number {
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.floor(num);
}

/**
 * Accumulates Gemini Live API usageMetadata safely across chunked streaming updates
 * within each turn without double-counting intra-turn partial updates.
 */
export class VoiceSessionUsageAccumulator {
  private startedAtMs: number;
  private committed: GeminiTokenTotals = {
    promptTokenCount: 0,
    responseTokenCount: 0,
    thoughtsTokenCount: 0,
    totalTokenCount: 0,
  };
  private pendingTurn: GeminiTokenTotals = {
    promptTokenCount: 0,
    responseTokenCount: 0,
    thoughtsTokenCount: 0,
    totalTokenCount: 0,
  };
  private toolCallCount = 0;
  private turnCount = 0;

  constructor(startedAtMs: number = Date.now()) {
    this.startedAtMs = startedAtMs;
  }

  recordUsageMetadata(meta?: {
    promptTokenCount?: number | null;
    responseTokenCount?: number | null;
    thoughtsTokenCount?: number | null;
    totalTokenCount?: number | null;
  }): void {
    if (!meta) return;
    const prompt = clampInt(meta.promptTokenCount);
    const response = clampInt(meta.responseTokenCount);
    const thoughts = clampInt(meta.thoughtsTokenCount);
    const total = clampInt(meta.totalTokenCount) || prompt + response + thoughts;

    this.pendingTurn = {
      promptTokenCount: Math.max(this.pendingTurn.promptTokenCount, prompt),
      responseTokenCount: Math.max(this.pendingTurn.responseTokenCount, response),
      thoughtsTokenCount: Math.max(this.pendingTurn.thoughtsTokenCount, thoughts),
      totalTokenCount: Math.max(this.pendingTurn.totalTokenCount, total),
    };
  }

  commitTurn(): void {
    const hasPending =
      this.pendingTurn.promptTokenCount > 0 ||
      this.pendingTurn.responseTokenCount > 0 ||
      this.pendingTurn.thoughtsTokenCount > 0 ||
      this.pendingTurn.totalTokenCount > 0;

    if (hasPending) {
      this.committed = {
        promptTokenCount: this.committed.promptTokenCount + this.pendingTurn.promptTokenCount,
        responseTokenCount:
          this.committed.responseTokenCount + this.pendingTurn.responseTokenCount,
        thoughtsTokenCount:
          this.committed.thoughtsTokenCount + this.pendingTurn.thoughtsTokenCount,
        totalTokenCount: this.committed.totalTokenCount + this.pendingTurn.totalTokenCount,
      };
      this.pendingTurn = {
        promptTokenCount: 0,
        responseTokenCount: 0,
        thoughtsTokenCount: 0,
        totalTokenCount: 0,
      };
    }

    this.turnCount += 1;
  }

  recordToolCalls(count: number): void {
    this.toolCallCount += clampInt(count);
  }

  getSnapshot(nowMs: number = Date.now()): VoiceUsageSnapshot {
    const durationSeconds = Math.max(0, Math.round((nowMs - this.startedAtMs) / 1000));
    return {
      durationSeconds,
      promptTokenCount: this.committed.promptTokenCount + this.pendingTurn.promptTokenCount,
      responseTokenCount:
        this.committed.responseTokenCount + this.pendingTurn.responseTokenCount,
      thoughtsTokenCount:
        this.committed.thoughtsTokenCount + this.pendingTurn.thoughtsTokenCount,
      totalTokenCount: this.committed.totalTokenCount + this.pendingTurn.totalTokenCount,
      toolCallCount: this.toolCallCount,
      turnCount: this.turnCount,
    };
  }
}

