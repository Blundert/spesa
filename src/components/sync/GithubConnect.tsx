import { useTranslation } from 'react-i18next'
import type { useGitSyncSettings } from '../../hooks/useGitSyncSettings'
import { CLASSIC_TOKEN_URL, fullName } from '../../lib/githubAccount'

const BTN =
  'px-3 py-[9px] rounded-[10px] text-[13px] bg-t-surface text-t-fg active:opacity-60 disabled:opacity-50 text-center'

/**
 * "Collega GitHub": guida in tre passi, link al token già compilato, incolla dagli appunti, verifica
 * (chi sei) e scelta del repo dei backup da un elenco. Stessa grafica su mobile e desktop.
 */
export function GithubConnect({ s }: { s: ReturnType<typeof useGitSyncSettings> }) {
  const { t } = useTranslation()
  const { conn, git } = s
  const writable = conn.repos.filter((r) => r.canPush)
  const current = git.owner && git.repo ? `${git.owner}/${git.repo}` : ''

  return (
    <div data-testid="github-connect" className="bg-t-surface2 rounded-[20px] px-5 py-4 mb-3">
      <div className="text-[12px] font-normal tracking-[0.4px] text-t-muted uppercase pb-2.5">{t('githubConnect.title')}</div>
      <ol className="space-y-2 pb-3">
        {[t('githubConnect.step1'), t('githubConnect.step2'), t('githubConnect.step3')].map((step, i) => (
          <li key={i} className="flex gap-2.5 text-[13px] text-t-text2 leading-relaxed">
            <span className="flex-none w-[18px] h-[18px] mt-px rounded-full bg-t-line8 text-[11px] flex items-center justify-center tabular-nums">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <a href={CLASSIC_TOKEN_URL} target="_blank" rel="noopener noreferrer" className={BTN}>
          {t('githubConnect.create')} ↗
        </a>
        <button className={BTN} disabled={conn.status === 'checking'} onClick={() => void s.pasteToken()}>
          {t('githubConnect.paste')}
        </button>
      </div>

      {conn.status === 'checking' && <p className="text-[13px] text-t-muted pt-3">{t('githubConnect.checking')}</p>}
      {conn.status === 'error' && (
        <p className="text-[13px] text-t-danger pt-3">
          {t(conn.error === 'invalid' ? 'githubConnect.invalid' : 'githubConnect.failed')}
        </p>
      )}
      {conn.status === 'ok' && (
        <div className="pt-3">
          <p className="text-[13px] text-t-fg pb-2">{t('githubConnect.connected', { login: conn.login })}</p>
          <label className="flex flex-col gap-1 text-[12px] text-t-muted">
            {t('githubConnect.repoLabel')}
            <select
              value={current}
              onChange={(e) => {
                const r = writable.find((x) => fullName(x) === e.target.value)
                if (r) s.pickRepo(r.owner, r.repo)
              }}
              className="w-full bg-t-surface text-t-fg text-[14px] rounded-[10px] px-3 py-2 outline-none"
            >
              {!writable.some((r) => fullName(r) === current) && <option value="">{t('githubConnect.repoPlaceholder')}</option>}
              {writable.map((r) => (
                <option key={fullName(r)} value={fullName(r)}>
                  {fullName(r)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <p className="text-[12px] text-t-muted pt-3 leading-relaxed">{t('githubConnect.warning')}</p>
    </div>
  )
}
