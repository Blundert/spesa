import type { SyncOutcome } from './sharedSyncScheduler'

/** Esito dell'ultima sync di ogni lista condivisa, osservabile dall'interfaccia (useSyncExternalStore). */
const statuses = new Map<number, SyncOutcome>()
const listeners = new Set<() => void>()

export function setSyncStatus(listId: number, outcome: SyncOutcome): void {
  statuses.set(listId, outcome)
  for (const l of listeners) l()
}

/** Ultimo esito noto (lo stesso oggetto finché non cambia), `undefined` se non c'è ancora stata una sync. */
export function getSyncStatus(listId: number): SyncOutcome | undefined {
  return statuses.get(listId)
}

export function subscribeSyncStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Solo per i test. */
export function resetSyncStatus(): void {
  statuses.clear()
}
