import i18n from '../i18n'
import { getWeekStartDay } from './weekSettings'

// ---------------------------------------------------------------------------
// ISO week utilities — usate solo nella migrazione DB v6
// ---------------------------------------------------------------------------

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function toISOWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const year = d.getUTCFullYear()
  const week = getISOWeek(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Week key: "YYYY-MM-DD" (data del primo giorno della settimana)
// Convenzione day index: 0=Lun, 1=Mar, 2=Mer, 3=Gio, 4=Ven, 5=Sab, 6=Dom
// ---------------------------------------------------------------------------

function dateToKey(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Restituisce la chiave "YYYY-MM-DD" della settimana che contiene `date`,
 * con inizio settimana al giorno `startDay` (0=Lun … 6=Dom).
 */
export function toWeekKey(date: Date, startDay: number): string {
  // Convertiamo il giorno JS (0=Dom) nella nostra convenzione (0=Lun)
  const ourDay = (date.getUTCDay() + 6) % 7
  const offset = (ourDay - startDay + 7) % 7
  const weekStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  weekStart.setUTCDate(weekStart.getUTCDate() - offset)
  return dateToKey(weekStart)
}

/** Chiave della settimana corrente (rispetta il giorno di inizio configurato). */
export function currentWeek(): string {
  return toWeekKey(new Date(), getWeekStartDay())
}

/** Restituisce start e end (incluso) della settimana identificata da `weekKey`. */
export function weekRange(weekKey: string): { start: Date; end: Date } {
  const [y, m, d] = weekKey.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, d))
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  return { start, end }
}

/**
 * Sposta `weekKey` di `delta` settimane (negativo = indietro).
 */
export function shiftWeek(weekKey: string, delta: number): string {
  const [y, m, d] = weekKey.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + delta * 7)
  return dateToKey(date)
}

// ---------------------------------------------------------------------------
// Nomi giorni / mesi
// ---------------------------------------------------------------------------

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

function lang(): 'it' | 'en' {
  return i18n.language?.startsWith('en') ? 'en' : 'it'
}

/** Returns "Lun", "Mar" … for day index 0=Lun … 6=Dom (lingua attiva) */
export function dayShort(dayIndex: number): string {
  return DAY_NAMES_SHORT[lang()][dayIndex] ?? ''
}

/** Returns "Lunedì", "Martedì" … for day index 0=Lun … 6=Dom (lingua attiva) */
export function dayFull(dayIndex: number): string {
  return DAY_NAMES_FULL[lang()][dayIndex] ?? ''
}

/**
 * Formats a week key as "9 – 15 giu" or "29 giu – 5 lug" (cross-month).
 */
export function formatWeekLabel(weekKey: string): string {
  const { start, end } = weekRange(weekKey)
  const d1 = start.getUTCDate()
  const d2 = end.getUTCDate()
  const endMonth = MONTH_NAMES[lang()][end.getUTCMonth()]
  if (start.getUTCMonth() !== end.getUTCMonth()) {
    const startMonth = MONTH_NAMES[lang()][start.getUTCMonth()]
    return `${d1} ${startMonth} – ${d2} ${endMonth}`
  }
  return `${d1} – ${d2} ${endMonth}`
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
