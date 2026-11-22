import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { acceptInvitation, listInvitations, type SharePermission } from '../lib/githubRepos'
import { getGitConfig } from '../lib/gitSync'
import type { RepoRef } from '../lib/sharedList'
import type { ActiveShopping, SharedMember } from '../db/types'
import { db } from '../db/db'
import { createSession } from '../db/repositories/sessions'
import { upsertSupermarket } from '../db/repositories/supermarkets'
import { currentWeek } from '../lib/date'
import { qk } from '../db/queryKeys'
import { inviteToList, joinSharedList, setMember, shareList, unlinkSharedList } from '../lib/sharedLists'
import { syncSharedList } from '../lib/sharedSync'

/** Dopo un cambio a una lista condivisa si ricaricano le liste e le loro voci. */
function useRefreshLists() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: qk.shoppingLists() })
    void qc.invalidateQueries({ queryKey: qk.listItems() })
    void qc.invalidateQueries({ queryKey: qk.items() })
  }
}

/** C'è un token GitHub salvato? (Il login, se manca, si ricava da GitHub quando serve.) */
export function isGithubConnected(): boolean {
  return getGitConfig().token !== ''
}

export function useShareList() {
  const refresh = useRefreshLists()
  return useMutation({
    mutationFn: ({ listId, repoName, invite }: {
      listId: number
      repoName: string
      invite?: { username: string; permission: SharePermission }
    }) => shareList(listId, { repoName, invite }),
    onSuccess: refresh,
  })
}

export function useInviteToList() {
  return useMutation({
    mutationFn: ({ listId, username, permission }: { listId: number; username: string; permission: SharePermission }) =>
      inviteToList(listId, username, permission),
  })
}

export function useJoinSharedList() {
  const refresh = useRefreshLists()
  return useMutation({ mutationFn: (ref: RepoRef) => joinSharedList(ref), onSuccess: refresh })
}

export function useUnlinkList() {
  const refresh = useRefreshLists()
  return useMutation({ mutationFn: (listId: number) => unlinkSharedList(listId), onSuccess: refresh })
}

export function useSetMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, login, patch }: { listId: number; login: string; patch: Partial<SharedMember> }) =>
      setMember(listId, login, patch),
    // Partner o estraneo cambia cosa conta nel budget e nelle statistiche: si ricarica tutto.
    onSuccess: () => void qc.invalidateQueries(),
  })
}

/** Sincronizza ora una lista condivisa (bottone "Aggiorna ora"). */
export function useSyncSharedNow() {
  const refresh = useRefreshLists()
  return useMutation({ mutationFn: (listId: number) => syncSharedList(listId), onSuccess: refresh })
}

/** Inviti a repo che aspettano di essere accettati. */
export function useInvitations(enabled: boolean) {
  return useQuery({
    queryKey: ['github-invitations'],
    queryFn: () => listInvitations(getGitConfig().token),
    enabled,
    retry: false,
  })
}

export function useAcceptInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => acceptInvitation(getGitConfig().token, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['github-invitations'] }),
  })
}

/**
 * Unirsi alla spesa che un'altra persona ha iniziato su una lista condivisa: si parte con le sue impostazioni
 * (negozio, buoni e valore del buono). Se ho già una spesa in corso si riprende quella.
 */
export function useJoinShopping() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  return async (entry: ActiveShopping, listId: number) => {
    const week = currentWeek()
    const unfinished = (await db.sessions.where('isoWeek').equals(week).toArray()).some((s) => s.finishedAt === null)
    if (!unfinished) {
      const supermarketId = await upsertSupermarket(entry.supermarketName)
      await createSession(week, supermarketId, entry.buoniSpent, entry.buoniValueCents, listId)
      await qc.invalidateQueries()
    }
    void navigate({ to: '/spesa', search: { buoni: entry.buoniSpent, val: entry.buoniValueCents, list: listId } })
  }
}
