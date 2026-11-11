const TRANSIENT_STATUS_CODES = new Set([408, 429, 502, 503, 504]);

export interface BufferedFetchOptions extends RequestInit {
  /** Per-attempt timeout buffer in milliseconds (default: 15000). */
  timeoutMs?: number;
  /** Number of automatic cold-start/transient retries (default: 2 for GET, 0 otherwise). */
  retries?: number;
  /** Explicit override allowing retries on idempotent POST reads (e.g. /api/voice/resolve). */
  retry?: boolean;
}

export function isTransientRetryStatus(status: number): boolean {
  return TRANSIENT_STATUS_CODES.has(status);
}

export function shouldRetryRequest(method?: string, retryOverride?: boolean): boolean {
  if (typeof retryOverride === 'boolean') return retryOverride;
  return (method || 'GET').toUpperCase() === 'GET';
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function parseJsonPayload<T = any>(res: Response): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  rawText: string;
}> {
  const rawText = await res.text();
  if (!rawText) {
    return { ok: res.ok, status: res.status, data: null, rawText: '' };
  }
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(rawText) as T, rawText };
  } catch {
    return { ok: res.ok, status: res.status, data: null, rawText };
  }
}

/**
 * Resilient JSON fetch helper with generous timeout buffers and automatic
 * backoff retries for serverless/database cold starts and transient 502/503/504 responses.
 */
export async function fetchJsonWithBuffer<T = any>(
  url: string,
  options: BufferedFetchOptions = {}
): Promise<T> {
  const { timeoutMs = 15000, retries, retry, ...init } = options;
  const allowRetry = shouldRetryRequest(init.method, retry);
  const maxRetries = allowRetry ? Math.max(0, retries ?? 2) : 0;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        signal: init.signal || controller.signal,
      });

      clearTimeout(timer);

      const { ok, status, data } = await parseJsonPayload<T & { error?: string }>(res);

      if (isTransientRetryStatus(status) && attempt < maxRetries) {
        await waitMs(600 * (attempt + 1) + Math.round(Math.random() * 250));
        continue;
      }

      if (data && typeof data === 'object') {
        return data;
      }

      if (!ok) {
        return {
          success: false,
          error: `Server returned non-JSON response (HTTP ${status}). Retrying or refreshing may resolve temporary cold starts.`,
        } as T;
      }

      return { success: false, error: `Empty response from server (HTTP ${status})` } as T;
    } catch (err: any) {
      clearTimeout(timer);
      const isAbort = err?.name === 'AbortError';
      lastError = isAbort
        ? new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s while waiting for API data`)
        : err;

      if (attempt < maxRetries && !init.signal?.aborted) {
        await waitMs(600 * (attempt + 1) + Math.round(Math.random() * 250));
        continue;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to load data after retrying API request');
}

