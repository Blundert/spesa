import { toast } from 'sonner'
import i18n from 'i18next'
import type { QueryClient } from '@tanstack/react-query'
import { autoSync, syncPull, syncPushForce } from './gitSync'

let inFlight = false

/** Mostra un toast persistente per risolvere un conflitto: tieni locale ↔ scarica remoto. */
function showConflictToast(qc: QueryClient): void {
  const t = i18n.t.bind(i18n)
  toast.warning(t('settings.syncConflict'), {
    id: 'sync-conflict', // evita duplicati
    duration: Infinity,
    action: {
      label: t('settings.syncConflictPull'),
      onClick: () => {
        void syncPull()
          .then(() => qc.invalidateQueries())
          .then(() => toast(t('settings.syncPulled')))
          .catch((e: unknown) =>
            toast.error(`${t('settings.syncError')}: ${e instanceof Error ? e.message : ''}`),
          )
      },
    },
    cancel: {
      label: t('settings.syncConflictKeepLocal'),
      onClick: () => {
        void syncPushForce()
          .then(() => toast(t('settings.syncDone')))
          .catch((e: unknown) =>
            toast.error(`${t('settings.syncError')}: ${e instanceof Error ? e.message : ''}`),
          )
      },
    },
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
        showConflictToast(qc)
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
