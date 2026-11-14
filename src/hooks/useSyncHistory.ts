import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { exportData, isBackupData, type BackupData } from '../db/backup'
import { getSafetySnapshots } from '../db/repositories/safetySnapshots'
import { diffBackups } from '../lib/backupDiff'
import {
  getGitConfig,
  isGitConfigured,
  listRemoteHistory,
  loadHistoryBackup,
  restoreFromBackup,
} from '../lib/gitSync'
import { selectionKey, type HistorySelection } from '../lib/historyItems'
import { toastWithBackup } from '../lib/syncRunner'

export function useRemoteHistory() {
  const configured = isGitConfigured(getGitConfig())
  return useQuery({
    queryKey: ['sync-history', configured],
    queryFn: listRemoteHistory,
    enabled: configured,
    staleTime: 30_000,
    retry: false,
  })
}

export function useSafetySnapshots() {
  return useQuery({ queryKey: ['safety-snapshots'], queryFn: getSafetySnapshots })
}

async function loadSelection(sel: HistorySelection): Promise<BackupData> {
  if (sel.source === 'remote') return loadHistoryBackup(sel.entry)
  const parsed: unknown = JSON.parse(sel.snapshot.json)
  if (!isBackupData(parsed)) throw new Error('Backup non valido')
  return parsed
}

/** Scarica la versione scelta e la confronta con i dati di adesso (cosa tornerebbe, sparirebbe, cambierebbe). */
export function useHistoryPreview(sel: HistorySelection | null) {
  return useQuery({
    queryKey: ['sync-preview', sel ? selectionKey(sel) : null],
    enabled: sel !== null,
    retry: false,
    queryFn: async () => {
      const data = await loadSelection(sel as HistorySelection)
      return { data, diff: diffBackups(await exportData(), data) }
    },
  })
}

/** Ripristina una versione: via repo (nuovo commit, backup bloccante) o solo locale per le copie di sicurezza. */
export function useRestore(onDone: () => void) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data, via }: { data: BackupData; via: 'repo' | 'local' }) => restoreFromBackup(data, via),
    onSuccess: async (res) => {
      await qc.invalidateQueries()
      toastWithBackup(t('syncPage.restored'), res)
      onDone()
    },
    onError: (e: unknown) => {
      toast.error(`${t('settings.syncError')}: ${e instanceof Error ? e.message : ''}`)
    },
  })
}
