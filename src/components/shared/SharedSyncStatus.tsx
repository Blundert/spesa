import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useUnlinkList } from '../../hooks/useSharedLists'
import { liveSync } from '../../lib/sharedLive'
import type { SyncOutcome } from '../../lib/sharedSyncScheduler'
import { syncOutcomeText } from './sharedErrors'

/**
 * Riga di stato di una lista condivisa; toccandola si sincronizza subito. Rossa se l'ultima sync è fallita (offline
 * escluso). Se l'accesso al repo è stato tolto propone di tenere la lista, com'è, come lista normale.
 */
export function SharedSyncStatus({ listId, outcome }: { listId: number; outcome: SyncOutcome | undefined }) {
  const { t, i18n } = useTranslation()
  const unlink = useUnlinkList()
  const failed = outcome !== undefined && !outcome.ok && outcome.code !== 'network'
  const lostAccess = outcome !== undefined && !outcome.ok && outcome.code === 'no-access'
  return (
    <div className="px-1.5 mb-3">
      <button
        onClick={() => void liveSync.syncNow(listId)}
        data-testid="shared-sync-status"
        className={`block text-left text-[12px] active:opacity-50 ${failed ? 'text-t-danger' : 'text-t-muted'}`}
      >
        {syncOutcomeText(t, outcome, i18n.language)}
      </button>
      {lostAccess && (
        <button
          onClick={() => unlink.mutate(listId, { onSuccess: () => toast(t('shared.unlinked')) })}
          className="mt-1.5 px-3 py-[7px] rounded-[10px] text-[13px] bg-t-surface2 text-t-fg active:opacity-60"
        >
          {t('shared.keepAsNormal')}
        </button>
      )}
    </div>
  )
}
