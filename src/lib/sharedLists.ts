import { db } from '../db/db'
import type { ShoppingList, SharedMember } from '../db/types'
import { createShoppingList, deleteShoppingList, setSharedLink } from '../db/repositories/shoppingLists'
import { patchSharedLink } from '../db/repositories/sharedListData'
import { getGitConfig, getRemoteFile, type GitConfig } from './gitSync'
import {
  createPrivateRepo,
  fetchRepoMeta,
  inviteCollaborator,
  type RepoMeta,
  type SharePermission,
} from './githubRepos'
import { SHARED_LIST_PATH, newUid, parseRepoRef, type RepoRef } from './sharedList'
import { parseSharedFile } from './sharedListFile'
import { syncSharedList } from './sharedSync'

/**
 * Cosa può andare storto nel condividere o aggiungere una lista:
 * - `not-connected`: manca il token o il login (Sincronizzazione → Collega GitHub), o il token non vale più;
 * - `name-taken`: esiste già un repo con quel nome; `invalid-name`: nome non valido per GitHub;
 * - `no-permission`: il token non può creare repo o invitare (serve il permesso `repo`);
 * - `user-not-found`: l'username da invitare non esiste;
 * - `no-access`: il repo non esiste o non si vede (invito non accettato?);
 * - `not-ready`: nel repo non c'è ancora la lista (chi l'ha condivisa non ha sincronizzato);
 * - `invalid`: il file nel repo non è una lista condivisa valida;
 * - `already-joined`: questa lista c'è già (`listId` dice quale).
 */
export type SharedListErrorCode =
  | 'not-connected'
  | 'name-taken'
  | 'invalid-name'
  | 'no-permission'
  | 'user-not-found'
  | 'no-access'
  | 'not-ready'
  | 'invalid'
  | 'already-joined'

export class SharedListError extends Error {
  readonly code: SharedListErrorCode
  readonly listId?: number
  constructor(code: SharedListErrorCode, listId?: number) {
    super(`Lista condivisa: ${code}`)
    this.code = code
    this.listId = listId
  }
}

/** La lista è condivisa e io posso solo guardarla. */
export function isReadOnly(list: ShoppingList | undefined): boolean {
  return list?.shared !== undefined && !list.shared.canWrite
}

/** Nome proposto per il repo di una lista: `spesa-` + il nome senza accenti né simboli. */
export function defaultRepoName(listName: string): string {
  const slug = listName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/, '')
  return slug ? `spesa-${slug}` : 'spesa-lista'
}

/** Nome accettabile per un repo GitHub. */
export function isValidRepoName(name: string): boolean {
  return parseRepoRef(`a/${name}`) !== null && !name.includes('/')
}

function connection(): { token: string; login: string } {
  const { token, login } = getGitConfig()
  if (!token || !login) throw new SharedListError('not-connected')
  return { token, login }
}

/** Traduce gli errori di GitHub (testo "GitHub 4xx") nei codici di `SharedListError`; gli altri passano. */
function translate(e: unknown, map: Record<string, SharedListErrorCode>): unknown {
  const status = e instanceof Error ? /^GitHub (\d{3})/.exec(e.message)?.[1] : undefined
  return status && map[status] ? new SharedListError(map[status]) : e
}

export type InviteOutcome = 'invited' | 'already' | 'failed' | 'none'

/**
 * Condivide una lista: crea un repo privato dedicato, la collega e scrive il file. Se indicato, invita una persona.
 * Se qualcosa va storto prima che il file sia scritto la lista torna com'era (il repo resta su GitHub).
 */
export async function shareList(
  listId: number,
  opts: { repoName: string; invite?: { username: string; permission: SharePermission } },
): Promise<{ owner: string; repo: string; invite: InviteOutcome }> {
  const { token, login } = connection()
  if (!isValidRepoName(opts.repoName)) throw new SharedListError('invalid-name')

  let created
  try {
    created = await createPrivateRepo(token, opts.repoName)
  } catch (e) {
    throw translate(e, { '422': 'name-taken', '403': 'no-permission', '401': 'not-connected' })
  }

  await setSharedLink(listId, {
    uid: newUid(),
    owner: created.owner,
    repo: created.repo,
    branch: created.defaultBranch,
    path: SHARED_LIST_PATH,
    me: login,
    canWrite: true,
    members: {},
    tombstones: {},
  })
  try {
    await syncSharedList(listId)
  } catch (e) {
    await setSharedLink(listId, null)
    throw e
  }

  let invite: InviteOutcome = 'none'
  if (opts.invite) {
    try {
      invite = await inviteCollaborator(token, created.owner, created.repo, opts.invite.username.trim(), opts.invite.permission)
    } catch {
      invite = 'failed'
    }
  }
  return { owner: created.owner, repo: created.repo, invite }
}

/** Invita un'altra persona su una lista già condivisa (solo chi possiede il repo può farlo). */
export async function inviteToList(
  listId: number,
  username: string,
  permission: SharePermission,
): Promise<'invited' | 'already'> {
  const { token } = connection()
  const link = (await db.shoppingLists.get(listId))?.shared
  if (!link) throw new Error('Lista non condivisa')
  try {
    return await inviteCollaborator(token, link.owner, link.repo, username.trim(), permission)
  } catch (e) {
    throw translate(e, { '404': 'user-not-found', '403': 'no-permission', '422': 'user-not-found', '401': 'not-connected' })
  }
}

/**
 * Aggiunge una lista condivisa da altri: legge il file del repo, crea la lista con il suo collegamento e fa la prima
 * sincronizzazione (che scarica e non scrive). Se qualcosa va storto la lista non viene creata.
 */
export async function joinSharedList(ref: RepoRef): Promise<number> {
  const { token, login } = connection()

  let meta: RepoMeta
  try {
    meta = await fetchRepoMeta(token, ref.owner, ref.repo)
  } catch (e) {
    throw translate(e, { '404': 'no-access', '403': 'no-access', '401': 'not-connected' })
  }

  const cfg: GitConfig = { token, login, owner: ref.owner, repo: ref.repo, branch: meta.defaultBranch, path: SHARED_LIST_PATH }
  const remote = await getRemoteFile(cfg)
  if (!remote) throw new SharedListError('not-ready')
  let file
  try {
    file = parseSharedFile(remote.text)
  } catch {
    throw new SharedListError('invalid')
  }

  const already = (await db.shoppingLists.toArray()).find((l) => l.shared?.uid === file.uid)
  if (already) throw new SharedListError('already-joined', already.id)

  const listId = await createShoppingList(file.name, null)
  try {
    await setSharedLink(listId, {
      uid: file.uid,
      owner: ref.owner,
      repo: ref.repo,
      branch: meta.defaultBranch,
      path: SHARED_LIST_PATH,
      me: login,
      canWrite: meta.canPush,
      members: {},
      tombstones: {},
    })
    await syncSharedList(listId)
  } catch (e) {
    await deleteShoppingList(listId)
    throw e
  }
  return listId
}

/** Smette di condividere: la lista resta, con i suoi articoli, come lista normale. Il repo non viene toccato. */
export async function unlinkSharedList(listId: number): Promise<void> {
  await setSharedLink(listId, null)
}

/** Cambia nome visibile e/o tipo (partner o estraneo) di una persona di una lista condivisa. */
export async function setMember(listId: number, login: string, patch: Partial<SharedMember>): Promise<void> {
  const link = (await db.shoppingLists.get(listId))?.shared
  if (!link) throw new Error('Lista non condivisa')
  const current: SharedMember = link.members[login] ?? { label: '', kind: 'stranger' }
  await patchSharedLink(listId, { members: { ...link.members, [login]: { ...current, ...patch } } })
}
