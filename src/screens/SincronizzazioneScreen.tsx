import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../components/BackButton'
import { BottomSheet } from '../components/BottomSheet'
import { SyncDiffView } from '../components/sync/SyncDiffView'
import { SyncGuide } from '../components/sync/SyncGuide'
import { SyncBranches } from '../components/sync/SyncBranches'
import { formatDateTime, historyDetail, historyTitle } from '../components/sync/historyText'
import { useGitSyncSettings } from '../hooks/useGitSyncSettings'
import { useHistoryPreview, useRemoteHistory, useRestore, useSafetySnapshots } from '../hooks/useSyncHistory'
import { buildHistoryItems, type HistoryItem } from '../lib/historyItems'
import { getGitConfig, isGitConfigured } from '../lib/gitSync'

const SECTION_LABEL = 'text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pb-[13px]'

export function SincronizzazioneScreen() {
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

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        <div className="flex items-center gap-2 pt-2 pb-[18px]">
          <BackButton />
          <span className="text-[26px] font-normal tracking-[-0.5px] text-t-fg">{t('syncPage.title')}</span>
        </div>

        {/* Collegamento */}
        <div className={SECTION_LABEL}>{t('syncPage.config')}</div>
        <p className="text-[13px] text-t-muted px-1.5 pb-[13px] leading-relaxed">{t('settings.syncHint')}</p>
        <a
          href="https://github.com/settings/personal-access-tokens/new"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between bg-t-surface rounded-[20px] px-5 py-[17px] mb-3 active:bg-t-surface2 transition-colors text-left"
        >
          <span className="text-base text-t-fg">{t('settings.syncCreateToken')}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 5h5v5M19 5l-8 8M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
          </svg>
        </a>
        <div className="bg-t-surface2 rounded-[20px] px-5 py-4 mb-3">
          <div className="text-[12px] font-normal tracking-[0.4px] text-t-muted uppercase pb-2.5">
            {t('settings.syncStepsTitle')}
          </div>
          <ol className="space-y-2">
            {[t('settings.syncStep1'), t('settings.syncStep2'), t('settings.syncStep3'), t('settings.syncStep4')].map(
              (step, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-t-text2 leading-relaxed">
                  <span className="flex-none w-[18px] h-[18px] mt-px rounded-full bg-t-line8 text-[11px] flex items-center justify-center tabular-nums">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ),
            )}
          </ol>
        </div>
        <div className="bg-t-surface rounded-[20px] overflow-hidden mb-3">
          {(
            [
              { f: 'token', ph: t('settings.syncToken'), type: 'password' },
              { f: 'owner', ph: t('settings.syncOwner'), type: 'text' },
              { f: 'repo', ph: t('settings.syncRepo'), type: 'text' },
              { f: 'branch', ph: t('settings.syncBranch'), type: 'text' },
              { f: 'path', ph: t('settings.syncPath'), type: 'text' },
            ] as const
          ).map((row, i, arr) => (
            <input
              key={row.f}
              type={row.type}
              value={s.git[row.f]}
              onChange={(e) => s.setGitField(row.f, e.target.value)}
              placeholder={row.ph}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full px-5 py-[15px] text-base text-t-fg placeholder:text-t-faint bg-transparent outline-none"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--t-line)' : 'none' }}
            />
          ))}
        </div>
        <button
          onClick={s.save}
          className="w-full bg-t-surface rounded-[20px] px-5 py-[17px] mb-3 text-left text-base text-t-fg active:bg-t-surface2 transition-colors"
        >
          {t('settings.syncSave')}
        </button>
        <button
          onClick={s.forgetToken}
          disabled={!s.git.token}
          className="w-full bg-t-surface rounded-[20px] px-5 py-[17px] mb-3 text-left text-base text-t-fg active:bg-t-surface2 transition-colors disabled:opacity-50"
        >
          {t('settings.syncForgetToken')}
        </button>
        <button
          onClick={s.toggleAuto}
          className="w-full flex items-center justify-between bg-t-surface rounded-[20px] px-5 py-[17px] mb-3 active:bg-t-surface2 transition-colors text-left"
        >
          <span className="text-base text-t-fg">{t('settings.syncAuto')}</span>
          <span
            className={`relative w-[46px] h-[28px] rounded-full transition-colors flex-none ${s.auto ? 'bg-t-accent' : 'bg-t-line2'}`}
          >
            <span
              className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-t-surface transition-all ${s.auto ? 'left-[21px]' : 'left-[3px]'}`}
            />
          </span>
        </button>
        <button
          onClick={() => void s.syncNow()}
          disabled={s.syncing}
          className="w-full bg-t-accent text-t-on rounded-[20px] px-5 py-[17px] mb-2.5 text-base active:scale-[.99] transition-transform disabled:opacity-50"
        >
          {t('settings.syncNow')}
        </button>
        <button
          onClick={() => void navigate({ to: '/sincronizzazione/unisci' })}
          disabled={s.syncing || !configured}
          className="w-full bg-t-surface rounded-[20px] px-5 py-[17px] mb-2.5 text-base text-t-fg active:bg-t-surface2 transition-colors disabled:opacity-50"
        >
          {t('syncMerge.open')}
        </button>
        <button
          onClick={() => s.setShowPull(true)}
          disabled={s.syncing}
          className="w-full bg-t-surface rounded-[20px] px-5 py-[17px] mb-7 text-base text-t-fg active:bg-t-surface2 transition-colors disabled:opacity-50"
        >
          {t('settings.syncPull')}
        </button>

        {/* Branch */}
        <div className={SECTION_LABEL}>{t('syncBranches.title')}</div>
        <p className="text-[13px] text-t-muted px-1.5 pb-[13px] leading-relaxed">{t('syncBranches.hint')}</p>
        <div className="bg-t-surface rounded-[20px] px-5 py-3 mb-7">
          <SyncBranches onSwitched={s.refresh} />
        </div>

        {/* Cronologia */}
        <div className={SECTION_LABEL}>{t('syncPage.history')}</div>
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

        {/* Guida */}
        <div className={SECTION_LABEL}>{t('syncPage.guide')}</div>
        <SyncGuide />
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

      {/* Conferma "Scarica da remoto" */}
      <BottomSheet open={s.showPull} onClose={() => s.setShowPull(false)}>
        <div className="text-[20px] font-normal text-t-fg px-0.5 pb-2">{t('settings.syncPullConfirmTitle')}</div>
        <p className="text-sm text-t-text2 px-0.5 pb-4 leading-relaxed">{t('settings.syncPullConfirmBody')}</p>
        <button
          onClick={() => void s.pull()}
          className="w-full bg-t-accent text-t-on text-[17px] py-[18px] rounded-[20px] mb-2 active:scale-[.98] transition-transform"
        >
          {t('settings.syncPullConfirm')}
        </button>
        <button
          onClick={() => s.setShowPull(false)}
          className="w-full bg-t-line5 text-t-fg text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>
    </>
  )
}
