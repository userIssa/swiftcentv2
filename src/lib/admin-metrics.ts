export const ADMIN_MONITOR_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export interface DailyActivityPoint {
  date: string;
  label: string;
  count: number;
}

const UTC_MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatUtcIsoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatUtcShortLabel(date: Date): string {
  return `${UTC_MONTH_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/**
 * Aggregates timestamped records into a contiguous trailing UTC daily series,
 * filling zero-count days so trend charts have uniform spacing.
 */
export function buildDailySeries(
  entries: Array<{ createdAt?: Date | string | null }>,
  days = 14,
  now: Date = new Date()
): DailyActivityPoint[] {
  const safeDays = Math.max(1, Math.min(90, Math.floor(days)));
  const countsByIso = new Map<string, number>();

  for (const entry of entries) {
    if (!entry.createdAt) continue;
    const d = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const iso = formatUtcIsoDate(d);
    countsByIso.set(iso, (countsByIso.get(iso) || 0) + 1);
  }

  const anchorUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const points: DailyActivityPoint[] = [];
  for (let offset = safeDays - 1; offset >= 0; offset--) {
    const dayDate = new Date(anchorUtcMidnight.getTime() - offset * 86400000);
    const iso = formatUtcIsoDate(dayDate);
    points.push({
      date: iso,
      label: formatUtcShortLabel(dayDate),
      count: countsByIso.get(iso) || 0,
    });
  }

  return points;
}

export function computePercentageRate(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 100);
}

export function formatDurationCompact(totalSeconds: number): string {
  const secs = Math.max(0, Math.round(totalSeconds || 0));
  if (secs < 60) return `${secs}s`;
  const minutes = Math.floor(secs / 60);
  const remSeconds = secs % 60;
  if (minutes < 60) {
    return remSeconds > 0 ? `${minutes}m ${remSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
}

export function formatCompactTokens(tokens: number): string {
  const safe = Math.max(0, Math.round(tokens || 0));
  if (safe >= 1_000_000) {
    return `${(safe / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  }
  if (safe >= 1_000) {
    return `${(safe / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(safe);
}

