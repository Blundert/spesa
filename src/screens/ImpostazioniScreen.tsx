import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PWAInstallElement } from '@khmyznikov/pwa-install'
import { LANG_KEY, type Lang } from '../i18n'
import { wipeAllData } from '../db/db'
import { exportData, importData, isBackupData, type BackupData } from '../db/backup'
import {
  getGitConfig,
  setGitConfig,
  getAutoSync,
  setAutoSync,
  isGitConfigured,
  syncPushForce,
  syncPull,
  type GitConfig,
} from '../lib/gitSync'
import { BottomSheet } from '../components/BottomSheet'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
]

export function ImpostazioniScreen() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const [showWipe, setShowWipe] = useState(false)
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [git, setGit] = useState<GitConfig>(() => getGitConfig())
  const [auto, setAuto] = useState<boolean>(() => getAutoSync())
  const [syncing, setSyncing] = useState(false)
  const [showPull, setShowPull] = useState(false)
  const current: Lang = i18n.language.startsWith('en') ? 'en' : 'it'

  const setLang = (lng: Lang) => {
    void i18n.changeLanguage(lng)
    localStorage.setItem(LANG_KEY, lng)
  }

  const handleWipe = async () => {
    await wipeAllData()
    // invalidateQueries (non clear): forza il refetch delle query ATTIVE, così la
    // bottom bar in AppShell si aggiorna sul posto senza dover navigare.
    await qc.invalidateQueries()
    setShowWipe(false)
    toast(t('settings.cleared'))
  }

  const handleInstall = () => {
    document.querySelector<PWAInstallElement>('pwa-install')?.showDialog(true)
  }

  // Forza il check di un nuovo service worker e ricarica: con registerType
  // 'autoUpdate' (skipWaiting) la nuova versione si attiva al reload.
  const handleUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.update()))
    }
    window.location.reload()
  }

  const handleExport = async () => {
    const data = await exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spesa-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast(t('settings.exported'))
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permette di riselezionare lo stesso file
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isBackupData(parsed)) {
        toast.error(t('settings.importInvalid'))
        return
      }
      setPendingImport(parsed)
    } catch {
      toast.error(t('settings.importInvalid'))
    }
  }

  const handleImportConfirm = async () => {
    if (!pendingImport) return
    try {
      await importData(pendingImport)
      await qc.invalidateQueries()
      setPendingImport(null)
      toast(t('settings.imported'))
    } catch {
      setPendingImport(null)
      toast.error(t('settings.importInvalid'))
    }
  }

  const setGitField = (field: keyof GitConfig, value: string) => {
    setGit((g) => ({ ...g, [field]: value }))
  }

  const handleGitSave = () => {
    setGitConfig(git)
    toast(t('settings.syncSaved'))
  }

  const handleToggleAuto = () => {
    const next = !auto
    setAuto(next)
    setAutoSync(next)
  }

  const handlePush = async () => {
    if (!isGitConfigured(git)) {
      toast.error(t('settings.syncNotConfigured'))
      return
    }
    setGitConfig(git)
    setSyncing(true)
    try {
      await syncPushForce()
      toast(t('settings.syncDone'))
    } catch (e) {
      toast.error(`${t('settings.syncError')}: ${e instanceof Error ? e.message : ''}`)
    } finally {
      setSyncing(false)
    }
  }

  const handlePull = async () => {
    setShowPull(false)
    setGitConfig(git)
    setSyncing(true)
    try {
      await syncPull()
      await qc.invalidateQueries()
      toast(t('settings.syncPulled'))
    } catch (e) {
      toast.error(`${t('settings.syncError')}: ${e instanceof Error ? e.message : ''}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        <div className="px-1 pt-2 pb-[18px]">
          <span className="text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">
            {t('settings.title')}
          </span>
        </div>

        {/* Lingua */}
        <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1.5 pb-[13px]">
          {t('settings.language')}
        </div>
        <div className="bg-white rounded-[20px] overflow-hidden mb-7">
          {LANGS.map((l, i) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className="w-full flex items-center justify-between px-5 py-[17px] active:bg-[#F6F6F4] transition-colors text-left"
              style={{ borderBottom: i < LANGS.length - 1 ? '1px solid #ECECEC' : 'none' }}
            >
              <span className="text-base text-[#2A2A2C]">{l.label}</span>
              {current === l.code && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l4 4 10-10" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Installa */}
        <button
          onClick={handleInstall}
          className="w-full flex items-center justify-between bg-white rounded-[20px] px-5 py-[17px] mb-7 active:bg-[#F6F6F4] transition-colors text-left"
        >
          <span className="text-base text-[#2A2A2C]">{t('install.title')}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B9B9F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v13M8 12l4 4 4-4M5 19h14" />
          </svg>
        </button>

        {/* Aggiorna app (service worker) */}
        <button
          onClick={() => void handleUpdate()}
          className="w-full flex items-center justify-between bg-white rounded-[20px] px-5 py-[17px] mb-7 active:bg-[#F6F6F4] transition-colors text-left"
        >
          <span className="text-base text-[#2A2A2C]">{t('settings.refresh')}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B9B9F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" />
          </svg>
        </button>

        {/* Versione */}
        <div className="bg-white rounded-[20px] px-5 py-[17px] flex items-center justify-between mb-7">
          <span className="text-base text-[#2A2A2C]">{t('settings.version')}</span>
          <span className="text-[15px] text-[#9B9B9F] tabular-nums">{__APP_VERSION__}</span>
        </div>

        {/* Dati */}
        <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1.5 pb-[13px]">
          {t('settings.data')}
        </div>
        <div className="bg-white rounded-[20px] overflow-hidden mb-3">
          <button
            onClick={() => void handleExport()}
            className="w-full flex items-center justify-between px-5 py-[17px] border-b border-[#ECECEC] active:bg-[#F6F6F4] transition-colors text-left"
          >
            <span className="text-base text-[#2A2A2C]">{t('settings.exportData')}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B9B9F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
            </svg>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between px-5 py-[17px] active:bg-[#F6F6F4] transition-colors text-left"
          >
            <span className="text-base text-[#2A2A2C]">{t('settings.importData')}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B9B9F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V9m0 0L8 13m4-4l4 4M5 4h14" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setShowWipe(true)}
          className="w-full bg-white rounded-[20px] px-5 py-[17px] mb-7 text-left text-base text-[#D14343] active:bg-[#F6F6F4] transition-colors"
        >
          {t('settings.deleteAll')}
        </button>

        {/* Sincronizzazione GitHub */}
        <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1.5 pb-[13px]">
          {t('settings.sync')}
        </div>
        <p className="text-[13px] text-[#9B9B9F] px-1.5 pb-[13px] leading-relaxed">
          {t('settings.syncHint')}
        </p>
        <div className="bg-white rounded-[20px] overflow-hidden mb-3">
          {([
            { f: 'token', ph: t('settings.syncToken'), type: 'password' },
            { f: 'owner', ph: t('settings.syncOwner'), type: 'text' },
            { f: 'repo', ph: t('settings.syncRepo'), type: 'text' },
            { f: 'branch', ph: t('settings.syncBranch'), type: 'text' },
            { f: 'path', ph: t('settings.syncPath'), type: 'text' },
          ] as const).map((row, i, arr) => (
            <input
              key={row.f}
              type={row.type}
              value={git[row.f]}
              onChange={(e) => setGitField(row.f, e.target.value)}
              placeholder={row.ph}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full px-5 py-[15px] text-base text-[#2A2A2C] placeholder:text-[#B5B5BA] bg-transparent outline-none"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid #ECECEC' : 'none' }}
            />
          ))}
        </div>
        <button
          onClick={handleGitSave}
          className="w-full bg-white rounded-[20px] px-5 py-[17px] mb-3 text-left text-base text-[#2A2A2C] active:bg-[#F6F6F4] transition-colors"
        >
          {t('settings.syncSave')}
        </button>
        <button
          onClick={handleToggleAuto}
          className="w-full flex items-center justify-between bg-white rounded-[20px] px-5 py-[17px] mb-3 active:bg-[#F6F6F4] transition-colors text-left"
        >
          <span className="text-base text-[#2A2A2C]">{t('settings.syncAuto')}</span>
          <span
            className={`relative w-[46px] h-[28px] rounded-full transition-colors flex-none ${auto ? 'bg-[#2A2A2C]' : 'bg-[#D8D8D6]'}`}
          >
            <span
              className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all ${auto ? 'left-[21px]' : 'left-[3px]'}`}
            />
          </span>
        </button>
        <button
          onClick={() => void handlePush()}
          disabled={syncing}
          className="w-full bg-[#2A2A2C] text-white rounded-[20px] px-5 py-[17px] mb-2.5 text-base active:scale-[.99] transition-transform disabled:opacity-50"
        >
          {t('settings.syncNow')}
        </button>
        <button
          onClick={() => setShowPull(true)}
          disabled={syncing}
          className="w-full bg-white rounded-[20px] px-5 py-[17px] text-base text-[#2A2A2C] active:bg-[#F6F6F4] transition-colors disabled:opacity-50"
        >
          {t('settings.syncPull')}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void handleFileSelected(e)}
        />
      </div>

      {/* Drawer di conferma azzeramento */}
      <BottomSheet open={showWipe} onClose={() => setShowWipe(false)}>
        <div className="text-[20px] font-normal text-[#D14343] px-0.5 pb-2">
          {t('settings.confirmTitle')}
        </div>
        <p className="text-sm text-[#6E6E72] px-0.5 pb-4 leading-relaxed">
          {t('settings.confirmBody')}
        </p>
        <button
          onClick={() => void handleWipe()}
          className="w-full bg-[#D14343] text-white text-[17px] py-[18px] rounded-[20px] mb-2 active:scale-[.98] transition-transform"
        >
          {t('settings.deleteConfirm')}
        </button>
        <button
          onClick={() => setShowWipe(false)}
          className="w-full bg-[#ECECEA] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>

      {/* Drawer di conferma import (sovrascrive tutto) */}
      <BottomSheet open={pendingImport !== null} onClose={() => setPendingImport(null)}>
        <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-2">
          {t('settings.importConfirmTitle')}
        </div>
        <p className="text-sm text-[#6E6E72] px-0.5 pb-4 leading-relaxed">
          {t('settings.importConfirmBody')}
        </p>
        <button
          onClick={() => void handleImportConfirm()}
          className="w-full bg-[#2A2A2C] text-white text-[17px] py-[18px] rounded-[20px] mb-2 active:scale-[.98] transition-transform"
        >
          {t('settings.importConfirm')}
        </button>
        <button
          onClick={() => setPendingImport(null)}
          className="w-full bg-[#ECECEA] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>

      {/* Drawer di conferma pull (sovrascrive i dati locali) */}
      <BottomSheet open={showPull} onClose={() => setShowPull(false)}>
        <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-2">
          {t('settings.syncPullConfirmTitle')}
        </div>
        <p className="text-sm text-[#6E6E72] px-0.5 pb-4 leading-relaxed">
          {t('settings.syncPullConfirmBody')}
        </p>
        <button
          onClick={() => void handlePull()}
          className="w-full bg-[#2A2A2C] text-white text-[17px] py-[18px] rounded-[20px] mb-2 active:scale-[.98] transition-transform"
        >
          {t('settings.syncPullConfirm')}
        </button>
        <button
          onClick={() => setShowPull(false)}
          className="w-full bg-[#ECECEA] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>
    </>
  )
}
