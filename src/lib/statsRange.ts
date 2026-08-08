export type StatsRange = '7d' | '30d' | '3m' | '6m' | 'all' | 'custom'

export const DEFAULT_STATS_RANGE: StatsRange = '30d'

const RANGE_KEY = 'statsRange'
const CUSTOM_FROM_KEY = 'statsRangeCustomFrom'
const CUSTOM_TO_KEY = 'statsRangeCustomTo'

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

function dateToInputString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Data odierna in formato "YYYY-MM-DD" (fuso orario locale), per i vincoli min/max degli input date. */
export function todayDateString(): string {
  return dateToInputString(new Date())
}

export interface CustomDateRange {
  /** "YYYY-MM-DD" */
  from: string
  /** "YYYY-MM-DD" */
  to: string
}

export function getCustomDateRange(): CustomDateRange {
  const from = localStorage.getItem(CUSTOM_FROM_KEY)
  const to = localStorage.getItem(CUSTOM_TO_KEY)
  const today = todayDateString()
  return { from: from ?? today, to: to ?? today }
}

export function setCustomDateRange(range: CustomDateRange): void {
  localStorage.setItem(CUSTOM_FROM_KEY, range.from)
  localStorage.setItem(CUSTOM_TO_KEY, range.to)
}

/** Scorciatoia "mese corrente": dal primo giorno del mese a oggi. */
export function currentMonthDateRange(): CustomDateRange {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: dateToInputString(first), to: dateToInputString(now) }
}

export function rangeToTimestamps(
  range: StatsRange,
  custom: CustomDateRange,
): { fromTs: number | null; toTs: number | null } {
  if (range === 'all') return { fromTs: null, toTs: null }
  if (range === 'custom') {
    return {
      fromTs: new Date(`${custom.from}T00:00:00`).getTime(),
      toTs: new Date(`${custom.to}T23:59:59.999`).getTime(),
    }
  }
  const days = RANGE_DAYS[range]
  return { fromTs: Date.now() - days * 24 * 60 * 60 * 1000, toTs: null }
}
