import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { ShoppingList, SharedMember } from '../../db/types'
import { defaultRepoName, isValidRepoName } from '../../lib/sharedLists'
import {
  isGithubConnected,
  useInviteToList,
  useSetMember,
  useShareList,
  useSyncSharedNow,
  useUnlinkList,
} from '../../hooks/useSharedLists'
import { sharedErrorText } from './sharedErrors'

const LABEL = 'text-[12px] font-normal tracking-[1.4px] text-t-muted uppercase px-0.5 pb-2'
const FIELD = 'w-full bg-t-surface text-t-fg text-[15px] rounded-[12px] px-3 py-2.5 outline-none placeholder:text-t-muted'
const BTN = 'px-3.5 py-[9px] rounded-[12px] text-[14px] bg-t-surface text-t-fg active:opacity-60 disabled:opacity-40'
/**
 * Si invita sempre con il permesso di scrittura: l'app crea i repo nell'account di chi condivide e GitHub, sui repo di
 * un account personale, non ammette collaboratori in sola lettura (risponde 422). La sola lettura resta per chi
 * riceve un invito in sola lettura da un repo di un'organizzazione.
 */
const INVITE_PERMISSION = 'push' as const
const BTN_ON = 'px-3.5 py-[9px] rounded-[12px] text-[14px] bg-t-accent text-t-on active:opacity-70 disabled:opacity-40'

function MemberRow({ listId, login, member }: { listId: number; login: string; member: SharedMember }) {
  const { t } = useTranslation()
  const setMember = useSetMember()
  const [label, setLabel] = useState(member.label)
  const fail = (e: unknown) => toast.error(sharedErrorText(t, e))
  return (
    <div className="flex flex-col gap-1.5 py-2.5" data-testid={`member-${login}`}>
      <div className="text-[12px] text-t-muted">@{login}</div>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => {
          const next = label.trim()
          if (next !== member.label) setMember.mutate({ listId, login, patch: { label: next } }, { onError: fail })
        }}
        placeholder={t('shared.namePlaceholder')}
        maxLength={40}
        className={FIELD}
      />
      <div className="flex gap-2">
        {(['partner', 'stranger'] as const).map((kind) => (
          <button
            key={kind}
            aria-pressed={member.kind === kind}
            onClick={() => member.kind !== kind && setMember.mutate({ listId, login, patch: { kind } }, { onError: fail })}
            className={member.kind === kind ? BTN_ON : BTN}
          >
            {kind === 'partner' ? t('shared.kindPartner') : t('shared.kindStranger')}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Condivisione di una lista esistente (dentro la scheda di modifica, su mobile e desktop): condividerla con altre
 * persone se non lo è ancora; se lo è, chi la usa, nome e tipo (partner o estraneo), inviti, aggiornamento e uscita.
 */
export function ShareSection({ list, onNavigate }: { list: ShoppingList; onNavigate: () => void }) {
  const { t } = useTranslation()
  const link = list.shared
  const listId = list.id as number
  const connected = isGithubConnected()
  const [open, setOpen] = useState(false)
  const [repoName, setRepoName] = useState(() => defaultRepoName(list.name))
  const [invite, setInvite] = useState('')
  const [confirmUnlink, setConfirmUnlink] = useState(false)
  const share = useShareList()
  const inviteMore = useInviteToList()
  const unlink = useUnlinkList()
  const refresh = useSyncSharedNow()
  const fail = (e: unknown) => toast.error(sharedErrorText(t, e))

  const doShare = () => {
    const username = invite.trim().replace(/^@/, '')
    share.mutate(
      { listId, repoName: repoName.trim(), invite: username ? { username, permission: INVITE_PERMISSION } : undefined },
      {
        onSuccess: (r) => {
          if (r.pending) toast(t('shared.sharedPending'))
          else if (r.invite === 'invited') toast(t('shared.sharedInvited', { user: username }))
          else if (r.invite === 'already') toast(t('shared.sharedAlready', { user: username }))
          else if (r.invite === 'failed') toast.error(t('shared.sharedInviteFailed'))
          else toast(t('shared.sharedOnly'))
          setInvite('')
          setOpen(false)
        },
        onError: fail,
      },
    )
  }

  let body
  if (!link) {
    if (!connected) {
      body = (
        <div className="flex flex-col items-start gap-2">
          <p className="text-[13px] text-t-muted">{t('shared.notConnected')}</p>
          <Link to="/sincronizzazione" onClick={onNavigate} className={BTN}>
            {t('shared.goConnect')}
          </Link>
        </div>
      )
    } else if (!open) {
      body = (
        <button onClick={() => setOpen(true)} className={BTN}>
          {t('shared.start')}
        </button>
      )
    } else {
      body = (
        <div className="flex flex-col gap-2.5">
          <label className="flex flex-col gap-1 text-[12px] text-t-muted">
            {t('shared.repoName')}
            <input
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className={FIELD}
            />
          </label>
          <p className="text-[12px] text-t-muted">{t('shared.repoNameHint')}</p>
          <label className="flex flex-col gap-1 text-[12px] text-t-muted">
            {t('shared.invite')}
            <input
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              placeholder="@"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className={FIELD}
            />
          </label>
          <button onClick={doShare} disabled={share.isPending || !isValidRepoName(repoName.trim())} className={BTN_ON}>
            {share.isPending ? t('shared.sharing') : t('shared.shareNow')}
          </button>
        </div>
      )
    }
  } else {
    const logins = Object.keys(link.members).sort()
    const iAmOwner = link.owner === link.me
    body = (
      <div className="flex flex-col gap-3">
        <div className="text-[14px] text-t-fg break-all">{t('shared.linkedTo', { repo: `${link.owner}/${link.repo}` })}</div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-t-muted">{link.canWrite ? t('shared.canEdit') : t('shared.readOnly')}</span>
          <button
            className={BTN}
            disabled={refresh.isPending}
            onClick={() =>
              refresh.mutate(listId, { onSuccess: () => toast(t('shared.refreshed')), onError: fail })
            }
          >
            {refresh.isPending ? t('shared.refreshing') : t('shared.refresh')}
          </button>
        </div>

        <div>
          <div className={LABEL}>{t('shared.people')}</div>
          {logins.length === 0 && <p className="text-[13px] text-t-muted">{t('shared.noPeople')}</p>}
          {logins.map((login) => (
            <MemberRow key={login} listId={listId} login={login} member={link.members[login]} />
          ))}
          {logins.length > 0 && <p className="text-[12px] text-t-muted pt-1">{t('shared.kindHint')}</p>}
        </div>

        {iAmOwner && (
          <div className="flex flex-col gap-2">
            <div className={LABEL}>{t('shared.inviteAnother')}</div>
            <input
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              placeholder={t('shared.inviteUser')}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className={FIELD}
            />
            <button
              className={BTN}
              disabled={!invite.trim() || inviteMore.isPending}
              onClick={() => {
                const username = invite.trim().replace(/^@/, '')
                inviteMore.mutate(
                  { listId, username, permission: INVITE_PERMISSION },
                  {
                    onSuccess: (r) => {
                      toast(t(r === 'invited' ? 'shared.inviteSent' : 'shared.inviteAlready', { user: username }))
                      setInvite('')
                    },
                    onError: fail,
                  },
                )
              }}
            >
              {t('shared.inviteSend')}
            </button>
          </div>
        )}

        {confirmUnlink ? (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] text-t-muted">{t('shared.unlinkBody')}</p>
            <button
              className="px-3.5 py-[9px] rounded-[12px] text-[14px] bg-t-danger text-t-on active:opacity-70"
              onClick={() =>
                unlink.mutate(listId, {
                  onSuccess: () => {
                    toast(t('shared.unlinked'))
                    setConfirmUnlink(false)
                  },
                  onError: fail,
                })
              }
            >
              {t('shared.unlinkConfirm')}
            </button>
            <button className={BTN} onClick={() => setConfirmUnlink(false)}>
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <button className={BTN} onClick={() => setConfirmUnlink(true)}>
            {t('shared.unlink')}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-t-surface2 rounded-[18px] px-4 py-3.5 mb-5" data-testid="share-section">
      <div className={LABEL}>{t('shared.sectionTitle')}</div>
      {body}
    </div>
  )
}
