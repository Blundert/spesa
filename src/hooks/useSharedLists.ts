import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { acceptInvitation, listInvitations, type SharePermission } from '../lib/githubRepos'
import { getGitConfig } from '../lib/gitSync'
import type { RepoRef } from '../lib/sharedList'
import type { SharedMember } from '../db/types'
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

/** Il token è collegato (token e login noti)? */
export function isGithubConnected(): boolean {
  const { token, login } = getGitConfig()
  return token !== '' && login !== ''
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
  const refresh = useRefreshLists()
  return useMutation({
    mutationFn: ({ listId, login, patch }: { listId: number; login: string; patch: Partial<SharedMember> }) =>
      setMember(listId, login, patch),
    onSuccess: refresh,
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
