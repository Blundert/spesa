import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { createBranch, getGitConfig, isGitConfigured, listBranches, switchBranch } from '../lib/gitSync'
import { toastWithBackup } from '../lib/syncRunner'

export function useBranches() {
  const configured = isGitConfigured(getGitConfig())
  return useQuery({ queryKey: ['sync-branches', configured], queryFn: listBranches, enabled: configured, retry: false })
}

const errorToast = (t: (k: string) => string) => (e: unknown) =>
  toast.error(`${t('settings.syncError')}: ${e instanceof Error ? e.message : ''}`)

export function useCreateBranch(onDone: () => void) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createBranch(name),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['sync-branches'] })
      toast(t('syncBranches.created'))
      onDone()
    },
    onError: errorToast(t),
  })
}

export function useSwitchBranch(onDone: () => void) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => switchBranch(name),
    onSuccess: async (res, name) => {
      await qc.invalidateQueries()
      toastWithBackup(t('syncBranches.switched', { name }), res)
      onDone()
    },
    onError: errorToast(t),
  })
}
