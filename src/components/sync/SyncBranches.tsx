import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useBranches, useCreateBranch, useSwitchBranch } from '../../hooks/useBranches'
import { getGitConfig, isGitConfigured } from '../../lib/gitSync'
import { isValidBranchName } from '../../lib/syncBackup'

const BTN = 'px-3 py-[7px] rounded-[10px] text-[13px] bg-t-surface2 text-t-fg active:opacity-60 disabled:opacity-50'

/**
 * Branch del repository: elenco, creazione dal punto attuale, passaggio (con backup del locale) e unione di un
 * branch in quello attivo. Le conferme sono in riga, così lo stesso componente va bene su mobile e desktop.
 */
export function SyncBranches({ onSwitched }: { onSwitched: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const configured = isGitConfigured(getGitConfig())
  const current = getGitConfig().branch
  const branches = useBranches()
  const [name, setName] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const create = useCreateBranch(() => setName(''))
  const change = useSwitchBranch(() => {
    setConfirming(null)
    onSwitched()
  })
  const trimmed = name.trim()

  if (!configured) {
    return <p className="text-[13px] text-t-muted">{t('syncPage.historyNotConfigured')}</p>
  }
  return (
    <div data-testid="sync-branches">
      {branches.isPending && <p className="text-[13px] text-t-muted">{t('syncBranches.loading')}</p>}
      {branches.isError && (
        <div className="flex items-center justify-between gap-3 pb-2">
          <span className="text-[13px] text-t-danger">{t('syncBranches.error')}</span>
          <button className={BTN} onClick={() => void branches.refetch()}>
            {t('syncPage.retry')}
          </button>
        </div>
      )}
      <ul className="divide-y" style={{ borderColor: 'var(--t-line)' }}>
        {(branches.data ?? []).map((b) => (
          <li key={b} className="py-2.5" style={{ borderColor: 'var(--t-line)' }}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] text-t-fg truncate">
                {b}
                {b === current && <span className="ml-2 text-[12px] text-t-muted">· {t('syncBranches.active')}</span>}
              </span>
              {b !== current && (
                <span className="flex gap-1.5 flex-none">
                  <button className={BTN} disabled={change.isPending} onClick={() => setConfirming(b)}>
                    {t('syncBranches.switch')}
                  </button>
                  <button
                    className={BTN}
                    onClick={() => void navigate({ to: '/sincronizzazione/unisci', search: { from: b } })}
                  >
                    {t('syncBranches.mergeHere')}
                  </button>
                </span>
              )}
            </div>
            {confirming === b && (
              <div className="mt-2 rounded-[12px] bg-t-surface2 px-3.5 py-3">
                <p className="text-[13px] text-t-text2 leading-relaxed">{t('syncBranches.switchConfirm', { name: b })}</p>
                <div className="mt-2.5 flex gap-1.5">
                  <button
                    className="px-3 py-[7px] rounded-[10px] text-[13px] bg-t-accent text-t-on disabled:opacity-50"
                    disabled={change.isPending}
                    onClick={() => change.mutate(b)}
                  >
                    {t('syncBranches.switchDo')}
                  </button>
                  <button className={BTN} onClick={() => setConfirming(null)}>
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('syncBranches.newPlaceholder')}
          aria-label={t('syncBranches.newPlaceholder')}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-[10px] px-3 py-2 text-[14px] text-t-fg bg-t-surface2 placeholder:text-t-faint outline-none"
        />
        <button
          className={BTN}
          disabled={create.isPending || !isValidBranchName(trimmed)}
          onClick={() => create.mutate(trimmed)}
        >
          {t('syncBranches.create')}
        </button>
      </div>
      {trimmed !== '' && !isValidBranchName(trimmed) && (
        <p className="mt-1.5 text-[12px] text-t-danger">{t('syncBranches.invalid')}</p>
      )}
    </div>
  )
}
