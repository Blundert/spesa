import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { connectGithub, looksLikeToken, type RepoInfo } from '../lib/githubAccount'
import { runSync, toastWithBackup } from '../lib/syncRunner'

/** Stato del collegamento a GitHub: verifica del token, chi è e a quali repo ha accesso. */
export interface GithubConnection {
  status: 'idle' | 'checking' | 'ok' | 'error'
  login: string
  repos: RepoInfo[]
  /** Solo con status 'error': token non valido (401) oppure GitHub irraggiungibile. */
  error: 'invalid' | 'failed' | null
}

const IDLE: GithubConnection = { status: 'idle', login: '', repos: [], error: null }

/** Stato e azioni della configurazione di sync, condivisi dalla pagina Sincronizzazione mobile e desktop. */
export function useGitSyncSettings() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [git, setGit] = useState<GitConfig>(() => getGitConfig())
  const [auto, setAuto] = useState<boolean>(() => getAutoSync())
  const [syncing, setSyncing] = useState(false)
  const [showPull, setShowPull] = useState(false)
  // Il token controllato con GitHub: quello salvato all'apertura, poi quello incollato o salvato (non ogni
  // tasto premuto nel campo, che manderebbe una richiesta per lettera).
  const [checkedToken, setCheckedToken] = useState(() => getGitConfig().token)
  const [pasting, setPasting] = useState(false)
  const account = useQuery({
    queryKey: ['github-connection', checkedToken],
    queryFn: async () => {
      const result = await connectGithub(checkedToken)
      // Token inserito a mano in passato: ora che sappiamo chi è, ricordiamo il login.
      const saved = getGitConfig()
      if (saved.token === checkedToken && saved.login !== result.login) setGitConfig({ ...saved, login: result.login })
      return result
    },
    enabled: checkedToken !== '',
    retry: false,
    staleTime: 60_000,
  })
  let conn: GithubConnection = IDLE
  if (pasting || (checkedToken !== '' && account.isPending)) conn = { ...IDLE, status: 'checking' }
  else if (checkedToken !== '' && account.isError) {
    conn = { ...IDLE, status: 'error', error: account.error.message === 'GitHub 401' ? 'invalid' : 'failed' }
  } else if (checkedToken !== '' && account.data) {
    conn = { status: 'ok', login: account.data.login, repos: account.data.repos, error: null }
  }

  /** Legge il token dagli appunti e lo collega. */
  const pasteToken = async () => {
    let text: string
    try {
      text = await navigator.clipboard.readText()
    } catch {
      toast.error(t('githubConnect.clipboardDenied'))
      return
    }
    if (!looksLikeToken(text)) {
      toast.error(t('githubConnect.noTokenInClipboard'))
      return
    }
    const token = text.trim()
    setPasting(true)
    try {
      const { login } = await qc.fetchQuery({
        queryKey: ['github-connection', token],
        queryFn: () => connectGithub(token),
        staleTime: 60_000,
      })
      const next = { ...git, token, login }
      setGit(next)
      setGitConfig(next)
      setCheckedToken(token)
      toast(t('settings.syncSaved'))
    } catch (e) {
      toast.error(t(e instanceof Error && e.message === 'GitHub 401' ? 'githubConnect.invalid' : 'githubConnect.failed'))
    } finally {
      setPasting(false)
    }
  }

  /** Sceglie il repo dei backup dall'elenco e lo salva subito. */
  const pickRepo = (owner: string, repo: string) => {
    const next = { ...git, owner, repo }
    setGit(next)
    setGitConfig(next)
    toast(t('githubConnect.repoSaved'))
    void qc.invalidateQueries({ queryKey: ['sync-history'] })
  }

  const setGitField = (field: keyof GitConfig, value: string) => {
    setGit((g) => ({ ...g, [field]: value }))
  }

  const save = () => {
    setGitConfig(git)
    setCheckedToken(git.token)
    toast(t('settings.syncSaved'))
    void qc.invalidateQueries({ queryKey: ['sync-history'] })
  }

  /** Toglie il token da questo dispositivo (repo e file restano): per un token da revocare o un dispositivo da pulire. */
  const forgetToken = () => {
    forgetGitToken()
    setGit(getGitConfig())
    setCheckedToken('')
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

  return { git, conn, pasteToken, pickRepo, refresh, setGitField, auto, toggleAuto, syncing, showPull, setShowPull, save, forgetToken, syncNow, pull }
}
