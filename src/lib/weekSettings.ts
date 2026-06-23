export const WEEK_START_KEY = 'week-start-day'

/**
 * Giorno di inizio settimana: 0=Lun, 1=Mar, 2=Mer, 3=Gio, 4=Ven, 5=Sab, 6=Dom.
 * Stessa convenzione di dayIndex in MealPlan e dei DAY_NAMES_* in date.ts.
 */
export function getWeekStartDay(): number {
  const raw = localStorage.getItem(WEEK_START_KEY)
  const parsed = raw !== null ? parseInt(raw, 10) : NaN
  return isNaN(parsed) || parsed < 0 || parsed > 6 ? 0 : parsed
}

export function setWeekStartDay(day: number): void {
  localStorage.setItem(WEEK_START_KEY, String(day))
}
