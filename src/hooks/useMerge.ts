import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { exportData } from '../db/backup'
import { diffBackups } from '../lib/backupDiff'
import { applyMerge, planMerge, type Choice } from '../lib/backupMerge'
import { loadRemoteBackup, restoreFromBackup } from '../lib/gitSync'
import { toastWithBackup } from '../lib/syncRunner'

export type QuickMode = 'union' | 'local' | 'remote'

/** Stato della schermata di unione: confronto locale/remoto, scelte per gruppo, risultato e applicazione. */
export function useMerge(onDone: () => void, from?: string) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const data = useQuery({
    queryKey: ['merge-data', from ?? null],
    queryFn: async () => {
      const [local, remote] = await Promise.all([exportData(), loadRemoteBackup(from)])
      return { local, remote, plan: planMerge(local, remote) }
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  })
  const [overrides, setOverrides] = useState<Record<string, Choice>>({})
  const plan = data.data?.plan

  const choices = useMemo(
    () => Object.fromEntries((plan ?? []).map((g) => [g.id, overrides[g.id] ?? g.defaultChoice])),
    [plan, overrides],
  )

  const result = useMemo(() => {
    if (!data.data) return null
    try {
      const merged = applyMerge(data.data.local, data.data.remote, choices)
      return {
        merged,
        error: null,
        diffLocal: diffBackups(data.data.local, merged),
        diffRemote: diffBackups(data.data.remote, merged),
      }
    } catch (e) {
      return { merged: null, error: e instanceof Error ? e.message : '', diffLocal: null, diffRemote: null }
    }
  }, [data.data, choices])

  const setChoice = (id: string, choice: Choice) => setOverrides((o) => ({ ...o, [id]: choice }))
  const setAll = (mode: QuickMode) =>
    setOverrides(mode === 'union' ? {} : Object.fromEntries((plan ?? []).map((g) => [g.id, mode])))

  const apply = useMutation({
    mutationFn: () => {
      if (!result?.merged) throw new Error(result?.error ?? '')
      return restoreFromBackup(result.merged, 'repo', 'Merge')
    },
    onSuccess: async (res) => {
      await qc.invalidateQueries()
      toastWithBackup(t('syncMerge.applied'), res)
      onDone()
    },
    onError: (e: unknown) => {
      toast.error(`${t('settings.syncError')}: ${e instanceof Error ? e.message : ''}`)
    },
  })

  return { data, plan: plan ?? [], choices, result, setChoice, setAll, apply }
}
