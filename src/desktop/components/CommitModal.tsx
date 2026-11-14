import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GraphRow } from '../../lib/commitGraph'
import { useCommitDiff, type CompareMode } from '../../hooks/useCommitGraph'
import { useRestore } from '../../hooks/useSyncHistory'
import { SideBySideDiff } from '../../components/sync/SideBySideDiff'
import { Modal } from './Modal'
import { ModalActions } from './settingsUi'
import { action, primary } from './settingsStyles'

/** Dettaglio di un commit del grafo: diff affiancato (rispetto al precedente o ai dati di adesso) e ripristino. */
export function CommitModal({ row, onClose }: { row: GraphRow | null; onClose: () => void }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<CompareMode>('parent')
  const [confirming, setConfirming] = useState(false)
  const close = () => {
    setConfirming(false)
    onClose()
  }
  const sha = row?.commit.sha ?? null
  const diff = useCommitDiff(sha, row?.commit.parents[0], mode)
  const restore = useRestore(close)

  return (
    <Modal open={row !== null} onClose={close} title={row?.commit.message} width={820}>
      {row && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--t-muted)', fontFamily: 'ui-monospace, monospace' }}>
              {row.commit.sha.slice(0, 7)}
            </span>
            <label style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--t-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {t('syncGraph.compareWith')}
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as CompareMode)}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--t-line2)', background: 'var(--t-surface)', color: 'var(--t-fg)', fontSize: '13px' }}
              >
                <option value="parent">{t('syncGraph.vsParent')}</option>
                <option value="local">{t('syncGraph.vsLocal')}</option>
              </select>
            </label>
          </div>
          <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
            {diff.isPending && <p style={{ fontSize: '13px', color: 'var(--t-muted)', margin: 0 }}>{t('syncGraph.loadingDiff')}</p>}
            {diff.isError && <p style={{ fontSize: '13px', color: 'var(--t-danger)', margin: 0 }}>{t('syncGraph.diffError')}</p>}
            {diff.data && (
              <SideBySideDiff
                diff={diff.data.diff}
                leftLabel={mode === 'parent' ? t('syncGraph.before') : t('syncGraph.now')}
                rightLabel={mode === 'parent' ? t('syncGraph.after') : t('syncGraph.thisCommit')}
              />
            )}
          </div>
          {confirming && (
            <p style={{ fontSize: '14px', color: 'var(--t-text2)', lineHeight: 1.5, margin: '16px 0 0' }}>
              {t('syncPage.restoreConfirmBodyRepo')}
            </p>
          )}
          <ModalActions>
            <button onClick={confirming ? () => setConfirming(false) : close} style={action}>
              {t('common.cancel')}
            </button>
            {confirming ? (
              <button
                disabled={!diff.data || restore.isPending}
                onClick={() => diff.data && restore.mutate({ data: diff.data.data, via: 'repo' })}
                style={{ ...primary, opacity: !diff.data || restore.isPending ? 0.5 : 1 }}
              >
                {t('syncPage.restoreConfirm')}
              </button>
            ) : (
              <button disabled={!diff.data} onClick={() => setConfirming(true)} style={{ ...primary, opacity: diff.data ? 1 : 0.5 }}>
                {t('syncGraph.restore')}
              </button>
            )}
          </ModalActions>
        </>
      )}
    </Modal>
  )
}
