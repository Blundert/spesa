import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../components/BackButton'
import { BottomSheet } from '../components/BottomSheet'
import { SyncDiffView } from '../components/sync/SyncDiffView'
import { formatDateTime, historyDetail, historyTitle } from '../components/sync/historyText'
import { useHistoryPreview, useRemoteHistory, useRestore, useSafetySnapshots } from '../hooks/useSyncHistory'
import { buildHistoryItems, type HistoryItem } from '../lib/historyItems'
import { getGitConfig, isGitConfigured } from '../lib/gitSync'

/** Cronologia delle versioni sincronizzate e ripristino: pagina a parte, per non allungare Sincronizzazione. */
export function CronologiaScreen() {
  const { t } = useTranslation()
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

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        <div className="flex items-center gap-2 pt-2 pb-[18px]">
          <BackButton fallback="/sincronizzazione" />
          <span className="text-[26px] font-normal tracking-[-0.5px] text-t-fg">{t('syncPage.history')}</span>
        </div>

        <p className="text-[13px] text-t-muted px-1.5 pb-[13px] leading-relaxed">{t('syncPage.historyHint')}</p>
        {!configured && <p className="text-[13px] text-t-muted px-1.5 pb-3">{t('syncPage.historyNotConfigured')}</p>}
        {configured && remote.isPending && (
          <p className="text-[13px] text-t-muted px-1.5 pb-3">{t('syncPage.historyLoading')}</p>
        )}
        {remote.isError && (
          <div className="flex items-center justify-between gap-3 px-1.5 pb-3">
            <span className="text-[13px] text-t-danger">{t('syncPage.historyError')}</span>
            <button onClick={() => void remote.refetch()} className="text-[13px] text-t-fg underline">
              {t('syncPage.retry')}
            </button>
          </div>
        )}
        {items.length > 0 && (
          <div className="bg-t-surface rounded-[20px] overflow-hidden mb-7">
            {items.map((item, i) => {
              const detail = historyDetail(t, item)
              return (
                <button
                  key={item.key}
                  onClick={() => setSelected(item)}
                  className="w-full text-left px-5 py-[14px] active:bg-t-surface2 transition-colors"
                  style={{ borderBottom: i < items.length - 1 ? '1px solid var(--t-line)' : 'none' }}
                >
                  <div className="text-[15px] text-t-fg">{historyTitle(t, item)}</div>
                  <div className="text-[12px] text-t-muted tabular-nums">{formatDateTime(item.when)}</div>
                  {detail && <div className="text-[12px] text-t-muted truncate">{detail}</div>}
                </button>
              )
            })}
          </div>
        )}
        {items.length === 0 && configured && remote.isSuccess && (
          <p className="text-[13px] text-t-muted px-1.5 pb-7">{t('syncPage.historyEmpty')}</p>
        )}

      </div>

      {/* Dettaglio di una voce: cosa cambierebbe + ripristino */}
      <BottomSheet open={selected !== null} onClose={close}>
        {selected && (
          <>
            <div className="text-[20px] font-normal text-t-fg px-0.5">{historyTitle(t, selected)}</div>
            <div className="text-[13px] text-t-muted px-0.5 pb-3 tabular-nums">{formatDateTime(selected.when)}</div>
            <div className="text-[12px] tracking-[0.4px] text-t-muted uppercase pb-2">{t('syncPage.compareTitle')}</div>
            <div className="max-h-[42vh] overflow-y-auto mb-4">
              {preview.isPending && <p className="text-[13px] text-t-muted">{t('syncPage.previewLoading')}</p>}
              {preview.isError && <p className="text-[13px] text-t-danger">{t('syncPage.previewError')}</p>}
              {preview.data && <SyncDiffView diff={preview.data.diff} />}
            </div>
            {confirming ? (
              <>
                <p className="text-sm text-t-text2 px-0.5 pb-4 leading-relaxed">
                  {selected.selection.source === 'remote'
                    ? t('syncPage.restoreConfirmBodyRepo')
                    : t('syncPage.restoreConfirmBodyLocal')}
                </p>
                <button
                  disabled={!preview.data || restore.isPending}
                  onClick={() =>
                    preview.data &&
                    restore.mutate({
                      data: preview.data.data,
                      via: selected.selection.source === 'remote' ? 'repo' : 'local',
                    })
                  }
                  className="w-full bg-t-accent text-t-on text-[17px] py-[18px] rounded-[20px] mb-2 active:scale-[.98] transition-transform disabled:opacity-50"
                >
                  {t('syncPage.restoreConfirm')}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="w-full bg-t-line5 text-t-fg text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
                >
                  {t('common.cancel')}
                </button>
              </>
            ) : (
              <button
                disabled={!preview.data}
                onClick={() => setConfirming(true)}
                className="w-full bg-t-accent text-t-on text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform disabled:opacity-50"
              >
                {t('syncPage.restore')}
              </button>
            )}
          </>
        )}
      </BottomSheet>

    </>
  )
}
