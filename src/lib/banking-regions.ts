export type BankingRegionId =
  | 'global'
  | 'ng_africa'
  | 'uk'
  | 'eu_sepa'
  | 'us'
  | 'ca'
  | 'au'
  | 'in';

export interface BankingRegionPreset {
  id: BankingRegionId;
  flag: string;
  label: string;
  bankPlaceholder: string;
  accountHolderPlaceholder: string;
  routingLabel: string;
  routingShortLabel: string;
  routingPlaceholder: string;
  accountLabel: string;
  accountShortLabel: string;
  accountPlaceholder: string;
  swiftLabel: string;
  swiftPlaceholder: string;
  instructionsPlaceholder: string;
}

export const BANKING_REGION_PRESETS: BankingRegionPreset[] = [
  {
    id: 'global',
    flag: '🌐',
    label: 'Global (Multi-Region / SWIFT)',
    bankPlaceholder: 'e.g. Access Bank, Barclays, Deutsche Bank, Wise',
    accountHolderPlaceholder: 'e.g. Your Registered Business Name',
    routingLabel: 'Local Bank / Sort / Clearing Code (Optional)',
    routingShortLabel: 'Bank / Clearing Code',
    routingPlaceholder: 'e.g. Sort Code, BSB, IFSC, or Routing #',
    accountLabel: 'Account Number / IBAN',
    accountShortLabel: 'Account / IBAN',
    accountPlaceholder: 'e.g. 0123456789 or GB29NWBK60161331926819',
    swiftLabel: 'SWIFT / BIC Code (For Cross-Border Wires)',
    swiftPlaceholder: 'e.g. ABNGNGLA, BARCGB22, CHASUS33',
    instructionsPlaceholder:
      'Optional intermediary bank, branch name, Mobile Money, or transfer reference note',
  },
  {
    id: 'ng_africa',
    flag: '🇳🇬',
    label: 'Nigeria & Africa (NUBAN / SWIFT)',
    bankPlaceholder: 'e.g. GTBank, Access Bank, Zenith Bank, Standard Bank',
    accountHolderPlaceholder: 'e.g. Apex Creative Studio Ltd',
    routingLabel: 'Bank Code / Branch Sort Code (Optional)',
    routingShortLabel: 'Bank / Sort Code',
    routingPlaceholder: 'e.g. 058 (if required)',
    accountLabel: 'Account Number / NUBAN',
    accountShortLabel: 'Account / NUBAN',
    accountPlaceholder: 'e.g. 0123456789',
    swiftLabel: 'SWIFT / BIC Code (For International Domiciliary Wires)',
    swiftPlaceholder: 'e.g. GTBINGLA or ABNGNGLA',
    instructionsPlaceholder:
      'Optional domiciliary bank details, Paystack/Transfer reference, or MoMo handle',
  },
  {
    id: 'uk',
    flag: '🇬🇧',
    label: 'United Kingdom (Sort Code / BACS)',
    bankPlaceholder: 'e.g. Barclays, HSBC UK, Monzo Business',
    accountHolderPlaceholder: 'e.g. Apex Digital Studio Ltd',
    routingLabel: 'Sort Code',
    routingShortLabel: 'Sort Code',
    routingPlaceholder: 'e.g. 20-00-00',
    accountLabel: 'Account Number',
    accountShortLabel: 'Account Number',
    accountPlaceholder: 'e.g. 12345678',
    swiftLabel: 'SWIFT / BIC or IBAN (Optional)',
    swiftPlaceholder: 'e.g. BARCGB22',
    instructionsPlaceholder: 'Optional IBAN or payment reference note',
  },
  {
    id: 'eu_sepa',
    flag: '🇪🇺',
    label: 'Europe (SEPA / IBAN)',
    bankPlaceholder: 'e.g. Deutsche Bank, ING, BNP Paribas, Revolut',
    accountHolderPlaceholder: 'e.g. Studio Nord GmbH',
    routingLabel: 'National Bank / Clearing Code (Optional)',
    routingShortLabel: 'Bank Code',
    routingPlaceholder: 'e.g. BLZ / Guichet (optional)',
    accountLabel: 'IBAN',
    accountShortLabel: 'IBAN',
    accountPlaceholder: 'e.g. DE89 3704 0044 0532 0130 00',
    swiftLabel: 'BIC / SWIFT Code',
    swiftPlaceholder: 'e.g. COBADEFFXXX',
    instructionsPlaceholder: 'Optional SEPA instant instructions or reference note',
  },
  {
    id: 'us',
    flag: '🇺🇸',
    label: 'United States (ACH / Wire)',
    bankPlaceholder: 'e.g. JPMorgan Chase Bank, Mercury, Bank of America',
    accountHolderPlaceholder: 'e.g. Acme Digital Labs LLC',
    routingLabel: 'ABA / Routing Number',
    routingShortLabel: 'ABA Routing',
    routingPlaceholder: 'e.g. 123456789',
    accountLabel: 'Account Number',
    accountShortLabel: 'Account Number',
    accountPlaceholder: 'e.g. 987654321012',
    swiftLabel: 'SWIFT / BIC Code (Optional for International)',
    swiftPlaceholder: 'e.g. CHASUS33',
    instructionsPlaceholder: 'Optional ACH vs Wire routing note',
  },
  {
    id: 'ca',
    flag: '🇨🇦',
    label: 'Canada (EFT / Transit / Interac)',
    bankPlaceholder: 'e.g. RBC Royal Bank, TD Canada Trust',
    accountHolderPlaceholder: 'e.g. Northern Studio Inc.',
    routingLabel: 'Institution & Transit Number',
    routingShortLabel: 'Transit / Inst #',
    routingPlaceholder: 'e.g. 003-12345',
    accountLabel: 'Account Number',
    accountShortLabel: 'Account Number',
    accountPlaceholder: 'e.g. 1234567',
    swiftLabel: 'SWIFT / BIC Code (Optional)',
    swiftPlaceholder: 'e.g. ROYCCAT2',
    instructionsPlaceholder: 'Optional Interac e-Transfer email or wire note',
  },
  {
    id: 'au',
    flag: '🇦🇺',
    label: 'Australia (BSB / PayID / Wire)',
    bankPlaceholder: 'e.g. Commonwealth Bank, ANZ, NAB',
    accountHolderPlaceholder: 'e.g. Pacific Studio Pty Ltd',
    routingLabel: 'BSB Code',
    routingShortLabel: 'BSB Code',
    routingPlaceholder: 'e.g. 062-000',
    accountLabel: 'Account Number',
    accountShortLabel: 'Account Number',
    accountPlaceholder: 'e.g. 12345678',
    swiftLabel: 'SWIFT / BIC Code (Optional)',
    swiftPlaceholder: 'e.g. CTBAAU2S',
    instructionsPlaceholder: 'Optional PayID or branch note',
  },
  {
    id: 'in',
    flag: '🇮🇳',
    label: 'India (IFSC / NEFT / UPI)',
    bankPlaceholder: 'e.g. HDFC Bank, ICICI Bank, State Bank of India',
    accountHolderPlaceholder: 'e.g. Apex Tech Pvt Ltd',
    routingLabel: 'IFSC Code',
    routingShortLabel: 'IFSC Code',
    routingPlaceholder: 'e.g. HDFC0001234',
    accountLabel: 'Account Number',
    accountShortLabel: 'Account Number',
    accountPlaceholder: 'e.g. 50200012345678',
    swiftLabel: 'SWIFT / BIC Code (Optional)',
    swiftPlaceholder: 'e.g. HDFCINBB',
    instructionsPlaceholder: 'Optional UPI ID or branch address',
  },
];

const PRESET_BY_ID = new Map<BankingRegionId, BankingRegionPreset>(
  BANKING_REGION_PRESETS.map((preset) => [preset.id, preset])
);

const CURRENCY_TO_REGION: Record<string, BankingRegionId> = {
  NGN: 'ng_africa',
  GHS: 'ng_africa',
  KES: 'ng_africa',
  ZAR: 'ng_africa',
  GBP: 'uk',
  EUR: 'eu_sepa',
  CAD: 'ca',
  AUD: 'au',
  INR: 'in',
};

export function inferDefaultBankingRegion(currency?: string | null): BankingRegionId {
  const code = (currency || '').trim().toUpperCase();
  return CURRENCY_TO_REGION[code] || 'global';
}

export function getBankingPreset(
  regionId?: string | null,
  currency?: string | null
): BankingRegionPreset {
  if (regionId && PRESET_BY_ID.has(regionId as BankingRegionId)) {
    return PRESET_BY_ID.get(regionId as BankingRegionId)!;
  }
  const inferred = inferDefaultBankingRegion(currency);
  return PRESET_BY_ID.get(inferred) || BANKING_REGION_PRESETS[0];
}

export function getWireDisplayLabels(
  wire?: { bankRegion?: string | null } | null,
  currency?: string | null
): { routingShortLabel: string; accountShortLabel: string } {
  const preset = wire?.bankRegion
    ? PRESET_BY_ID.get(wire.bankRegion as BankingRegionId) || BANKING_REGION_PRESETS[0]
    : getBankingPreset(undefined, currency);
  return {
    routingShortLabel: preset.routingShortLabel,
    accountShortLabel: preset.accountShortLabel,
  };
}

