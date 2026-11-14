import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { Card, Toggle, ModalActions } from '../components/settingsUi'
import { action, primary, input } from '../components/settingsStyles'
import { Modal } from '../components/Modal'
import { SortableTable, type Column } from '../components/SortableTable'
import { SyncDiffView } from '../../components/sync/SyncDiffView'
import { SyncGuide } from '../../components/sync/SyncGuide'
import { SyncBranches } from '../../components/sync/SyncBranches'
import { formatDateTime, historyDetail, historyTitle } from '../../components/sync/historyText'
import { useGitSyncSettings } from '../../hooks/useGitSyncSettings'
import { useHistoryPreview, useRemoteHistory, useRestore, useSafetySnapshots } from '../../hooks/useSyncHistory'
import { buildHistoryItems, type HistoryItem } from '../../lib/historyItems'
import { getGitConfig, isGitConfigured } from '../../lib/gitSync'

export function DesktopSincronizzazioneScreen() {
  const { t } = useTranslation()
  const s = useGitSyncSettings()
  const navigate = useNavigate()
  const configured = isGitConfigured(getGitConfig())
  const remote = useRemoteHistory()
  const local = useSafetySnapshots()
  const [selected, setSelected] = useState<HistoryItem | null>(null)
  const [confirming, setConfirming] = useState(false)
  const preview = useHistoryPreview(selected?.selection ?? null)
  const close = () => {
    setSelected(null)
    setConfirming(false)
  }
  const restore = useRestore(close)

  const items = buildHistoryItems(remote.data ?? [], local.data ?? [])

  const gitFields = [
    { f: 'token', label: t('settings.syncToken'), type: 'password' },
    { f: 'owner', label: t('settings.syncOwner'), type: 'text' },
    { f: 'repo', label: t('settings.syncRepo'), type: 'text' },
    { f: 'branch', label: t('settings.syncBranch'), type: 'text' },
    { f: 'path', label: t('settings.syncPath'), type: 'text' },
  ] as const

  const columns: Column<HistoryItem>[] = [
    {
      key: 'when',
      label: t('syncPage.history'),
      sortValue: (r) => r.when,
      render: (r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatDateTime(r.when)}</span>,
    },
    { key: 'kind', label: '', sortValue: (r) => historyTitle(t, r), render: (r) => historyTitle(t, r) },
    {
      key: 'detail',
      label: '',
      render: (r) => <span style={{ color: 'var(--t-muted)' }}>{historyDetail(t, r) ?? ''}</span>,
    },
  ]

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <PageHeader title={t('syncPage.title')} subtitle={t('settings.syncHint')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
        <Card title={t('syncPage.config')}>
          <div style={{ background: 'var(--t-surface2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--t-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
              {t('settings.syncStepsTitle')}
            </div>
            <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--t-text2)', lineHeight: 1.6 }}>
              {[t('settings.syncStep1'), t('settings.syncStep2'), t('settings.syncStep3'), t('settings.syncStep4')].map(
                (step, i) => (
                  <li key={i}>{step}</li>
                ),
              )}
            </ol>
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: '10px', fontSize: '13px', color: 'var(--t-fg)' }}
            >
              {t('settings.syncCreateToken')} ↗
            </a>
          </div>
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
          {!configured && (
            <div style={{ fontSize: '13px', color: 'var(--t-muted)' }}>{t('syncPage.historyNotConfigured')}</div>
          )}
          {configured && remote.isPending && (
            <div style={{ fontSize: '13px', color: 'var(--t-muted)' }}>{t('syncPage.historyLoading')}</div>
          )}
          {remote.isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--t-danger)' }}>{t('syncPage.historyError')}</span>
              <button onClick={() => void remote.refetch()} style={action}>
                {t('syncPage.retry')}
              </button>
            </div>
          )}
          {(items.length > 0 || (configured && remote.isSuccess)) && (
            <SortableTable
              columns={columns}
              rows={items}
              rowKey={(r) => r.key}
              defaultSort={{ key: 'when', dir: 'desc' }}
              onRowClick={setSelected}
              emptyMessage={t('syncPage.historyEmpty')}
            />
          )}
        </Card>
      </div>

      <div style={{ marginTop: '28px' }}>
        <SectionTitle>{t('syncPage.guide')}</SectionTitle>
        <SyncGuide />
      </div>

      <Modal open={selected !== null} onClose={close} title={selected ? historyTitle(t, selected) : undefined} width={560}>
        {selected && (
          <>
            <div style={{ fontSize: '13px', color: 'var(--t-muted)', marginBottom: '16px', fontVariantNumeric: 'tabular-nums' }}>
              {formatDateTime(selected.when)}
            </div>
            <SectionTitle>{t('syncPage.compareTitle')}</SectionTitle>
            <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
              {preview.isPending && <p style={{ fontSize: '13px', color: 'var(--t-muted)', margin: 0 }}>{t('syncPage.previewLoading')}</p>}
              {preview.isError && <p style={{ fontSize: '13px', color: 'var(--t-danger)', margin: 0 }}>{t('syncPage.previewError')}</p>}
              {preview.data && <SyncDiffView diff={preview.data.diff} />}
            </div>
            {confirming && (
              <p style={{ fontSize: '14px', color: 'var(--t-text2)', lineHeight: 1.5, margin: '16px 0 0' }}>
                {selected.selection.source === 'remote'
                  ? t('syncPage.restoreConfirmBodyRepo')
                  : t('syncPage.restoreConfirmBodyLocal')}
              </p>
            )}
            <ModalActions>
              <button onClick={confirming ? () => setConfirming(false) : close} style={action}>
                {t('common.cancel')}
              </button>
              {confirming ? (
                <button
                  disabled={!preview.data || restore.isPending}
                  onClick={() =>
                    preview.data &&
                    restore.mutate({
                      data: preview.data.data,
                      via: selected.selection.source === 'remote' ? 'repo' : 'local',
                    })
                  }
                  style={{ ...primary, opacity: !preview.data || restore.isPending ? 0.5 : 1 }}
                >
                  {t('syncPage.restoreConfirm')}
                </button>
              ) : (
                <button disabled={!preview.data} onClick={() => setConfirming(true)} style={{ ...primary, opacity: preview.data ? 1 : 0.5 }}>
                  {t('syncPage.restore')}
                </button>
              )}
            </ModalActions>
          </>
        )}
      </Modal>

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
