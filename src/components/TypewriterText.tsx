'use client';

import React, { useEffect, useRef, useState } from 'react';
import { computeTypewriterStep, getSharedPrefixLength } from '@/lib/voice/typewriter';

interface TypewriterTextProps {
  text: string;
  streamKey?: string;
  isFinal?: boolean;
  startComplete?: boolean;
  showCursorWhileTyping?: boolean;
  onProgress?: () => void;
  className?: string;
}

const TYPEWRITER_TICK_MS = 18;

export function TypewriterText({
  text,
  streamKey,
  isFinal = true,
  startComplete = false,
  showCursorWhileTyping = true,
  onProgress,
  className,
}: TypewriterTextProps) {
  const [visibleCount, setVisibleCount] = useState<number>(() =>
    startComplete ? text.length : 0
  );
  const prevStreamKeyRef = useRef<string | undefined>(streamKey);
  const prevDisplayedRef = useRef<string>(startComplete ? text : '');
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  // Handle streamKey transitions (new turn) vs incremental appends/corrections
  useEffect(() => {
    if (prevStreamKeyRef.current !== streamKey) {
      prevStreamKeyRef.current = streamKey;
      if (startComplete) {
        setVisibleCount(text.length);
        prevDisplayedRef.current = text;
      } else {
        setVisibleCount(0);
        prevDisplayedRef.current = '';
      }
      return;
    }

    setVisibleCount((currentCount) => {
      const currentSlice = prevDisplayedRef.current.slice(0, currentCount);
      const shared = getSharedPrefixLength(currentSlice, text);
      return Math.min(text.length, shared);
    });
  }, [text, streamKey, startComplete]);

  useEffect(() => {
    prevDisplayedRef.current = text.slice(0, visibleCount);
  }, [text, visibleCount]);

  useEffect(() => {
    if (visibleCount >= text.length) return;

    const timer = setTimeout(() => {
      setVisibleCount((prev) => {
        const remaining = text.length - prev;
        if (remaining <= 0) return prev;
        const step = computeTypewriterStep(remaining);
        return Math.min(text.length, prev + step);
      });
      onProgressRef.current?.();
    }, TYPEWRITER_TICK_MS);

    return () => clearTimeout(timer);
  }, [text, visibleCount]);

  const displayed = text.slice(0, visibleCount);
  const isAnimating = visibleCount < text.length || !isFinal;

  return (
    <span className={className}>
      <span>{displayed}</span>
      {showCursorWhileTyping && isAnimating && (
        <span
          aria-hidden="true"
          className="inline-block w-[2px] h-[1em] ml-0.5 bg-current opacity-70 animate-pulse align-text-bottom rounded-full"
        />
      )}
    </span>
  );
}

