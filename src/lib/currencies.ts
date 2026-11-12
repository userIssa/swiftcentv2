export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  keywords?: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', keywords: 'united states america' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬', keywords: 'nigeria lagos abuja' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', keywords: 'europe eurozone germany france' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', keywords: 'united kingdom uk england' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', keywords: 'canada' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', keywords: 'australia' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', flag: '🇬🇭', keywords: 'ghana accra' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪', keywords: 'kenya nairobi' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', keywords: 'south africa' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', keywords: 'japan tokyo' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', keywords: 'switzerland zurich' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', keywords: 'india' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', keywords: 'united arab emirates dubai' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', keywords: 'singapore' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', keywords: 'new zealand' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', keywords: 'china rmb' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰', keywords: 'hong kong' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪', keywords: 'sweden' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴', keywords: 'norway' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰', keywords: 'denmark' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽', keywords: 'mexico' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', keywords: 'brazil' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱', keywords: 'poland' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷', keywords: 'turkey' },
];

export const SUPPORTED_CURRENCY_CODES: string[] = SUPPORTED_CURRENCIES.map((c) => c.code);

const CURRENCY_BY_CODE = new Map<string, CurrencyOption>(
  SUPPORTED_CURRENCIES.map((option) => [option.code, option])
);

const ISO_CURRENCY_RE = /^[A-Z]{3}$/;

/**
 * Normalizes a currency code to an uppercase 3-letter ISO-4217 code,
 * falling back cleanly when unset or malformed.
 */
export function normalizeCurrencyCode(
  input?: string | null,
  fallback: string = 'USD'
): string {
  const safeFallback =
    typeof fallback === 'string' && ISO_CURRENCY_RE.test(fallback.trim().toUpperCase())
      ? fallback.trim().toUpperCase()
      : 'USD';

  if (typeof input !== 'string') return safeFallback;
  const normalized = input.trim().toUpperCase();
  return ISO_CURRENCY_RE.test(normalized) ? normalized : safeFallback;
}

/**
 * Returns the short display symbol for a currency code (e.g., USD -> "$", NGN -> "₦").
 */
export function getCurrencySymbol(currency?: string | null): string {
  const code = normalizeCurrencyCode(currency, 'USD');
  const known = CURRENCY_BY_CODE.get(code);
  if (known) return known.symbol;

  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    const symbolPart = parts.find((part) => part.type === 'currency');
    return symbolPart?.value || code;
  } catch {
    return code;
  }
}

export function getCurrencyFlag(currency?: string | null): string {
  const code = normalizeCurrencyCode(currency, 'USD');
  return CURRENCY_BY_CODE.get(code)?.flag || '🌐';
}

export function getCurrencySelectOptions(currentValue?: string | null): CurrencyOption[] {
  const normalized = normalizeCurrencyCode(currentValue, 'USD');
  if (CURRENCY_BY_CODE.has(normalized)) {
    return SUPPORTED_CURRENCIES;
  }
  return [
    ...SUPPORTED_CURRENCIES,
    {
      code: normalized,
      symbol: getCurrencySymbol(normalized),
      name: normalized,
      flag: '🌐',
    },
  ];
}

export function formatCurrencyOptionLabel(option: CurrencyOption, compact: boolean = false): string {
  return compact
    ? `${option.code} (${option.symbol})`
    : `${option.code} (${option.symbol}) - ${option.name}`;
}

export function searchCurrencies(query: string, currentValue?: string | null): CurrencyOption[] {
  const options = getCurrencySelectOptions(currentValue);
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (opt) =>
      opt.code.toLowerCase().includes(q) ||
      opt.name.toLowerCase().includes(q) ||
      opt.symbol.toLowerCase().includes(q) ||
      (opt.keywords && opt.keywords.includes(q))
  );
}
