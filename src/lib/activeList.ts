import type { ShoppingList } from '../db/types'

// Preferenze per dispositivo: ultima lista aperta e ultima lista usata per i pasti.
export const ACTIVE_LIST_KEY = 'active-list-id'
export const MEALS_LIST_KEY = 'meals-list-id'

function readId(key: string): number | null {
  try {
    const n = parseInt(localStorage.getItem(key) ?? '', 10)
    return isNaN(n) ? null : n
  } catch {
    return null
  }
}

function writeId(key: string, id: number): void {
  try {
    localStorage.setItem(key, String(id))
  } catch {
    // storage non disponibile: la preferenza semplicemente non viene ricordata
  }
}

const listeners = new Set<() => void>()

export const getActiveListId = () => readId(ACTIVE_LIST_KEY)
export function setActiveListId(id: number): void {
  writeId(ACTIVE_LIST_KEY, id)
  listeners.forEach((l) => l())
}
/** Notifica i cambi di lista aperta (per `useSyncExternalStore`). */
export function onActiveListChange(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export const getMealsListId = () => readId(MEALS_LIST_KEY)
export const setMealsListId = (id: number) => writeId(MEALS_LIST_KEY, id)

/** Liste attive (non archiviate), nell'ordine dato. */
export function activeLists(lists: ShoppingList[]): ShoppingList[] {
  return lists.filter((l) => l.archivedAt === null)
}

/** La lista preferita se è ancora attiva, altrimenti la prima attiva. */
export function pickList(lists: ShoppingList[], preferredId: number | null): ShoppingList | undefined {
  const active = activeLists(lists)
  return active.find((l) => l.id === preferredId) ?? active[0]
}
