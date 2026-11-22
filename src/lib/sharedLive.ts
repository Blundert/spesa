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
  onOutcome: (listId, outcome) => {
    setSyncStatus(listId, outcome)
    // Novità degli altri, o permesso cambiato (sola lettura): si ricaricano liste e voci.
    const readOnlyNow = outcome.ok ? !outcome.result.canWrite : outcome.code === 'read-only'
    if (readOnlyNow || (outcome.ok && outcome.result.changed)) {
      void queryClient.invalidateQueries({ queryKey: qk.shoppingLists() })
      void queryClient.invalidateQueries({ queryKey: qk.listItems() })
      void queryClient.invalidateQueries({ queryKey: qk.items() })
    }
  },
})

// Ogni modifica a una lista condivisa su questo dispositivo parte 5 secondi dopo l'ultima.
onSharedChange((listId) => liveSync.notifyChange(listId))
