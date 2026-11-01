import { useRef, useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PWAInstallElement } from '@khmyznikov/pwa-install'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { LANG_KEY, type Lang } from '../../i18n'
import { getWeekStartDay, setWeekStartDay } from '../../lib/weekSettings'
import { getDefaultBuonoValueCents, setDefaultBuonoValueCents } from '../../lib/buoniSettings'
import { BuonoValueStepper } from '../../components/BuoniSheet'
import { dayShort } from '../../lib/date'
import { wipeAllData } from '../../db/db'
import { exportData, importData, isBackupData, type BackupData } from '../../db/backup'
import {
  getGitConfig,
  setGitConfig,
  getAutoSync,
  setAutoSync,
  isGitConfigured,
  syncPull,
  type GitConfig,
} from '../../lib/gitSync'
import { runSync } from '../../lib/syncRunner'
import { getDebugViewport, setDebugViewport } from '../../lib/debugFlag'
import { resetTutorial } from '../../tutorial/tutorialStore'
import { Modal } from '../components/Modal'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
]

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', flex: '1 1 340px', minWidth: 0 }}>
      <SectionTitle>{title}</SectionTitle>
      {hint && <div style={{ fontSize: '13px', color: '#9B9B9F', margin: '-8px 0 16px' }}>{hint}</div>}
      {children}
    </div>
  )
}

const pill = (active: boolean) => ({
  padding: '8px 16px',
  borderRadius: '10px',
  border: 'none',
  background: active ? '#2A2A2C' : '#F2F2F0',
  color: active ? '#fff' : '#2A2A2C',
  fontSize: '14px',
  cursor: 'pointer',
})

const action = {
  padding: '10px 18px',
  borderRadius: '10px',
  border: '1px solid #D8D8D6',
  background: '#fff',
  color: '#2A2A2C',
  fontSize: '14px',
  cursor: 'pointer',
}

const primary = { ...action, background: '#2A2A2C', color: '#fff', border: '1px solid #2A2A2C' }
const danger = { ...action, color: '#D14343', border: '1px solid #D14343' }

const input = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #D8D8D6',
  background: '#fff',
  fontSize: '14px',
  color: '#2A2A2C',
  outline: 'none',
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        position: 'relative',
        width: '46px',
        height: '28px',
        borderRadius: '999px',
        background: on ? '#2A2A2C' : '#D8D8D6',
        flex: 'none',
        transition: 'background .15s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: on ? '21px' : '3px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .15s',
        }}
      />
    </button>
  )
}

function ModalActions({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>{children}</div>
}

export function DesktopImpostazioniScreen() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [weekStart, setWeekStart] = useState<number>(() => getWeekStartDay())
  const [buonoValue, setBuonoValue] = useState<number>(() => getDefaultBuonoValueCents())
  const navigate = useNavigate()
  const [showWipe, setShowWipe] = useState(false)
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null)
  const [git, setGit] = useState<GitConfig>(() => getGitConfig())
  const [auto, setAuto] = useState<boolean>(() => getAutoSync())
  const [syncing, setSyncing] = useState(false)
  const [showPull, setShowPull] = useState(false)
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
      await runSync(qc, { announce: true })
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

  const gitFields = [
    { f: 'token', label: t('settings.syncToken'), type: 'password' },
    { f: 'owner', label: t('settings.syncOwner'), type: 'text' },
    { f: 'repo', label: t('settings.syncRepo'), type: 'text' },
    { f: 'branch', label: t('settings.syncBranch'), type: 'text' },
    { f: 'path', label: t('settings.syncPath'), type: 'text' },
  ] as const

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <PageHeader title={t('settings.title')} subtitle={t('desktop.settings.subtitle')} />
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Card title={t('settings.language')}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)} style={pill(current === l.code)}>
                {l.label}
              </button>
            ))}
          </div>
        </Card>

        <Card title={t('settings.buoni')} hint={t('settings.defaultBuonoValueHint')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: '#2A2A2C' }}>{t('settings.defaultBuonoValue')}</span>
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

        <Card title={t('settings.app')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: '#2A2A2C' }}>{t('settings.version')}</span>
            <button
              onClick={() => void navigate({ to: '/changelog' })}
              style={{ all: 'unset', cursor: 'pointer', fontSize: '14px', color: '#9B9B9F', fontVariantNumeric: 'tabular-nums' }}
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

        <Card title={t('tutorial.section')}>
          <button onClick={handleReplayTutorial} style={action}>
            {t('tutorial.replay')}
          </button>
        </Card>

        <Card title={t('settings.sync')} hint={t('settings.syncHint')}>
          <div style={{ background: '#F6F6F4', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#9B9B9F', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
              {t('settings.syncStepsTitle')}
            </div>
            <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#6E6E72', lineHeight: 1.6 }}>
              {[
                t('settings.syncStep1'),
                t('settings.syncStep2'),
                t('settings.syncStep3'),
                t('settings.syncStep4'),
              ].map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: '10px', fontSize: '13px', color: '#2A2A2C' }}
            >
              {t('settings.syncCreateToken')} ↗
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {gitFields.map((row) => (
              <label
                key={row.f}
                style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#9B9B9F', gridColumn: row.f === 'token' || row.f === 'path' ? '1 / -1' : undefined }}
              >
                {row.label}
                <input
                  type={row.type}
                  value={git[row.f]}
                  onChange={(e) => setGitField(row.f, e.target.value)}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={input}
                />
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: '#2A2A2C' }}>{t('settings.syncAuto')}</span>
            <Toggle on={auto} onClick={handleToggleAuto} label={t('settings.syncAuto')} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleGitSave} style={action}>
              {t('settings.syncSave')}
            </button>
            <button onClick={() => void handlePush()} disabled={syncing} style={{ ...primary, opacity: syncing ? 0.5 : 1 }}>
              {t('settings.syncNow')}
            </button>
            <button onClick={() => setShowPull(true)} disabled={syncing} style={{ ...action, opacity: syncing ? 0.5 : 1 }}>
              {t('settings.syncPull')}
            </button>
          </div>
        </Card>

        <Card title={t('settings.debug')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: '#2A2A2C' }}>{t('settings.debugViewport')}</span>
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

      <Modal open={showWipe} onClose={() => setShowWipe(false)} title={t('settings.confirmTitle')}>
        <p style={{ fontSize: '14px', color: '#6E6E72', lineHeight: 1.5, margin: 0 }}>{t('settings.confirmBody')}</p>
        <ModalActions>
          <button onClick={() => setShowWipe(false)} style={action}>
            {t('common.cancel')}
          </button>
          <button onClick={() => void handleWipe()} style={{ ...primary, background: '#D14343', border: '1px solid #D14343' }}>
            {t('settings.deleteConfirm')}
          </button>
        </ModalActions>
      </Modal>

      <Modal open={pendingImport !== null} onClose={() => setPendingImport(null)} title={t('settings.importConfirmTitle')}>
        <p style={{ fontSize: '14px', color: '#6E6E72', lineHeight: 1.5, margin: 0 }}>{t('settings.importConfirmBody')}</p>
        <ModalActions>
          <button onClick={() => setPendingImport(null)} style={action}>
            {t('common.cancel')}
          </button>
          <button onClick={() => void handleImportConfirm()} style={primary}>
            {t('settings.importConfirm')}
          </button>
        </ModalActions>
      </Modal>

      <Modal open={showPull} onClose={() => setShowPull(false)} title={t('settings.syncPullConfirmTitle')}>
        <p style={{ fontSize: '14px', color: '#6E6E72', lineHeight: 1.5, margin: 0 }}>{t('settings.syncPullConfirmBody')}</p>
        <ModalActions>
          <button onClick={() => setShowPull(false)} style={action}>
            {t('common.cancel')}
          </button>
          <button onClick={() => void handlePull()} style={primary}>
            {t('settings.syncPullConfirm')}
          </button>
        </ModalActions>
      </Modal>
    </div>
  )
}
