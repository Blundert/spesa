import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { Card, ModalActions } from '../components/settingsUi'
import { action, primary } from '../components/settingsStyles'
import { Modal } from '../components/Modal'
import { MergeGroupList } from '../../components/sync/MergeGroupList'
import { SyncDiffView } from '../../components/sync/SyncDiffView'
import { useMerge, type QuickMode } from '../../hooks/useMerge'

const QUICK: Array<{ mode: QuickMode; key: string }> = [
  { mode: 'union', key: 'syncMerge.quickUnion' },
  { mode: 'local', key: 'syncMerge.quickLocal' },
  { mode: 'remote', key: 'syncMerge.quickRemote' },
]

export function DesktopUnisciScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const m = useMerge(() => {
    setConfirming(false)
    void navigate({ to: '/sincronizzazione', replace: true })
  })

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <PageHeader
        title={t('syncMerge.title')}
        subtitle={t('syncMerge.intro')}
        right={
          <button onClick={() => void navigate({ to: '/sincronizzazione' })} style={action}>
            {t('common.back')}
          </button>
        }
      />
      {m.data.isPending && <p style={{ fontSize: '13px', color: 'var(--t-muted)' }}>{t('syncMerge.loading')}</p>}
      {m.data.isError && (
        <p style={{ fontSize: '13px', color: 'var(--t-danger)' }}>
          {t('syncMerge.error')}: {m.data.error instanceof Error ? m.data.error.message : ''}
        </p>
      )}
      {m.data.isSuccess && m.plan.length === 0 && (
        <p style={{ fontSize: '14px', color: 'var(--t-text2)' }}>{t('syncMerge.identical')}</p>
      )}
      {m.data.isSuccess && m.plan.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {QUICK.map((q) => (
                <button key={q.mode} onClick={() => m.setAll(q.mode)} style={action}>
                  {t(q.key)}
                </button>
              ))}
            </div>
            <MergeGroupList plan={m.plan} choices={m.choices} onChoice={m.setChoice} />
          </div>
          <div style={{ position: 'sticky', top: '24px' }}>
            <Card title={t('syncMerge.resultTitle')}>
              {m.result?.error && <p style={{ fontSize: '13px', color: 'var(--t-danger)', marginTop: 0 }}>{m.result.error}</p>}
              {m.result?.diffLocal && m.result.diffRemote && (
                <>
                  <SectionTitle>{t('syncMerge.resultLocal')}</SectionTitle>
                  <SyncDiffView diff={m.result.diffLocal} />
                  <div style={{ height: '20px' }} />
                  <SectionTitle>{t('syncMerge.resultRemote')}</SectionTitle>
                  <SyncDiffView diff={m.result.diffRemote} />
                </>
              )}
              <div style={{ marginTop: '20px' }}>
                <button
                  disabled={!m.result?.merged}
                  onClick={() => setConfirming(true)}
                  style={{ ...primary, opacity: m.result?.merged ? 1 : 0.5 }}
                >
                  {t('syncMerge.apply')}
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      <Modal open={confirming} onClose={() => setConfirming(false)} title={t('syncMerge.applyConfirmTitle')}>
        <p style={{ fontSize: '14px', color: 'var(--t-text2)', lineHeight: 1.5, margin: 0 }}>{t('syncMerge.applyConfirmBody')}</p>
        <ModalActions>
          <button onClick={() => setConfirming(false)} style={action}>
            {t('common.cancel')}
          </button>
          <button disabled={m.apply.isPending} onClick={() => m.apply.mutate()} style={{ ...primary, opacity: m.apply.isPending ? 0.5 : 1 }}>
            {t('syncMerge.apply')}
          </button>
        </ModalActions>
      </Modal>
    </div>
  )
}
