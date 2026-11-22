import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { Card, ModalActions } from '../components/settingsUi'
import { action, primary } from '../components/settingsStyles'
import { Modal } from '../components/Modal'
import { CommitGraph } from '../components/CommitGraph'
import { CommitModal } from '../components/CommitModal'
import { useCommitGraph } from '../../hooks/useCommitGraph'
import { SortableTable, type Column } from '../components/SortableTable'
import { SyncDiffView } from '../../components/sync/SyncDiffView'
import { formatDateTime, historyDetail, historyTitle } from '../../components/sync/historyText'
import { useHistoryPreview, useRemoteHistory, useRestore, useSafetySnapshots } from '../../hooks/useSyncHistory'
import { buildHistoryItems, type HistoryItem } from '../../lib/historyItems'
import { getGitConfig, isGitConfigured } from '../../lib/gitSync'

/** Cronologia, grafo dei commit e ripristino: pagina a parte, per non allungare Sincronizzazione. */
export function DesktopCronologiaScreen() {
  const { t } = useTranslation()
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
  const graph = useCommitGraph()
  const [commitSha, setCommitSha] = useState<string | null>(null)

  const items = buildHistoryItems(remote.data ?? [], local.data ?? [])

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
      <PageHeader
        title={t('syncPage.history')}
        right={
          <button onClick={() => void navigate({ to: '/sincronizzazione' })} style={action}>
            ← {t('syncPage.title')}
          </button>
        }
      />
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

      <div style={{ marginTop: '24px' }}>
        <Card title={t('syncGraph.title')} hint={t('syncGraph.hint')}>
          {!configured && (
            <div style={{ fontSize: '13px', color: 'var(--t-muted)' }}>{t('syncPage.historyNotConfigured')}</div>
          )}
          {configured && graph.query.isPending && (
            <div style={{ fontSize: '13px', color: 'var(--t-muted)' }}>{t('syncGraph.loading')}</div>
          )}
          {graph.query.isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--t-danger)' }}>{t('syncGraph.error')}</span>
              <button onClick={() => void graph.query.refetch()} style={action}>
                {t('syncPage.retry')}
              </button>
            </div>
          )}
          {graph.query.isSuccess && graph.rows.length === 0 && (
            <div style={{ fontSize: '13px', color: 'var(--t-muted)' }}>{t('syncGraph.empty')}</div>
          )}
          {graph.rows.length > 0 && <CommitGraph rows={graph.rows} selected={commitSha} onSelect={setCommitSha} />}
        </Card>
      </div>
      <CommitModal row={graph.rows.find((r) => r.commit.sha === commitSha) ?? null} onClose={() => setCommitSha(null)} />


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
    </div>
  )
}
