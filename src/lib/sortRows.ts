import { compareNames } from './normalize'

export type SortDir = 'asc' | 'desc'
export type SortValue = string | number | null | undefined

export interface SortState {
  key: string
  dir: SortDir
}

/** Confronta due valori di colonna: numeri per valore, testi in ordine alfabetico, vuoti sempre in fondo. */
export function compareSortValues(a: SortValue, b: SortValue, dir: SortDir): number {
  const aEmpty = a === null || a === undefined || a === ''
  const bEmpty = b === null || b === undefined || b === ''
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1
  const base =
    typeof a === 'number' && typeof b === 'number' ? a - b : compareNames(String(a), String(b))
  return dir === 'asc' ? base : -base
}

/** Copia ordinata (stabile) delle righe secondo `value`. */
export function sortRows<T>(rows: T[], value: (row: T) => SortValue, dir: SortDir): T[] {
  return [...rows].sort((x, y) => compareSortValues(value(x), value(y), dir))
}

/** Clic su un'intestazione: stessa colonna inverte la direzione, nuova colonna parte da `asc`. */
export function toggleSort(current: SortState, key: string): SortState {
  if (current.key !== key) return { key, dir: 'asc' }
  return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
}
