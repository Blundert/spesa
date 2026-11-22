import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { parseRepoRef, type RepoRef } from '../../lib/sharedList'
import { SharedListError } from '../../lib/sharedLists'
import {
  isGithubConnected,
  useAcceptInvitation,
  useInvitations,
  useJoinSharedList,
} from '../../hooks/useSharedLists'
import { sharedErrorText } from './sharedErrors'

const LABEL = 'text-[12px] font-normal tracking-[1.4px] text-t-muted uppercase px-0.5 pb-2'
const FIELD = 'w-full bg-t-surface text-t-fg text-[15px] rounded-[12px] px-3 py-2.5 outline-none placeholder:text-t-muted'
const BTN = 'px-3.5 py-[9px] rounded-[12px] text-[14px] bg-t-surface text-t-fg active:opacity-60 disabled:opacity-40'
const BTN_ON = 'px-3.5 py-[9px] rounded-[12px] text-[14px] bg-t-accent text-t-on active:opacity-70 disabled:opacity-40'

/**
 * Aggiunge una lista condivisa da altri: gli inviti ricevuti si accettano da qui (senza passare da github.com);
 * se si ha già accesso basta incollare il repository.
 */
export function JoinSharedList({
  onJoined,
  onNavigate,
}: {
  onJoined: (listId: number) => void
  onNavigate: () => void
}) {
  const { t } = useTranslation()
  const connected = isGithubConnected()
  const invitations = useInvitations(connected)
  const accept = useAcceptInvitation()
  const join = useJoinSharedList()
  const [repo, setRepo] = useState('')
  const busy = join.isPending || accept.isPending

  const joinRepo = (ref: RepoRef) =>
    join.mutate(ref, {
      onSuccess: (listId) => {
        toast(t('shared.joined'))
        onJoined(listId)
      },
      onError: (e) => {
        // Già aggiunta: basta aprirla.
        if (e instanceof SharedListError && e.code === 'already-joined' && e.listId !== undefined) onJoined(e.listId)
        else toast.error(sharedErrorText(t, e))
      },
    })

  if (!connected) {
    return (
      <div className="bg-t-surface2 rounded-[18px] px-4 py-3.5 mb-5 flex flex-col items-start gap-2">
        <p className="text-[13px] text-t-muted">{t('shared.notConnected')}</p>
        <Link to="/sincronizzazione" onClick={onNavigate} className={BTN}>
          {t('shared.goConnect')}
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-t-surface2 rounded-[18px] px-4 py-3.5 mb-5 flex flex-col gap-3" data-testid="join-shared">
      <div>
        <div className={LABEL}>{t('shared.joinInvites')}</div>
        {invitations.data?.length === 0 && <p className="text-[13px] text-t-muted">{t('shared.joinNoInvites')}</p>}
        {invitations.data?.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <div className="text-[14px] text-t-fg truncate">
                {inv.owner}/{inv.repo}
              </div>
              <div className="text-[12px] text-t-muted">{t('shared.joinFrom', { user: inv.inviter })}</div>
            </div>
            <button
              className={BTN_ON}
              disabled={busy}
              onClick={() =>
                accept.mutate(inv.id, {
                  onSuccess: () => joinRepo({ owner: inv.owner, repo: inv.repo }),
                  onError: (e) => toast.error(sharedErrorText(t, e)),
                })
              }
            >
              {t('shared.joinAccept')}
            </button>
          </div>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-[12px] text-t-muted">
        {t('shared.joinRepoLabel')}
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder={t('shared.joinRepoPlaceholder')}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className={FIELD}
        />
      </label>
      <button
        className={BTN}
        disabled={busy || !repo.trim()}
        onClick={() => {
          const ref = parseRepoRef(repo)
          if (ref) joinRepo(ref)
          else toast.error(t('shared.joinBadRepo'))
        }}
      >
        {t('shared.joinAdd')}
      </button>
    </div>
  )
}
