import { toast } from 'sonner'
import i18n from 'i18next'
import type { QueryClient } from '@tanstack/react-query'
import { autoSync, type SyncResult } from './gitSync'
import { openMerge } from './mergeNav'

let inFlight = false

/** Toast di esito; se è stato salvato un backup del lato scartato ne indica il file. */
export function toastWithBackup(message: string, res: SyncResult): void {
  const t = i18n.t.bind(i18n)
  if (res.backupPath) toast(message, { description: t('settings.syncBackupSaved', { path: res.backupPath }) })
  else toast(message)
}

/** Toast persistente per il conflitto: porta alla schermata di unione, dove si sceglie cosa tenere. */
function showConflictToast(): void {
  const t = i18n.t.bind(i18n)
  toast.warning(t('settings.syncConflict'), {
    id: 'sync-conflict', // evita duplicati
    duration: Infinity,
    action: { label: t('syncMerge.review'), onClick: openMerge },
  })
}

/**
 * Esegue un sync bidirezionale e ne gestisce l'esito (toast, conflitto, refresh query).
 * `announce` mostra anche gli esiti silenziosi (per il pulsante manuale "Sincronizza ora").
 */
export async function runSync(qc: QueryClient, opts?: { announce?: boolean }): Promise<void> {
  if (inFlight) return
  inFlight = true
  const t = i18n.t.bind(i18n)
  const announce = opts?.announce ?? false
  try {
    const res = await autoSync()
    switch (res.status) {
      case 'pulled':
        await qc.invalidateQueries()
        toast(t('settings.syncPulled'))
        break
      case 'pushed':
        if (announce) toast(t('settings.syncDone'))
        break
      case 'conflict':
        showConflictToast()
        break
      case 'noop':
        if (announce) toast(t('settings.syncUpToDate'))
        break
      case 'notConfigured':
        if (announce) toast.error(t('settings.syncNotConfigured'))
        break
    }
  } catch (e) {
    if (announce) toast.error(`${t('settings.syncError')}: ${e instanceof Error ? e.message : ''}`)
  } finally {
    inFlight = false
  }
}
