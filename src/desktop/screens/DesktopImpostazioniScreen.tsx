import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PWAInstallElement } from '@khmyznikov/pwa-install'
import { PageHeader } from '../components/PageHeader'
import { Card, Toggle, ModalActions } from '../components/settingsUi'
import { action, primary, danger } from '../components/settingsStyles'
import { ThemePicker } from '../components/ThemePicker'
import { LANG_KEY, type Lang } from '../../i18n'
import { getWeekStartDay, setWeekStartDay } from '../../lib/weekSettings'
import { getDefaultBuonoValueCents, setDefaultBuonoValueCents } from '../../lib/buoniSettings'
import { BuonoValueStepper } from '../../components/BuoniSheet'
import { dayShort } from '../../lib/date'
import { wipeAllData } from '../../db/db'
import { exportData, importData, isBackupData, type BackupData } from '../../db/backup'
import { saveSafetySnapshot } from '../../db/repositories/safetySnapshots'
import { getDebugViewport, setDebugViewport } from '../../lib/debugFlag'
import { resetTutorial } from '../../tutorial/tutorialStore'
import { Modal } from '../components/Modal'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
]

const pill = (active: boolean) => ({
  padding: '8px 16px',
  borderRadius: '10px',
  border: 'none',
  background: active ? 'var(--t-accent)' : 'var(--t-bg)',
  color: active ? 'var(--t-on)' : 'var(--t-fg)',
  fontSize: '14px',
  cursor: 'pointer',
})

export function DesktopImpostazioniScreen() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [weekStart, setWeekStart] = useState<number>(() => getWeekStartDay())
  const [buonoValue, setBuonoValue] = useState<number>(() => getDefaultBuonoValueCents())
  const navigate = useNavigate()
  const [showWipe, setShowWipe] = useState(false)
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null)
  const [debug, setDebug] = useState<boolean>(() => getDebugViewport())
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

  const handleReplayTutorial = () => {
    resetTutorial()
  }

  const handleWipe = async () => {
    await wipeAllData()
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

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <PageHeader title={t('settings.title')} subtitle={t('desktop.settings.subtitle')} />
      {/* Aspetto a tutta larghezza; sotto due colonne di altezza simile (a mano: con le colonne CSS la scheda alta
          della sincronizzazione sbilanciava tutto); Sincronizzazione, la più alta, a tutta larghezza in fondo. */}
      <div style={{ containerType: 'inline-size' }}>
        <ThemePicker />
        <div className="settings-cols">
          <div className="settings-col">
          <Card title={t('settings.buoni')} hint={t('settings.defaultBuonoValueHint')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: 'var(--t-fg)' }}>{t('settings.defaultBuonoValue')}</span>
              <BuonoValueStepper valueCents={buonoValue} onValue={handleBuonoValue} />
            </div>
          </Card>
          <Card title={t('settings.weekStartDay')} hint={t('desktop.settings.weekStartHint')}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Array.from({ length: 7 }, (_, i) => (
                <button key={i} onClick={() => handleWeekStart(i)} style={pill(weekStart === i)}>
                  {dayShort(i)}
                </button>
              ))}
            </div>
          </Card>
          <Card title={t('settings.app')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--t-fg)' }}>{t('settings.version')}</span>
              <button
                onClick={() => void navigate({ to: '/changelog' })}
                style={{ all: 'unset', cursor: 'pointer', fontSize: '14px', color: 'var(--t-muted)', fontVariantNumeric: 'tabular-nums' }}
              >
                {__APP_VERSION__} ›
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => void handleUpdate()} style={action}>
                {t('settings.refresh')}
              </button>
              <button onClick={handleInstall} style={action}>
                {t('install.title')}
              </button>
            </div>
          </Card>
          </div>
          <div className="settings-col">
          <Card title={t('settings.language')}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)} style={pill(current === l.code)}>
                  {l.label}
                </button>
              ))}
            </div>
          </Card>
          <Card title={t('settings.data')} hint={t('desktop.settings.backupHint')}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => void handleExport()} style={action}>
                {t('settings.exportData')}
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={action}>
                {t('settings.importData')}
              </button>
              <button onClick={() => setShowWipe(true)} style={danger}>
                {t('settings.deleteAll')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(e) => void handleFileSelected(e)}
                style={{ display: 'none' }}
              />
            </div>
          </Card>
          <Card title={t('tutorial.section')}>
            <button onClick={handleReplayTutorial} style={action}>
              {t('tutorial.replay')}
            </button>
          </Card>
          <Card title={t('settings.debug')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: 'var(--t-fg)' }}>{t('settings.debugViewport')}</span>
              <Toggle
                on={debug}
                label={t('settings.debugViewport')}
                onClick={() => {
                  const next = !debug
                  setDebug(next)
                  setDebugViewport(next)
                }}
              />
            </div>
          </Card>
          </div>
        </div>
        <Card title={t('settings.sync')} hint={t('settings.syncHint')}>
          <button onClick={() => void navigate({ to: '/sincronizzazione' })} style={action}>
            {t('syncPage.link')} ›
          </button>
        </Card>
      </div>

      <Modal open={showWipe} onClose={() => setShowWipe(false)} title={t('settings.confirmTitle')}>
        <p style={{ fontSize: '14px', color: 'var(--t-text2)', lineHeight: 1.5, margin: 0 }}>{t('settings.confirmBody')}</p>
        <ModalActions>
          <button onClick={() => setShowWipe(false)} style={action}>
            {t('common.cancel')}
          </button>
          <button onClick={() => void handleWipe()} style={{ ...primary, background: 'var(--t-danger)', border: '1px solid var(--t-danger)' }}>
            {t('settings.deleteConfirm')}
          </button>
        </ModalActions>
      </Modal>

      <Modal open={pendingImport !== null} onClose={() => setPendingImport(null)} title={t('settings.importConfirmTitle')}>
        <p style={{ fontSize: '14px', color: 'var(--t-text2)', lineHeight: 1.5, margin: 0 }}>{t('settings.importConfirmBody')}</p>
        <ModalActions>
          <button onClick={() => setPendingImport(null)} style={action}>
            {t('common.cancel')}
          </button>
          <button onClick={() => void handleImportConfirm()} style={primary}>
            {t('settings.importConfirm')}
          </button>
        </ModalActions>
      </Modal>

    </div>
  )
}
