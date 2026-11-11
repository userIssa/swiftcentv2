'use client';

import React from 'react';

interface NumericInputProps {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
}

/**
 * NumericInput eliminates browser spin buttons (up/down toggles)
 * and handles clean typing without sticky leading zeros (e.g. 01500).
 */
export function NumericInput({
  value,
  onChange,
  placeholder = '0',
  className = '',
  prefix,
  suffix,
  min,
  max,
}: NumericInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Allow empty string so user can backspace completely
    if (raw === '') {
      onChange('');
      return;
    }

    // Allow only valid numbers and a single decimal point
    if (!/^\d*\.?\d*$/.test(raw)) {
      return;
    }

    // If starts with multiple leading zeros like "00", trim
    if (raw.length > 1 && raw.startsWith('0') && raw[1] !== '.') {
      raw = raw.replace(/^0+/, '');
      if (raw === '') raw = '0';
    }

    if (max !== undefined && parseFloat(raw) > max) {
      return;
    }

    onChange(raw);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select text on focus so user can immediately type new value
    if (e.target.value === '0') {
      e.target.select();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      onChange('0');
    }
  };

  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-2.5 text-xs text-slate-400 select-none pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
          prefix ? 'pl-6' : ''
        } ${suffix ? 'pr-6' : ''} ${className}`}
      />
      {suffix && (
        <span className="absolute right-2.5 text-xs text-slate-400 select-none pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

