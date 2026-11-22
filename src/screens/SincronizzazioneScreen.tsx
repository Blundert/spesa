import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../components/BackButton'
import { BottomSheet } from '../components/BottomSheet'
import { GithubConnect } from '../components/sync/GithubConnect'
import { SyncGuide } from '../components/sync/SyncGuide'
import { SyncBranches } from '../components/sync/SyncBranches'
import { useGitSyncSettings } from '../hooks/useGitSyncSettings'
import { getGitConfig, isGitConfigured } from '../lib/gitSync'

const SECTION_LABEL = 'text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pb-[13px]'

export function SincronizzazioneScreen() {
  const { t } = useTranslation()
  const s = useGitSyncSettings()
  const navigate = useNavigate()
  const configured = isGitConfigured(getGitConfig())

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
        <GithubConnect s={s} />
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

        {/* Cronologia: su una pagina a parte, così Sincronizzazione non è lunghissima */}
        <button
          onClick={() => void navigate({ to: '/sincronizzazione/cronologia' })}
          className="w-full flex items-center justify-between bg-t-surface rounded-[20px] px-5 py-[17px] mb-7 text-left active:bg-t-surface2 transition-colors"
        >
          <span className="text-base text-t-fg">{t('syncPage.historyOpen')}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t-chev)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        {/* Guida */}
        <div className={SECTION_LABEL}>{t('syncPage.guide')}</div>
        <SyncGuide />
      </div>

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
