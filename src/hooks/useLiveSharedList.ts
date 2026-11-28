import { useEffect, useSyncExternalStore } from 'react'
import { liveSync } from '../lib/sharedLive'
import { getSyncStatus, subscribeSyncStatus } from '../lib/sharedSyncStatus'

/**
 * Segnala che questa lista condivisa è quella aperta: sync subito, poi i controlli (ogni 15 secondi, ogni 5 in una
 * spesa: `fast`). Visibilità, ritorno della rete e controlli delle altre liste sono dell'app intera (`sharedLive`).
 * Ritorna l'esito dell'ultima sync. Per una lista non condivisa (o senza lista) non fa niente.
 */
export function useLiveSharedList(listId: number | undefined, shared: boolean, fast = false) {
  useEffect(() => {
    if (listId === undefined || !shared) return
    liveSync.start(listId, { fast })
    return () => liveSync.stop()
  }, [listId, shared, fast])

  return useSyncExternalStore(subscribeSyncStatus, () => (listId === undefined || !shared ? undefined : getSyncStatus(listId)))
}
