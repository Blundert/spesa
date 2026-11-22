import { db } from '../db/db'
import { applySharedFile, exportSharedFile, patchSharedLink } from '../db/repositories/sharedListData'
import { API, authHeaders, getGitConfig, getRemoteFile, putFile, type GitConfig } from './gitSync'
import {
  mergeSharedFiles,
  parseSharedFile,
  sameSharedContent,
  serializeSharedFile,
  type SharedFileError,
  type SharedListFile,
} from './sharedListFile'

/**
 * Cosa è andato storto in una sync di lista condivisa:
 * - `no-token`: manca il token GitHub (Sincronizzazione → Collega GitHub);
 * - `auth`: il token non vale più (401);
 * - `no-access`: il repo non esiste o non si ha più accesso;
 * - `invalid-remote` / `newer-format`: il file nel repo è rovinato, non è di questa lista o è di un'app più nuova;
 * - `read-only`: serve scrivere ma non si può;
 * - `conflict`: un altro ha scritto nello stesso istante, anche dopo qualche tentativo;
 * - `network`: niente rete.
 */
export type SharedSyncCode =
  | 'no-token'
  | 'auth'
  | 'no-access'
  | 'invalid-remote'
  | 'newer-format'
  | 'read-only'
  | 'conflict'
  | 'network'

export class SharedSyncError extends Error {
  readonly code: SharedSyncCode
  constructor(code: SharedSyncCode) {
    super(`Sync lista condivisa: ${code}`)
    this.code = code
  }
}

export interface SharedSyncResult {
  /** I dati di questa lista su questo dispositivo sono cambiati (da altri). */
  changed: boolean
  /** Abbiamo scritto una nuova versione nel repo. */
  pushed: boolean
  canWrite: boolean
}

const MAX_ATTEMPTS = 3

const isConflict = (e: unknown) => e instanceof Error && /^GitHub (409|422)/.test(e.message)

/** Traduce gli errori di rete e di GitHub nei codici di `SharedSyncError`; gli altri passano come sono. */
function translate(e: unknown): unknown {
  if (e instanceof SharedSyncError) return e
  if (e instanceof TypeError) return new SharedSyncError('network')
  const status = e instanceof Error ? /^GitHub (\d{3})/.exec(e.message)?.[1] : undefined
  if (status === '401') return new SharedSyncError('auth')
  if (status === '403' || status === '404') return new SharedSyncError('no-access')
  return e
}

/** Il token può scrivere nel repo? Fallisce con `no-access` se il repo non esiste o non si vede. */
async function repoCanPush(cfg: GitConfig): Promise<boolean> {
  const res = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}`, { headers: authHeaders(cfg.token) })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const data = (await res.json()) as { permissions?: { push?: boolean } }
  return data.permissions?.push === true
}

function readRemote(text: string, uid: string): SharedListFile {
  let file: SharedListFile
  try {
    file = parseSharedFile(text)
  } catch (e) {
    // parseSharedFile lancia sempre e solo SharedFileError.
    throw new SharedSyncError((e as SharedFileError).code === 'newer' ? 'newer-format' : 'invalid-remote')
  }
  if (file.uid !== uid) throw new SharedSyncError('invalid-remote')
  return file
}

/**
 * Sincronizza una lista condivisa con il suo repo: scarica, unisce con i dati locali (senza chiedere niente),
 * scrive se c'è qualcosa di nuovo e porta su questo dispositivo il risultato.
 *
 * - Prima sync (collegamento senza `lastSha`: lista appena aggiunta o dopo un ripristino da backup): scarica e
 *   unisce, ma NON scrive; scrive la sync dopo. Così non si sovrascrive mai il lavoro degli altri.
 * - Sola lettura: la copia locale diventa quella del repo.
 * - Se il repo è vuoto, la prima sync crea il file.
 */
export async function syncSharedList(listId: number, now: number = Date.now()): Promise<SharedSyncResult> {
  try {
    return await run(listId, now)
  } catch (e) {
    throw translate(e)
  }
}

async function run(listId: number, now: number): Promise<SharedSyncResult> {
  const token = getGitConfig().token
  if (!token) throw new SharedSyncError('no-token')

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const link = (await db.shoppingLists.get(listId))?.shared
    if (!link) throw new Error('Lista non condivisa')
    const cfg: GitConfig = { token, login: '', owner: link.owner, repo: link.repo, branch: link.branch, path: link.path }
    const message = `Aggiorna lista (${link.me})`
    const local = await exportSharedFile(listId)
    const remote = await getRemoteFile(cfg)

    if (!remote) {
      // Il file non c'è ancora: lo crea chi può scrivere (e se il repo non si vede, repoCanPush fallisce).
      if (!(await repoCanPush(cfg))) throw new SharedSyncError('read-only')
      try {
        const sha = await putFile(cfg, serializeSharedFile(local), message, null)
        await patchSharedLink(listId, { lastSha: sha, canWrite: true })
        return { changed: false, pushed: true, canWrite: true }
      } catch (e) {
        if (isConflict(e)) continue
        throw e
      }
    }

    const file = readRemote(remote.text, link.uid)
    const first = link.lastSha === undefined
    const canWrite = first ? await repoCanPush(cfg) : link.canWrite
    const merged = canWrite ? mergeSharedFiles(local, file, now) : file
    const needPush = canWrite && !first && !sameSharedContent(merged, file)

    let sha = remote.sha
    if (needPush) {
      try {
        sha = await putFile(cfg, serializeSharedFile(merged), message, remote.sha)
      } catch (e) {
        if (isConflict(e)) continue
        // 403: il permesso di scrittura è stato tolto.
        if (e instanceof Error && /^GitHub 403/.test(e.message)) {
          await patchSharedLink(listId, { canWrite: false })
          throw new SharedSyncError('read-only')
        }
        throw e
      }
    }

    await applySharedFile(listId, merged)
    await patchSharedLink(listId, { lastSha: sha, canWrite })
    return { changed: !sameSharedContent(local, merged), pushed: needPush, canWrite }
  }
  throw new SharedSyncError('conflict')
}
