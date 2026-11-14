import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PWAInstallElement } from '@khmyznikov/pwa-install'
import { LANG_KEY, type Lang } from '../i18n'
import { getWeekStartDay, setWeekStartDay } from '../lib/weekSettings'
import { getDefaultBuonoValueCents, setDefaultBuonoValueCents } from '../lib/buoniSettings'
import { BuonoValueStepper } from '../components/BuoniSheet'
import { dayShort } from '../lib/date'
import { wipeAllData } from '../db/db'
import { exportData, importData, isBackupData, type BackupData } from '../db/backup'
import { saveSafetySnapshot } from '../db/repositories/safetySnapshots'
import { getDebugViewport, setDebugViewport } from '../lib/debugFlag'
import { resetTutorial } from '../tutorial/tutorialStore'
import { BottomSheet } from '../components/BottomSheet'
import { BackButton } from '../components/BackButton'
import { ThemePicker } from '../components/ThemePicker'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
]

export function ImpostazioniScreen() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showWipe, setShowWipe] = useState(false)
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [debug, setDebug] = useState<boolean>(() => getDebugViewport())
  const [weekStart, setWeekStart] = useState<number>(() => getWeekStartDay())
  const [buonoValue, setBuonoValue] = useState<number>(() => getDefaultBuonoValueCents())
  const current: Lang = i18n.language.startsWith('en') ? 'en' : 'it'

  const setLang = (lng: Lang) => {
    void i18n.changeLanguage(lng)
    localStorage.setItem(LANG_KEY, lng)
  }

  const handleWeekStart = (day: number) => {
    setWeekStartDay(day)
    setWeekStart(day)
    void qc.invalidateQueries()
    toast(t('settings.weekStartDaySaved'))
  }

  const handleBuonoValue = (cents: number) => {
    setDefaultBuonoValueCents(cents)
    setBuonoValue(getDefaultBuonoValueCents())
  }

  const handleReplayTutorial = () => {
    resetTutorial()
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

  const handleUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
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
      await saveSafetySnapshot('import-file', JSON.stringify(await exportData()))
      await importData(pendingImport)
      await qc.invalidateQueries()
      setPendingImport(null)
      toast(t('settings.imported'))
    } catch {
      setPendingImport(null)
      toast.error(t('settings.importInvalid'))
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        <div className="flex items-center gap-2 pt-2 pb-[18px]">
          <BackButton />
          <span className="text-[26px] font-normal tracking-[-0.5px] text-t-fg">
            {t('settings.title')}
          </span>
        </div>

        {/* App: versione, aggiorna, installa */}
        <div className="text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pb-[13px]">
          {t('settings.app')}
        </div>
        <div className="bg-t-surface rounded-[20px] overflow-hidden mb-7">
          <button
            onClick={() => void navigate({ to: '/changelog' })}
            className="w-full flex items-center justify-between px-5 py-[17px] border-b border-t-line active:bg-t-surface2 transition-colors text-left"
          >
            <span className="text-base text-t-fg">{t('settings.version')}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] text-t-muted tabular-nums">{__APP_VERSION__}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
          <button
            onClick={() => void handleUpdate()}
            className="w-full flex items-center justify-between px-5 py-[17px] border-b border-t-line active:bg-t-surface2 transition-colors text-left"
          >
            <span className="text-base text-t-fg">{t('settings.refresh')}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" />
            </svg>
          </button>
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-between px-5 py-[17px] active:bg-t-surface2 transition-colors text-left"
          >
            <span className="text-base text-t-fg">{t('install.title')}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v13M8 12l4 4 4-4M5 19h14" />
            </svg>
          </button>
        </div>

        {/* Lingua */}
        <div className="text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pb-[13px]">
          {t('settings.language')}
        </div>
        <div className="bg-t-surface rounded-[20px] overflow-hidden mb-7">
          {LANGS.map((l, i) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className="w-full flex items-center justify-between px-5 py-[17px] active:bg-t-surface2 transition-colors text-left"
              style={{ borderBottom: i < LANGS.length - 1 ? '1px solid var(--t-line)' : 'none' }}
            >
              <span className="text-base text-t-fg">{l.label}</span>
              {current === l.code && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l4 4 10-10" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Aspetto: tema dell'app */}
        <ThemePicker />

        {/* Buoni pasto: valore predefinito per le nuove spese */}
        <div className="text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pb-[13px]">
          {t('settings.buoni')}
        </div>
        <div className="bg-t-surface rounded-[20px] px-5 py-[13px] flex items-center justify-between mb-2">
          <span className="text-base text-t-fg">{t('settings.defaultBuonoValue')}</span>
          <BuonoValueStepper valueCents={buonoValue} onValue={handleBuonoValue} />
        </div>
        <div className="text-[13px] text-t-muted px-1.5 mb-7">{t('settings.defaultBuonoValueHint')}</div>

        {/* Inizio settimana */}
        <div className="text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pb-[13px]">
          {t('settings.weekStartDay')}
        </div>
        <div className="bg-t-surface rounded-[20px] overflow-hidden mb-7">
          {Array.from({ length: 7 }, (_, i) => (
            <button
              key={i}
              onClick={() => handleWeekStart(i)}
              className="w-full flex items-center justify-between px-5 py-[17px] active:bg-t-surface2 transition-colors text-left"
              style={{ borderBottom: i < 6 ? '1px solid var(--t-line)' : 'none' }}
            >
              <span className="text-base text-t-fg">{dayShort(i)}</span>
              {weekStart === i && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l4 4 10-10" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Tutorial */}
        <div className="text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pb-[13px]">
          {t('tutorial.section')}
        </div>
        <button
          onClick={handleReplayTutorial}
          className="w-full bg-t-surface rounded-[20px] px-5 py-[17px] text-left text-base text-t-fg active:bg-t-surface2 transition-colors mb-7"
        >
          {t('tutorial.replay')}
        </button>

        {/* Dati */}
        <div className="text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pb-[13px]">
          {t('settings.data')}
        </div>
        <div className="bg-t-surface rounded-[20px] overflow-hidden mb-3">
          <button
            onClick={() => void handleExport()}
            className="w-full flex items-center justify-between px-5 py-[17px] border-b border-t-line active:bg-t-surface2 transition-colors text-left"
          >
            <span className="text-base text-t-fg">{t('settings.exportData')}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
            </svg>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between px-5 py-[17px] active:bg-t-surface2 transition-colors text-left"
          >
            <span className="text-base text-t-fg">{t('settings.importData')}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V9m0 0L8 13m4-4l4 4M5 4h14" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setShowWipe(true)}
          className="w-full bg-t-surface rounded-[20px] px-5 py-[17px] mb-7 text-left text-base text-t-danger active:bg-t-surface2 transition-colors"
        >
          {t('settings.deleteAll')}
        </button>

        {/* Sincronizzazione: pagina dedicata */}
        <Link
          to="/sincronizzazione"
          className="w-full flex items-center justify-between bg-t-surface rounded-[20px] px-5 py-[17px] mb-7 active:bg-t-surface2 transition-colors text-left"
        >
          <span className="text-base text-t-fg">{t('syncPage.link')}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t-chev)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>

        {/* Debug (sviluppo) */}
        <div className="text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pt-7 pb-[13px]">
          {t('settings.debug')}
        </div>
        <button
          onClick={() => {
            const next = !debug
            setDebug(next)
            setDebugViewport(next)
          }}
          className="w-full flex items-center justify-between bg-t-surface rounded-[20px] px-5 py-[17px] active:bg-t-surface2 transition-colors text-left"
        >
          <span className="text-base text-t-fg">{t('settings.debugViewport')}</span>
          <span
            className={`relative w-[46px] h-[28px] rounded-full transition-colors flex-none ${debug ? 'bg-t-accent' : 'bg-t-line2'}`}
          >
            <span
              className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-t-surface transition-all ${debug ? 'left-[21px]' : 'left-[3px]'}`}
            />
          </span>
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
        <div className="text-[20px] font-normal text-t-danger px-0.5 pb-2">
          {t('settings.confirmTitle')}
        </div>
        <p className="text-sm text-t-text2 px-0.5 pb-4 leading-relaxed">
          {t('settings.confirmBody')}
        </p>
        <button
          onClick={() => void handleWipe()}
          className="w-full bg-t-danger text-t-on text-[17px] py-[18px] rounded-[20px] mb-2 active:scale-[.98] transition-transform"
        >
          {t('settings.deleteConfirm')}
        </button>
        <button
          onClick={() => setShowWipe(false)}
          className="w-full bg-t-line5 text-t-fg text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>

      {/* Drawer di conferma import (sovrascrive tutto) */}
      <BottomSheet open={pendingImport !== null} onClose={() => setPendingImport(null)}>
        <div className="text-[20px] font-normal text-t-fg px-0.5 pb-2">
          {t('settings.importConfirmTitle')}
        </div>
        <p className="text-sm text-t-text2 px-0.5 pb-4 leading-relaxed">
          {t('settings.importConfirmBody')}
        </p>
        <button
          onClick={() => void handleImportConfirm()}
          className="w-full bg-t-accent text-t-on text-[17px] py-[18px] rounded-[20px] mb-2 active:scale-[.98] transition-transform"
        >
          {t('settings.importConfirm')}
        </button>
        <button
          onClick={() => setPendingImport(null)}
          className="w-full bg-t-line5 text-t-fg text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>

    </>
  )
}
