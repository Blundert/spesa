import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { Card, Toggle, ModalActions } from '../components/settingsUi'
import { action, primary, input } from '../components/settingsStyles'
import { Modal } from '../components/Modal'
import { GithubConnect } from '../../components/sync/GithubConnect'
import { SyncGuide } from '../../components/sync/SyncGuide'
import { SyncBranches } from '../../components/sync/SyncBranches'
import { useGitSyncSettings } from '../../hooks/useGitSyncSettings'
import { getGitConfig, isGitConfigured } from '../../lib/gitSync'

export function DesktopSincronizzazioneScreen() {
  const { t } = useTranslation()
  const s = useGitSyncSettings()
  const navigate = useNavigate()
  const configured = isGitConfigured(getGitConfig())

  const gitFields = [
    { f: 'token', label: t('settings.syncToken'), type: 'password' },
    { f: 'owner', label: t('settings.syncOwner'), type: 'text' },
    { f: 'repo', label: t('settings.syncRepo'), type: 'text' },
    { f: 'branch', label: t('settings.syncBranch'), type: 'text' },
    { f: 'path', label: t('settings.syncPath'), type: 'text' },
  ] as const

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <PageHeader title={t('syncPage.title')} subtitle={t('settings.syncHint')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
        <Card title={t('syncPage.config')}>
          <GithubConnect s={s} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {gitFields.map((row) => (
              <label
                key={row.f}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px',
                  color: 'var(--t-muted)',
                  gridColumn: row.f === 'token' || row.f === 'path' ? '1 / -1' : undefined,
                }}
              >
                {row.label}
                <input
                  type={row.type}
                  value={s.git[row.f]}
                  onChange={(e) => s.setGitField(row.f, e.target.value)}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={input}
                />
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--t-fg)' }}>{t('settings.syncAuto')}</span>
            <Toggle on={s.auto} onClick={s.toggleAuto} label={t('settings.syncAuto')} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={s.save} style={action}>
              {t('settings.syncSave')}
            </button>
            <button onClick={s.forgetToken} disabled={!s.git.token} style={{ ...action, opacity: s.git.token ? 1 : 0.5 }}>
              {t('settings.syncForgetToken')}
            </button>
            <button onClick={() => void s.syncNow()} disabled={s.syncing} style={{ ...primary, opacity: s.syncing ? 0.5 : 1 }}>
              {t('settings.syncNow')}
            </button>
            <button
              onClick={() => void navigate({ to: '/sincronizzazione/unisci' })}
              disabled={s.syncing || !configured}
              style={{ ...action, opacity: s.syncing || !configured ? 0.5 : 1 }}
            >
              {t('syncMerge.open')}
            </button>
            <button onClick={() => s.setShowPull(true)} disabled={s.syncing} style={{ ...action, opacity: s.syncing ? 0.5 : 1 }}>
              {t('settings.syncPull')}
            </button>
          </div>
        </Card>
        <Card title={t('syncBranches.title')} hint={t('syncBranches.hint')}>
          <SyncBranches onSwitched={s.refresh} />
        </Card>
        </div>

        <Card title={t('syncPage.history')} hint={t('syncPage.historyHint')}>
          <button onClick={() => void navigate({ to: '/sincronizzazione/cronologia' })} style={action}>
            {t('syncPage.historyOpen')} →
          </button>
        </Card>
      </div>

      <div style={{ marginTop: '28px' }}>
        <SectionTitle>{t('syncPage.guide')}</SectionTitle>
        <SyncGuide />
      </div>

      <Modal open={s.showPull} onClose={() => s.setShowPull(false)} title={t('settings.syncPullConfirmTitle')}>
        <p style={{ fontSize: '14px', color: 'var(--t-text2)', lineHeight: 1.5, margin: 0 }}>{t('settings.syncPullConfirmBody')}</p>
        <ModalActions>
          <button onClick={() => s.setShowPull(false)} style={action}>
            {t('common.cancel')}
          </button>
          <button onClick={() => void s.pull()} style={primary}>
            {t('settings.syncPullConfirm')}
          </button>
        </ModalActions>
      </Modal>
    </div>
  )
}
