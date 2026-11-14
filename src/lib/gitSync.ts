import { exportData, importData, isBackupData, type BackupData } from '../db/backup'
import { saveSafetySnapshot } from '../db/repositories/safetySnapshots'
import { backupPath, isInitialData, parseBackupPath, type BackupSide } from './syncBackup'

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

/** GET di un file del repo (di default il file dei dati sul branch): sha + contenuto, o null se non esiste (404). */
async function getRemoteFile(
  c: GitConfig,
  path: string = c.path,
  ref: string = c.branch,
): Promise<RemoteFile | null> {
  const res = await fetch(`${contentsUrl({ ...c, path })}?ref=${encodeURIComponent(ref)}`, {
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

interface GitFile {
  path: string
  content: string
}

class GithubError extends Error {
  readonly status: number
  constructor(status: number, detail: string) {
    super(`GitHub ${status}: ${detail}`)
    this.status = status
  }
}

async function githubJson<T>(c: GitConfig, url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      ...authHeaders(c.token),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  if (!res.ok) {
    throw new GithubError(res.status, (await res.text()).slice(0, 160))
  }
  return (await res.json()) as T
}

/**
 * Un SOLO commit con più file (Git Data API: albero → commit → ref). Il ref si aggiorna senza
 * `force`: se nel frattempo il branch è avanzato, GitHub rifiuta (422) e non si scrive niente.
 * Ritorna lo sha del blob di ogni file, per ricordare lo stato sincronizzato.
 */
async function commitFiles(
  c: GitConfig,
  files: GitFile[],
  message: string,
): Promise<Record<string, string>> {
  const repo = `${API}/repos/${c.owner}/${c.repo}/git`
  const ref = `heads/${encodePath(c.branch)}`
  const head = await githubJson<{ object: { sha: string } }>(c, `${repo}/ref/${ref}`, 'GET')
  const parent = await githubJson<{ tree: { sha: string } }>(
    c,
    `${repo}/commits/${head.object.sha}`,
    'GET',
  )
  const tree = await githubJson<{ sha: string; tree: Array<{ path: string; sha: string }> }>(
    c,
    `${repo}/trees`,
    'POST',
    {
      base_tree: parent.tree.sha,
      tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', content: f.content })),
    },
  )
  const commit = await githubJson<{ sha: string }>(c, `${repo}/commits`, 'POST', {
    message,
    tree: tree.sha,
    parents: [head.object.sha],
  })
  try {
    await githubJson(c, `${repo}/refs/${ref}`, 'PATCH', { sha: commit.sha, force: false })
  } catch (e) {
    if (e instanceof GithubError && e.status === 422) {
      throw new Error('Il remoto è cambiato durante il salvataggio: riprova', { cause: e })
    }
    throw e
  }
  const shas: Record<string, string> = {}
  for (const f of files) {
    const entry = tree.tree.find((t) => t.path === f.path)
    if (!entry) throw new Error('GitHub: risposta incompleta')
    shas[f.path] = entry.sha
  }
  return shas
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
    // (con allowPull=false e locale invariato siamo già usciti sopra)
    const parsed: unknown = JSON.parse(remote.text)
    if (!isBackupData(parsed)) throw new Error('Backup remoto non valido')
    await importData(parsed)
    rememberSynced(contentHash(parsed), remote.sha)
    return { status: 'pulled' }
  }

  // localChanged && remoteChanged
  // Locale con soli dati iniziali (dispositivo nuovo): niente da proteggere, si scarica il remoto.
  if (isInitialData(data)) {
    if (!allowPull) return { status: 'noop' }
    const parsed: unknown = JSON.parse(remote.text)
    if (!isBackupData(parsed)) throw new Error('Backup remoto non valido')
    await importData(parsed)
    rememberSynced(contentHash(parsed), remote.sha)
    return { status: 'pulled' }
  }
  return { status: 'conflict' }
}

export interface SyncResult {
  /** Percorso nel repo del backup del lato scartato, se ne è stato creato uno. */
  backupPath: string | null
}

/**
 * Forza il locale come verità ("Mantieni"): UN commit con il nuovo file di dati e il backup del
 * remoto scartato in `backups/`, così non esiste uno stato con il remoto sovrascritto e senza copia.
 */
export async function syncPushForce(): Promise<SyncResult> {
  const c = getGitConfig()
  if (!isGitConfigured(c)) throw new Error('Sync non configurato')
  const data = await exportData()
  const json = JSON.stringify(data, null, 2)
  const remote = await getRemoteFile(c)
  if (remote === null) {
    const newSha = await putFile(c, json, `Backup ${isoStamp()}`, null)
    rememberSynced(contentHash(data), newSha)
    return { backupPath: null }
  }
  const iso = isoStamp()
  const path = backupPath(iso, 'remote')
  const shas = await commitFiles(
    c,
    [
      { path: c.path, content: json },
      { path, content: remote.text },
    ],
    `Keep local, back up remote ${iso}`,
  )
  rememberSynced(contentHash(data), shas[c.path])
  return { backupPath: path }
}

/**
 * Forza il remoto come verità ("Usa remoto", "Scarica da remoto"): prima il backup del locale
 * scartato nel repo (bloccante: se fallisce il locale non viene toccato), poi l'import.
 * Il backup nel repo si salta se il locale è ancora quello dell'ultimo sync (è già nella cronologia)
 * o contiene solo dati iniziali.
 */
export async function syncPull(): Promise<SyncResult> {
  const c = getGitConfig()
  if (!isGitConfigured(c)) throw new Error('Sync non configurato')
  const remote = await getRemoteFile(c)
  if (remote === null) throw new Error('Nessun backup remoto')
  const parsed: unknown = JSON.parse(remote.text)
  if (!isBackupData(parsed)) throw new Error('Backup remoto non valido')

  const local = await exportData()
  let path: string | null = null
  if (!isInitialData(local)) {
    const localJson = JSON.stringify(local, null, 2)
    await saveSafetySnapshot('pull', localJson)
    if (contentHash(local) !== localStorage.getItem(HASH_KEY)) {
      const iso = isoStamp()
      path = backupPath(iso, 'local')
      await commitFiles(c, [{ path, content: localJson }], `Back up local before using remote ${iso}`)
    }
  }
  await importData(parsed)
  rememberSynced(contentHash(parsed), remote.sha)
  return { backupPath: path }
}

// ─── Cronologia e ripristino ─────────────────────────────────────────────────

export type HistoryEntry =
  | { kind: 'commit'; sha: string; date: string; message: string }
  | { kind: 'backup'; path: string; date: string; side: BackupSide; sha: string }

const HISTORY_PAGE = 50

/**
 * Cronologia remota: i commit che hanno toccato il file dei dati + i file in `backups/`.
 * Dal più recente al più vecchio.
 */
export async function listRemoteHistory(): Promise<HistoryEntry[]> {
  const c = getGitConfig()
  if (!isGitConfigured(c)) throw new Error('Sync non configurato')
  const repo = `${API}/repos/${c.owner}/${c.repo}`
  const commits = await githubJson<
    Array<{ sha: string; commit: { message: string; author: { date: string } } }>
  >(
    c,
    `${repo}/commits?sha=${encodeURIComponent(c.branch)}&path=${encodeURIComponent(c.path)}&per_page=${HISTORY_PAGE}`,
    'GET',
  )
  const entries: HistoryEntry[] = commits.map((k) => ({
    kind: 'commit',
    sha: k.sha,
    date: k.commit.author.date,
    message: k.commit.message,
  }))

  // Senza cartella backups/ GitHub risponde 404: nessun backup, non è un errore.
  const res = await fetch(`${repo}/contents/backups?ref=${encodeURIComponent(c.branch)}`, {
    headers: authHeaders(c.token),
  })
  if (res.ok) {
    const files = (await res.json()) as Array<{ path: string; sha: string }>
    for (const f of files) {
      const parsed = parseBackupPath(f.path)
      if (parsed) entries.push({ kind: 'backup', path: f.path, date: parsed.iso, side: parsed.side, sha: f.sha })
    }
  } else if (res.status !== 404) {
    throw new GithubError(res.status, (await res.text()).slice(0, 160))
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date))
}

/** Scarica e valida il backup che sta dietro una voce della cronologia. */
export async function loadHistoryBackup(entry: HistoryEntry): Promise<BackupData> {
  const c = getGitConfig()
  if (!isGitConfigured(c)) throw new Error('Sync non configurato')
  const file =
    entry.kind === 'commit'
      ? await getRemoteFile(c, c.path, entry.sha)
      : await getRemoteFile(c, entry.path)
  if (file === null) throw new Error('File non trovato nel repository')
  const parsed: unknown = JSON.parse(file.text)
  if (!isBackupData(parsed)) throw new Error('Backup non valido')
  return parsed
}

/**
 * Ripristina `data` come stato attuale. Con `via: 'repo'` crea UN commit nuovo sopra la cronologia
 * (mai riscritta) con i dati ripristinati e, se serve, i backup di ciò che si sostituisce (locale non
 * ancora sincronizzato, remoto non ancora scaricato). Bloccante: se il commit fallisce il locale
 * resta com'è. Con `via: 'local'` (copie di sicurezza, senza sync) sostituisce solo il locale.
 */
export async function restoreFromBackup(data: BackupData, via: 'repo' | 'local'): Promise<SyncResult> {
  const local = await exportData()
  const localJson = JSON.stringify(local, null, 2)
  const hasLocalData = !isInitialData(local)

  if (via === 'local') {
    if (hasLocalData) await saveSafetySnapshot('restore', localJson)
    await importData(data)
    return { backupPath: null }
  }

  const c = getGitConfig()
  if (!isGitConfigured(c)) throw new Error('Sync non configurato')
  const json = JSON.stringify(data, null, 2)
  const remote = await getRemoteFile(c)
  const iso = isoStamp()
  const message = `Restore ${iso}`
  let path: string | null = null
  let newSha: string
  if (hasLocalData) await saveSafetySnapshot('restore', localJson)

  if (remote === null) {
    newSha = await putFile(c, json, message, null)
  } else {
    const files: GitFile[] = [{ path: c.path, content: json }]
    if (hasLocalData && contentHash(local) !== localStorage.getItem(HASH_KEY)) {
      path = backupPath(iso, 'local')
      files.push({ path, content: localJson })
    }
    if (remote.sha !== localStorage.getItem(SHA_KEY)) {
      const remotePath = backupPath(iso, 'remote')
      path ??= remotePath
      files.push({ path: remotePath, content: remote.text })
    }
    newSha = (await commitFiles(c, files, message))[c.path]
  }
  await importData(data)
  rememberSynced(contentHash(data), newSha)
  return { backupPath: path }
}
