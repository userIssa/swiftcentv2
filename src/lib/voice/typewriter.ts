/**
 * Returns the length of the longest shared leading prefix between two strings
 * so live transcription updates animate smoothly without re-typing confirmed words.
 */
export function getSharedPrefixLength(prevText: string, nextText: string): number {
  const limit = Math.min(prevText.length, nextText.length);
  let i = 0;
  while (i < limit && prevText.charCodeAt(i) === nextText.charCodeAt(i)) {
    i += 1;
  }
  return i;
}

/**
 * Adaptive per-tick character advancement (~18ms tick) that gives crisp AI typing cadence
 * while gently catching up when Gemini emits multi-word chunks.
 */
export function computeTypewriterStep(remainingChars: number): number {
  if (remainingChars <= 0) return 0;
  if (remainingChars > 90) return 5;
  if (remainingChars > 45) return 3;
  if (remainingChars > 20) return 2;
  return 1;
}

