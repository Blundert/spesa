import { useEffect, useSyncExternalStore } from 'react'
import { liveSync } from '../lib/sharedLive'
import { getSyncStatus, subscribeSyncStatus } from '../lib/sharedSyncStatus'

/**
 * Tiene aggiornata una lista condivisa finché la schermata è aperta e l'app è in primo piano: sync subito,
 * poi ogni 15 secondi, al ritorno in primo piano e quando torna la rete. Ritorna l'esito dell'ultima sync.
 * Per una lista non condivisa (o senza lista) non fa niente.
 */
export function useLiveSharedList(listId: number | undefined, shared: boolean) {
  useEffect(() => {
    if (listId === undefined || !shared) return
    liveSync.start(listId)
    const onVisibility = () => liveSync.setVisible(document.visibilityState === 'visible')
    const onOnline = () => void liveSync.syncNow(listId)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
      liveSync.stop()
    }
  }, [listId, shared])

  return useSyncExternalStore(subscribeSyncStatus, () => (listId === undefined || !shared ? undefined : getSyncStatus(listId)))
}
