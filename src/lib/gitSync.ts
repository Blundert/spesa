import { exportData, importData, isBackupData, type BackupData } from '../db/backup'

// ─── Config (in localStorage) ────────────────────────────────────────────────

export interface GitConfig {
  token: string
  owner: string
  repo: string
  branch: string
  path: string
}

const CONFIG_KEY = 'gitsync-config'
const AUTO_KEY = 'gitsync-auto'
const HASH_KEY = 'gitsync-lasthash' // hash dei dati all'ultimo sync
const SHA_KEY = 'gitsync-lastsha' // sha del file remoto all'ultimo sync

export function getGitConfig(): GitConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) {
      const c = JSON.parse(raw) as Partial<GitConfig>
      return {
        token: c.token ?? '',
        owner: c.owner ?? '',
        repo: c.repo ?? '',
        branch: c.branch || 'main',
        path: c.path || 'spesa-db.json',
      }
    }
  } catch {
    /* ignora json corrotto */
  }
  return { token: '', owner: '', repo: '', branch: 'main', path: 'spesa-db.json' }
}

export function setGitConfig(c: GitConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(c))
}

export function isGitConfigured(c: GitConfig): boolean {
  return Boolean(c.token && c.owner && c.repo && c.path)
}

export function getAutoSync(): boolean {
  return localStorage.getItem(AUTO_KEY) === '1'
}

export function setAutoSync(on: boolean): void {
  localStorage.setItem(AUTO_KEY, on ? '1' : '0')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function base64ToUtf8(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

/** Hash del contenuto dati ESCLUSO exportedAt (per rilevare modifiche reali). */
function contentHash(data: BackupData): string {
  // exportedAt cambia a ogni export: lo azzeriamo così l'hash riflette solo i dati.
  const s = JSON.stringify({ ...data, exportedAt: 0 })
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

function isoStamp(): string {
  return new Date().toISOString()
}

const API = 'https://api.github.com'

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function contentsUrl(c: GitConfig): string {
  return `${API}/repos/${c.owner}/${c.repo}/contents/${encodePath(c.path)}`
}

interface RemoteFile {
  sha: string
  text: string
}

/** GET del file remoto: ritorna sha + contenuto, o null se non esiste (404). */
async function getRemoteFile(c: GitConfig): Promise<RemoteFile | null> {
  const res = await fetch(`${contentsUrl(c)}?ref=${encodeURIComponent(c.branch)}`, {
    headers: authHeaders(c.token),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const data = (await res.json()) as { sha?: string; content?: string; download_url?: string }
  let text = ''
  if (data.content) text = base64ToUtf8(data.content)
  else if (data.download_url) text = await (await fetch(data.download_url)).text()
  return { sha: data.sha ?? '', text }
}

/** PUT del file (= un commit). Passare lo sha corrente se il file esiste. Ritorna il nuovo sha. */
async function putFile(
  c: GitConfig,
  json: string,
  message: string,
  sha: string | null,
): Promise<string> {
  const res = await fetch(contentsUrl(c), {
    method: 'PUT',
    headers: { ...authHeaders(c.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: utf8ToBase64(json),
      branch: c.branch,
      ...(sha ? { sha } : {}),
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`GitHub ${res.status}: ${txt.slice(0, 160)}`)
  }
  const data = (await res.json()) as { content?: { sha?: string } }
  return data.content?.sha ?? ''
}

function rememberSynced(hash: string, sha: string): void {
  localStorage.setItem(HASH_KEY, hash)
  localStorage.setItem(SHA_KEY, sha)
}

// ─── Sync ────────────────────────────────────────────────────────────────────

export type SyncOutcome =
  | { status: 'noop' } // niente da fare
  | { status: 'pushed' } // locale → remoto
  | { status: 'pulled' } // remoto → locale
  | { status: 'conflict' } // entrambi cambiati: serve scelta utente
  | { status: 'notConfigured' }

/**
 * Sync bidirezionale "fast-forward". Confronta lo stato locale e remoto con
 * l'ultimo sync (hash dati + sha remoto):
 * - solo locale cambiato  → push
 * - solo remoto cambiato  → pull (se allowPull)
 * - entrambi cambiati     → conflitto (nessuna sovrascrittura automatica)
 * `allowPull: false` (es. quando l'app va in background) fa solo push, mai pull.
 */
export async function autoSync(opts?: { allowPull?: boolean }): Promise<SyncOutcome> {
  const allowPull = opts?.allowPull ?? true
  const c = getGitConfig()
  if (!isGitConfigured(c)) return { status: 'notConfigured' }

  const data = await exportData()
  const localHash = contentHash(data)
  const lastHash = localStorage.getItem(HASH_KEY)
  const lastSha = localStorage.getItem(SHA_KEY)
  const localChanged = lastHash === null || localHash !== lastHash

  // Andando in background senza modifiche locali non c'è nulla da inviare: niente rete.
  if (!allowPull && !localChanged) return { status: 'noop' }

  const remote = await getRemoteFile(c)

  // Nessun file remoto ancora: lo creiamo col locale.
  if (remote === null) {
    const newSha = await putFile(c, JSON.stringify(data, null, 2), `Backup ${isoStamp()}`, null)
    rememberSynced(localHash, newSha)
    return { status: 'pushed' }
  }

  const remoteChanged = lastSha === null || remote.sha !== lastSha

  if (!localChanged && !remoteChanged) return { status: 'noop' }

  if (localChanged && !remoteChanged) {
    const newSha = await putFile(c, JSON.stringify(data, null, 2), `Backup ${isoStamp()}`, remote.sha)
    rememberSynced(localHash, newSha)
    return { status: 'pushed' }
  }

  if (!localChanged && remoteChanged) {
    if (!allowPull) return { status: 'noop' }
    const parsed: unknown = JSON.parse(remote.text)
    if (!isBackupData(parsed)) throw new Error('Backup remoto non valido')
    await importData(parsed)
    rememberSynced(contentHash(parsed), remote.sha)
    return { status: 'pulled' }
  }

  // localChanged && remoteChanged
  return { status: 'conflict' }
}

/** Forza il locale come verità: sovrascrive il remoto (anche in conflitto = "tieni locale"). */
export async function syncPushForce(): Promise<void> {
  const c = getGitConfig()
  if (!isGitConfigured(c)) throw new Error('Sync non configurato')
  const data = await exportData()
  const remote = await getRemoteFile(c)
  const newSha = await putFile(
    c,
    JSON.stringify(data, null, 2),
    `Backup ${isoStamp()}`,
    remote?.sha ?? null,
  )
  rememberSynced(contentHash(data), newSha)
}

/** Forza il remoto come verità: scarica e importa (sovrascrive il locale). */
export async function syncPull(): Promise<void> {
  const c = getGitConfig()
  if (!isGitConfigured(c)) throw new Error('Sync non configurato')
  const remote = await getRemoteFile(c)
  if (remote === null) throw new Error('Nessun backup remoto')
  const parsed: unknown = JSON.parse(remote.text)
  if (!isBackupData(parsed)) throw new Error('Backup remoto non valido')
  await importData(parsed)
  rememberSynced(contentHash(parsed), remote.sha)
}
