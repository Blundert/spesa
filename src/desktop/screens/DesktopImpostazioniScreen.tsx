import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { LANG_KEY, type Lang } from '../../i18n'
import { getWeekStartDay, setWeekStartDay } from '../../lib/weekSettings'
import { getDefaultBuonoValueCents, setDefaultBuonoValueCents } from '../../lib/buoniSettings'
import { BuonoValueStepper } from '../../components/BuoniSheet'
import { dayShort } from '../../lib/date'
import { exportData, importData, isBackupData } from '../../db/backup'

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

export function DesktopImpostazioniScreen() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
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
      if (!window.confirm(`${t('settings.importConfirmTitle')}\n${t('settings.importConfirmBody')}`)) return
      await importData(parsed)
      await qc.invalidateQueries()
      toast(t('settings.imported'))
    } catch {
      toast.error(t('settings.importInvalid'))
    }
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
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
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={(e) => void handleFileSelected(e)}
              style={{ display: 'none' }}
            />
          </div>
        </Card>

        <Card title={t('settings.version')}>
          <span style={{ fontSize: '14px', color: '#9B9B9F' }}>{__APP_VERSION__}</span>
        </Card>
      </div>
    </div>
  )
}
