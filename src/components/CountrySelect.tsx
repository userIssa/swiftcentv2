'use client';

import React, { useMemo } from 'react';
import { findCountryOption, SUPPORTED_COUNTRIES } from '@/lib/countries';
import { ComboboxOption, SearchableCombobox } from '@/components/SearchableCombobox';

interface CountrySelectProps {
  value: string;
  onChange: (countryName: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  className?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = 'Select Country',
  disabled = false,
  ariaLabel = 'Country',
  id,
  className,
}: CountrySelectProps) {
  const matched = findCountryOption(value);
  const resolvedValue = matched ? matched.name : value;

  const options: ComboboxOption[] = useMemo(() => {
    const base = SUPPORTED_COUNTRIES.map((c) => ({
      value: c.name,
      label: c.name,
      icon: c.flag,
      searchText: `${c.code} ${c.name}`,
    }));
    if (resolvedValue && !base.some((o) => o.value.toLowerCase() === resolvedValue.toLowerCase())) {
      return [
        { value: resolvedValue, label: resolvedValue, icon: '🌍' },
        ...base,
      ];
    }
    return base;
  }, [resolvedValue]);

  return (
    <SearchableCombobox
      id={id}
      value={resolvedValue}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      searchCaption="Select Country"
      selectedIconFallback="🌍"
      disabled={disabled}
      allowCustomValue
      transformCustomValue={(raw) => (raw.trim().length >= 2 ? raw.trim() : null)}
      customActionLabel={(name) => `Use "${name}"`}
      ariaLabel={ariaLabel}
      className={className}
    />
  );
}

