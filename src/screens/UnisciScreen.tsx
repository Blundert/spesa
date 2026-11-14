import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../components/BackButton'
import { BottomSheet } from '../components/BottomSheet'
import { MergeGroupList } from '../components/sync/MergeGroupList'
import { SyncDiffView } from '../components/sync/SyncDiffView'
import { useMerge, type QuickMode } from '../hooks/useMerge'

const QUICK: Array<{ mode: QuickMode; key: string }> = [
  { mode: 'union', key: 'syncMerge.quickUnion' },
  { mode: 'local', key: 'syncMerge.quickLocal' },
  { mode: 'remote', key: 'syncMerge.quickRemote' },
]

export function UnisciScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { from } = useSearch({ strict: false }) as { from?: string }
  const [confirming, setConfirming] = useState(false)
  const m = useMerge(() => {
    setConfirming(false)
    void navigate({ to: '/sincronizzazione', replace: true })
  }, from)

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        <div className="flex items-center gap-2 pt-2 pb-[18px]">
          <BackButton fallback="/sincronizzazione" />
          <span className="text-[26px] font-normal tracking-[-0.5px] text-t-fg">{t('syncMerge.title')}</span>
        </div>

        {m.data.isPending && <p className="text-[13px] text-t-muted px-1.5">{t('syncMerge.loading')}</p>}
        {m.data.isError && (
          <p className="text-[13px] text-t-danger px-1.5">
            {t('syncMerge.error')}: {m.data.error instanceof Error ? m.data.error.message : ''}
          </p>
        )}
        {m.data.isSuccess && m.plan.length === 0 && (
          <p className="text-[14px] text-t-text2 px-1.5 leading-relaxed">{t('syncMerge.identical')}</p>
        )}
        {m.data.isSuccess && m.plan.length > 0 && (
          <>
            {from && <p className="text-[14px] text-t-fg px-1.5 pb-1.5">{t('syncBranches.mergeFrom', { name: from })}</p>}
            <p className="text-[13px] text-t-muted px-1.5 pb-3 leading-relaxed">{t('syncMerge.intro')}</p>
            <div className="flex gap-1.5 pb-5">
              {QUICK.map((q) => (
                <button
                  key={q.mode}
                  onClick={() => m.setAll(q.mode)}
                  className="flex-1 bg-t-surface rounded-[14px] px-2 py-[11px] text-[13px] text-t-fg active:bg-t-surface2 transition-colors"
                >
                  {t(q.key)}
                </button>
              ))}
            </div>
            <MergeGroupList plan={m.plan} choices={m.choices} onChoice={m.setChoice} />

            <div className="text-[12px] tracking-[1.2px] text-t-muted uppercase px-1.5 pb-2.5">
              {t('syncMerge.resultTitle')}
            </div>
            {m.result?.error && <p className="text-[13px] text-t-danger px-1.5 pb-3">{m.result.error}</p>}
            {m.result?.diffLocal && m.result.diffRemote && (
              <div className="bg-t-surface rounded-[20px] px-5 py-4 mb-4 space-y-4">
                <div>
                  <div className="text-[12px] tracking-[0.4px] text-t-muted uppercase pb-2">
                    {t('syncMerge.resultLocal')}
                  </div>
                  <SyncDiffView diff={m.result.diffLocal} />
                </div>
                <div>
                  <div className="text-[12px] tracking-[0.4px] text-t-muted uppercase pb-2">
                    {t('syncMerge.resultRemote')}
                  </div>
                  <SyncDiffView diff={m.result.diffRemote} />
                </div>
              </div>
            )}
            <button
              disabled={!m.result?.merged}
              onClick={() => setConfirming(true)}
              className="w-full bg-t-accent text-t-on rounded-[20px] px-5 py-[17px] text-base active:scale-[.99] transition-transform disabled:opacity-50"
            >
              {t('syncMerge.apply')}
            </button>
          </>
        )}
      </div>

      <BottomSheet open={confirming} onClose={() => setConfirming(false)}>
        <div className="text-[20px] font-normal text-t-fg px-0.5 pb-2">{t('syncMerge.applyConfirmTitle')}</div>
        <p className="text-sm text-t-text2 px-0.5 pb-4 leading-relaxed">{t('syncMerge.applyConfirmBody')}</p>
        <button
          disabled={m.apply.isPending}
          onClick={() => m.apply.mutate()}
          className="w-full bg-t-accent text-t-on text-[17px] py-[18px] rounded-[20px] mb-2 active:scale-[.98] transition-transform disabled:opacity-50"
        >
          {t('syncMerge.apply')}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="w-full bg-t-line5 text-t-fg text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>
    </>
  )
}
