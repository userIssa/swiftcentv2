'use client';

import React, { useMemo } from 'react';
import {
  formatCurrencyOptionLabel,
  getCurrencySelectOptions,
  normalizeCurrencyCode,
} from '@/lib/currencies';
import { ComboboxOption, SearchableCombobox } from '@/components/SearchableCombobox';

interface CurrencySelectProps {
  value: string;
  onChange: (currencyCode: string) => void;
  compact?: boolean;
  disabled?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
  ariaLabel?: string;
  id?: string;
}

export function CurrencySelect({
  value,
  onChange,
  compact = false,
  disabled = false,
  variant = 'light',
  className,
  ariaLabel = 'Currency',
  id,
}: CurrencySelectProps) {
  const normalized = normalizeCurrencyCode(value, 'USD');

  const options: ComboboxOption[] = useMemo(
    () =>
      getCurrencySelectOptions(normalized).map((opt) => ({
        value: opt.code,
        label: formatCurrencyOptionLabel(opt, compact),
        icon: opt.flag,
        searchText: `${opt.code} ${opt.name} ${opt.symbol} ${opt.keywords || ''}`,
      })),
    [compact, normalized]
  );

  return (
    <SearchableCombobox
      id={id}
      value={normalized}
      options={options}
      onChange={(next) => onChange(normalizeCurrencyCode(next, normalized))}
      searchCaption="Select Currency"
      selectedIconFallback="🌐"
      compact={compact}
      disabled={disabled}
      variant={variant}
      allowCustomValue
      transformCustomValue={(raw) => {
        const cleaned = raw.trim().toUpperCase();
        return /^[A-Z]{3}$/.test(cleaned) ? cleaned : null;
      }}
      customActionLabel={(code) => `Use ISO Currency "${code}"`}
      ariaLabel={ariaLabel}
      className={className}
    />
  );
}
