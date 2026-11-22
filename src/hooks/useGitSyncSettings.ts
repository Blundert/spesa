import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getAutoSync,
  forgetGitToken,
  getGitConfig,
  isGitConfigured,
  setAutoSync,
  setGitConfig,
  syncPull,
  type GitConfig,
} from '../lib/gitSync'
import { runSync, toastWithBackup } from '../lib/syncRunner'

/** Stato e azioni della configurazione di sync, condivisi dalla pagina Sincronizzazione mobile e desktop. */
export function useGitSyncSettings() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [git, setGit] = useState<GitConfig>(() => getGitConfig())
  const [auto, setAuto] = useState<boolean>(() => getAutoSync())
  const [syncing, setSyncing] = useState(false)
  const [showPull, setShowPull] = useState(false)

  const setGitField = (field: keyof GitConfig, value: string) => {
    setGit((g) => ({ ...g, [field]: value }))
  }

  const save = () => {
    setGitConfig(git)
    toast(t('settings.syncSaved'))
    void qc.invalidateQueries({ queryKey: ['sync-history'] })
  }

  /** Toglie il token da questo dispositivo (repo e file restano): per un token da revocare o un dispositivo da pulire. */
  const forgetToken = () => {
    forgetGitToken()
    setGit(getGitConfig())
    toast(t('settings.syncTokenForgotten'))
    void qc.invalidateQueries({ queryKey: ['sync-history'] })
  }

  const toggleAuto = () => {
    const next = !auto
    setAuto(next)
    setAutoSync(next)
  }

  const syncNow = async () => {
    if (!isGitConfigured(git)) {
      toast.error(t('settings.syncNotConfigured'))
      return
    }
    setGitConfig(git)
    setSyncing(true)
    try {
      // Sync bidirezionale: push se siamo avanti, pull se indietro, toast se in conflitto.
      await runSync(qc, { announce: true })
      await qc.invalidateQueries({ queryKey: ['sync-history'] })
    } finally {
      setSyncing(false)
    }
  }

  const pull = async () => {
    setShowPull(false)
    setGitConfig(git)
    setSyncing(true)
    try {
      const res = await syncPull()
      await qc.invalidateQueries()
      toastWithBackup(t('settings.syncPulled'), res)
    } catch (e) {
      toast.error(`${t('settings.syncError')}: ${e instanceof Error ? e.message : ''}`)
    } finally {
      setSyncing(false)
    }
  }

  /** Rilegge la configurazione salvata (dopo un cambio di branch fatto altrove). */
  const refresh = () => setGit(getGitConfig())

  return { git, refresh, setGitField, auto, toggleAuto, syncing, showPull, setShowPull, save, forgetToken, syncNow, pull }
}
