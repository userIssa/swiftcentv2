'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export interface ComboboxOption {
  value: string;
  label: string;
  icon?: string;
  searchText?: string;
}

export interface HighlightSegment {
  text: string;
  matched: boolean;
}

/**
 * Splits display text into matched and unmatched segments for crisp search highlighting.
 */
export function splitHighlightSegments(text: string, query: string): HighlightSegment[] {
  const q = query.trim();
  if (!q) return [{ text, matched: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return [{ text, matched: false }];

  const parts: HighlightSegment[] = [];
  if (idx > 0) {
    parts.push({ text: text.slice(0, idx), matched: false });
  }
  parts.push({ text: text.slice(idx, idx + q.length), matched: true });
  if (idx + q.length < text.length) {
    parts.push({ text: text.slice(idx + q.length), matched: false });
  }
  return parts;
}

export function filterComboboxOptions(
  options: ComboboxOption[],
  query: string
): ComboboxOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((opt) => {
    const haystack = `${opt.label} ${opt.value} ${opt.searchText || ''}`.toLowerCase();
    return haystack.includes(q);
  });
}

interface SearchableComboboxProps {
  value: string;
  options: ComboboxOption[];
  onChange: (nextValue: string) => void;
  placeholder?: string;
  searchCaption?: string;
  selectedIconFallback?: string;
  compact?: boolean;
  disabled?: boolean;
  variant?: 'light' | 'dark';
  allowCustomValue?: boolean;
  transformCustomValue?: (raw: string) => string | null;
  customActionLabel?: (raw: string) => string;
  ariaLabel?: string;
  id?: string;
  className?: string;
}

export function SearchableCombobox({
  value,
  options,
  onChange,
  placeholder = 'Search...',
  searchCaption = 'Select Option',
  selectedIconFallback = '🌐',
  compact = false,
  disabled = false,
  variant,
  allowCustomValue = false,
  transformCustomValue,
  customActionLabel,
  ariaLabel = searchCaption,
  id,
  className,
}: SearchableComboboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropUp, setDropUp] = useState(false);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value.toLowerCase() === (value || '').trim().toLowerCase()) || null,
    [options, value]
  );

  const filtered = useMemo(() => filterComboboxOptions(options, query), [options, query]);

  const customCandidate = useMemo(() => {
    if (!allowCustomValue) return null;
    const trimmed = query.trim();
    if (!trimmed) return null;
    const transformed = transformCustomValue ? transformCustomValue(trimmed) : trimmed;
    if (!transformed) return null;
    const alreadyExists = options.some(
      (opt) => opt.value.toLowerCase() === transformed.toLowerCase()
    );
    return alreadyExists ? null : transformed;
  }, [allowCustomValue, options, query, transformCustomValue]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  const openDropdown = () => {
    if (disabled) return;
    if (typeof window !== 'undefined' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 240 && rect.top > 240);
    }
    setOpen(true);
    setQuery('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const commitOption = (nextVal: string) => {
    onChange(nextVal);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalCount = filtered.length + (customCandidate ? 1 : 0);
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setQuery('');
      return;
    }
    if (e.key === 'ArrowDown' && totalCount > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % totalCount);
      return;
    }
    if (e.key === 'ArrowUp' && totalCount > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + totalCount) % totalCount);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) {
        commitOption(filtered[activeIndex].value);
      } else if (customCandidate) {
        commitOption(customCandidate);
      }
    }
  };

  const { theme } = useTheme();
  const isDark = (variant ?? theme) === 'dark';
  const displayLabel = selectedOption?.label || value || placeholder;
  const displayIcon = selectedOption?.icon || (value ? selectedIconFallback : undefined);

  return (
    <div ref={containerRef} className={`relative w-full ${className || ''}`}>
      {/* Trigger Pill / Search Input */}
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => {
          if (!open) openDropdown();
        }}
        className={`flex items-center justify-between gap-2 rounded-xl border transition-all cursor-pointer ${
          compact ? 'px-2.5 py-1.5 min-h-[34px]' : 'px-3 py-2 min-h-[42px]'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${
          open
            ? isDark
              ? 'bg-white/[0.08] backdrop-blur-xl border-sky-400/70 ring-2 ring-sky-400/20 text-white'
              : 'bg-white border-indigo-400 ring-2 ring-indigo-500/20 text-slate-900 shadow-xs'
            : isDark
              ? 'bg-white/[0.05] backdrop-blur-xl border-white/[0.12] hover:border-white/25 text-white'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {!open ? (
            <>
              {displayIcon && (
                <span className="text-base leading-none shrink-0" aria-hidden="true">
                  {displayIcon}
                </span>
              )}
              <span
                className={`truncate ${
                  compact ? 'text-xs font-semibold' : 'text-[13px] font-medium'
                } ${
                  !value
                    ? isDark
                      ? 'text-slate-400'
                      : 'text-slate-400'
                    : isDark
                      ? 'text-white'
                      : 'text-slate-800'
                }`}
              >
                {displayLabel}
              </span>
            </>
          ) : (
            <div className="flex flex-col min-w-0 flex-1">
              {!compact && (
                <span
                  className={`text-[10px] font-medium leading-none mb-0.5 ${
                    isDark ? 'text-sky-300' : 'text-indigo-500'
                  }`}
                >
                  {searchCaption}
                </span>
              )}
              <input
                ref={inputRef}
                id={id}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={compact ? 'Search...' : `Type to filter (${value || placeholder})`}
                className={`w-full bg-transparent focus:outline-none ${
                  compact ? 'text-xs font-medium' : 'text-[13px] font-medium'
                } ${
                  isDark
                    ? 'text-white placeholder:text-slate-500'
                    : 'text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (open) {
              setOpen(false);
              setQuery('');
            } else {
              openDropdown();
            }
          }}
          aria-label={open ? 'Close options' : 'Open options'}
          className={`shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          } ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Rounded Options Popover */}
      {open && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 min-w-[220px] rounded-2xl border p-1.5 z-[95] shadow-[0_14px_34px_rgba(15,23,42,0.16)] animate-in fade-in duration-100 ${
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            isDark
              ? 'bg-[#081026]/90 backdrop-blur-2xl border-white/15 text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.7)]'
              : 'bg-white border-slate-200/90 text-slate-800'
          }`}
        >
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {filtered.length === 0 && !customCandidate ? (
              <div className="px-3 py-3 text-center text-xs text-slate-400">
                No matches for &ldquo;{query}&rdquo;
              </div>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = opt.value.toLowerCase() === (value || '').trim().toLowerCase();
                const isHighlighted = idx === activeIndex;
                const segments = splitHighlightSegments(opt.label, query);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => commitOption(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-emerald-500/15 text-emerald-200'
                          : 'bg-emerald-50/80 text-slate-900'
                        : isHighlighted
                          ? isDark
                            ? 'bg-white/10 text-white'
                            : 'bg-indigo-50/80 text-slate-900'
                          : isDark
                            ? 'text-slate-300 hover:bg-white/[0.06]'
                            : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      {opt.icon && (
                        <span className="text-base leading-none shrink-0" aria-hidden="true">
                          {opt.icon}
                        </span>
                      )}
                      <span className="truncate">
                        {segments.map((seg, segIdx) => (
                          <span
                            key={segIdx}
                            className={
                              seg.matched
                                ? isDark
                                  ? 'font-semibold text-white'
                                  : 'font-semibold text-slate-950'
                                : isSelected
                                  ? 'font-medium'
                                  : isDark
                                    ? 'text-slate-300'
                                    : 'text-slate-600'
                            }
                          >
                            {seg.text}
                          </span>
                        ))}
                      </span>
                    </span>

                    {isSelected && (
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isDark
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })
            )}

            {customCandidate && (
              <button
                type="button"
                onClick={() => commitOption(customCandidate)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-sky-500/15 text-sky-200 hover:bg-sky-500/25'
                    : 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100/80'
                }`}
              >
                <span className="text-base leading-none">{selectedIconFallback}</span>
                <span>
                  {customActionLabel
                    ? customActionLabel(customCandidate)
                    : `Use "${customCandidate}"`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

