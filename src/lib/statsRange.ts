export type StatsRange = '7d' | '30d' | '3m' | '6m' | 'all' | 'custom'

export const DEFAULT_STATS_RANGE: StatsRange = '30d'

const RANGE_KEY = 'statsRange'
const CUSTOM_DAYS_KEY = 'statsRangeCustomDays'

const RANGE_DAYS: Record<Exclude<StatsRange, 'all' | 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '3m': 90,
  '6m': 180,
}

export function getStatsRange(): StatsRange {
  const v = localStorage.getItem(RANGE_KEY)
  if (v && ['7d', '30d', '3m', '6m', 'all', 'custom'].includes(v)) return v as StatsRange
  return DEFAULT_STATS_RANGE
}

export function setStatsRange(r: StatsRange): void {
  localStorage.setItem(RANGE_KEY, r)
}

export function getCustomDays(): number {
  const v = localStorage.getItem(CUSTOM_DAYS_KEY)
  const n = v ? parseInt(v, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : 30
}

export function setCustomDays(n: number): void {
  localStorage.setItem(CUSTOM_DAYS_KEY, String(n))
}

export function rangeToFromTs(range: StatsRange, customDays: number): number | null {
  if (range === 'all') return null
  const days = range === 'custom' ? customDays : RANGE_DAYS[range]
  return Date.now() - days * 24 * 60 * 60 * 1000
}
