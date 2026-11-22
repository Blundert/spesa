import type { Session, SharedLink } from '../db/types'

/** Le spese di altre persone che non contano nel mio budget, nei miei buoni e nelle mie statistiche (estranei). */
export function countedSessions<T extends Pick<Session, 'uncounted'>>(sessions: T[]): T[] {
  return sessions.filter((s) => !s.uncounted)
}

/** La spesa è di un'altra persona (importata dal repo condiviso)? */
export function isForeignSession(s: Pick<Session, 'doneBy'>): boolean {
  return s.doneBy !== undefined
}

/**
 * Una spesa di `login` conta per me? Le mie sì; quelle di un partner (buoni in comune) sì; quelle di un estraneo
 * (o di una persona che non conosco ancora) no.
 */
export function countsForMe(link: SharedLink, login: string): boolean {
  return login === link.me || link.members[login]?.kind === 'partner'
}

/**
 * Settimana (come chiave "YYYY-MM-DD") in cui cade una spesa, con l'inizio settimana scelto su questo dispositivo.
 * Stessa logica di `toWeekKey` in `date.ts`, copiata per non portarsi dietro i18n nei test in Node.
 */
export function sessionWeek(ts: number, weekStartDay: number): string {
  const date = new Date(ts)
  const offset = ((date.getUTCDay() + 6) % 7 - weekStartDay + 7) % 7
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  start.setUTCDate(start.getUTCDate() - offset)
  const m = String(start.getUTCMonth() + 1).padStart(2, '0')
  const d = String(start.getUTCDate()).padStart(2, '0')
  return `${start.getUTCFullYear()}-${m}-${d}`
}
