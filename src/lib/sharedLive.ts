import { db } from '../db/db'
import { qk } from '../db/queryKeys'
import { queryClient } from './queryClient'
import { onSharedChange } from './sharedChange'
import { syncSharedList } from './sharedSync'
import { createSharedSyncScheduler } from './sharedSyncScheduler'
import { setSyncStatus } from './sharedSyncStatus'

/**
 * La sync dal vivo delle liste condivise di questa app: una sola istanza dello scheduler, collegata al database
 * (cosa sincronizzare), alla cache delle query (cosa ricaricare) e allo stato mostrato a schermo.
 */
export const liveSync = createSharedSyncScheduler({
  sync: (listId) => syncSharedList(listId),
  isShared: async (listId) => (await db.shoppingLists.get(listId))?.shared !== undefined,
  sharedListIds: async () => (await db.shoppingLists.toArray()).filter((l) => l.shared !== undefined).map((l) => l.id as number),
  onOutcome: (listId, outcome) => {
    setSyncStatus(listId, outcome)
    // Novità degli altri, o permesso cambiato (sola lettura): si ricaricano liste e voci.
    const readOnlyNow = outcome.ok ? !outcome.result.canWrite : outcome.code === 'read-only'
    if (outcome.ok && outcome.result.changed) {
      // Possono essere arrivate anche spese degli altri: storico, budget e statistiche si ricaricano.
      void queryClient.invalidateQueries()
    } else if (readOnlyNow) {
      void queryClient.invalidateQueries({ queryKey: qk.shoppingLists() })
      void queryClient.invalidateQueries({ queryKey: qk.listItems() })
    }
  },
})

// Ogni modifica a una lista condivisa su questo dispositivo parte 5 secondi dopo l'ultima.
onSharedChange((listId) => liveSync.notifyChange(listId))

// Visibilità, rete e avvio sono dell'app intera, non di una schermata: anche a lista chiusa (o su un'altra pagina) le
// modifiche in sospeso partono, le novità degli altri arrivano e andando in background parte quello che è in attesa.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => liveSync.setVisible(document.visibilityState === 'visible'))
  window.addEventListener('online', () => void liveSync.syncAll())
  if (document.visibilityState !== 'visible') liveSync.setVisible(false)
  liveSync.begin()
}
