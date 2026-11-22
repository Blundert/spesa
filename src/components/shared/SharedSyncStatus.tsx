import { useTranslation } from 'react-i18next'
import { liveSync } from '../../lib/sharedLive'
import type { SyncOutcome } from '../../lib/sharedSyncScheduler'
import { syncOutcomeText } from './sharedErrors'

/** Riga di stato di una lista condivisa; toccandola si sincronizza subito. Rossa se l'ultima sync è fallita (offline escluso). */
export function SharedSyncStatus({ listId, outcome }: { listId: number; outcome: SyncOutcome | undefined }) {
  const { t, i18n } = useTranslation()
  const failed = outcome !== undefined && !outcome.ok && outcome.code !== 'network'
  return (
    <button
      onClick={() => void liveSync.syncNow(listId)}
      data-testid="shared-sync-status"
      className={`block text-left text-[12px] px-1.5 mb-3 active:opacity-50 ${failed ? 'text-t-danger' : 'text-t-muted'}`}
    >
      {syncOutcomeText(t, outcome, i18n.language)}
    </button>
  )
}
