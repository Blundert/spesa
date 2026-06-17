import i18n from '../i18n'

/**
 * Returns the ISO 8601 week number for a given date.
 * Week 1 is the week containing the first Thursday of the year.
 */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Set to nearest Thursday: current date + 4 - current day number, make Sunday's day 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/**
 * Returns the ISO week string "YYYY-WNN" for a given date.
 * E.g. "2026-W24"
 */
export function toISOWeekString(date: Date): string {
  // The ISO week year may differ from the calendar year near year boundaries
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const year = d.getUTCFullYear()
  const week = getISOWeek(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

/**
 * Returns the ISO week string for today.
 */
export function currentISOWeek(): string {
  return toISOWeekString(new Date())
}

/**
 * Returns Monday and Sunday (inclusive) of the ISO week identified by "YYYY-WNN".
 */
export function weekRange(isoWeek: string): { monday: Date; sunday: Date } {
  const [yearStr, weekStr] = isoWeek.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekStr, 10)

  // Jan 4 is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7 // Mon=1 … Sun=7
  const monday = new Date(jan4)
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  return { monday, sunday }
}

/**
 * Sposta una settimana ISO di `delta` settimane (negativo = indietro).
 * Calcolo interamente in UTC per evitare scivolamenti di fuso, gestisce i confini d'anno.
 */
export function shiftISOWeek(isoWeek: string, delta: number): string {
  const { monday } = weekRange(isoWeek)
  const d = new Date(monday)
  d.setUTCDate(d.getUTCDate() + delta * 7)
  // Ricalcola la settimana ISO (giovedì della settimana = anno ISO di riferimento).
  const thursday = new Date(d)
  thursday.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const year = thursday.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

const DAY_NAMES_SHORT = {
  it: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
} as const
const DAY_NAMES_FULL = {
  it: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
} as const
const MONTH_NAMES = {
  it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
} as const

/** Lingua attiva per la formattazione date (segue i18n). */
function lang(): 'it' | 'en' {
  return i18n.language?.startsWith('en') ? 'en' : 'it'
}

/** Returns "Lun", "Mar" … for ISO day index 0=Mon … 6=Sun (lingua attiva) */
export function dayShort(dayIndex: number): string {
  return DAY_NAMES_SHORT[lang()][dayIndex] ?? ''
}

/** Returns "Lunedì", "Martedì" … for ISO day index 0=Mon … 6=Sun (lingua attiva) */
export function dayFull(dayIndex: number): string {
  return DAY_NAMES_FULL[lang()][dayIndex] ?? ''
}

/**
 * Formats a Date as "9 – 15 giu" style range label.
 */
export function formatWeekLabel(isoWeek: string): string {
  const { monday, sunday } = weekRange(isoWeek)
  const d1 = monday.getUTCDate()
  const d2 = sunday.getUTCDate()
  const month = MONTH_NAMES[lang()][sunday.getUTCMonth()]
  return `${d1} – ${d2} ${month}`
}

/**
 * Formats a timestamp (ms) as "7 giu" (day + short month).
 */
export function formatShortDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} ${MONTH_NAMES[lang()][d.getMonth()]}`
}

/**
 * Formats a timestamp (ms) as "lun 9 giu 2026".
 */
export function formatLongDate(ts: number): string {
  const d = new Date(ts)
  const dayIdx = (d.getDay() + 6) % 7 // convert Sun=0 to Mon=0
  return `${DAY_NAMES_SHORT[lang()][dayIdx].toLowerCase()} ${d.getDate()} ${MONTH_NAMES[lang()][d.getMonth()]} ${d.getFullYear()}`
}
