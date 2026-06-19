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
const HASH_KEY = 'gitsync-lasthash'

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

async function getRemoteSha(c: GitConfig): Promise<string | null> {
  const res = await fetch(`${contentsUrl(c)}?ref=${encodeURIComponent(c.branch)}`, {
    headers: authHeaders(c.token),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const data = (await res.json()) as { sha?: string }
  return data.sha ?? null
}

// ─── Push / Pull ─────────────────────────────────────────────────────────────

/** Carica il JSON nel file remoto (= un commit). Usa lo sha corrente se il file esiste. */
async function putFile(c: GitConfig, json: string, message: string): Promise<void> {
  const sha = await getRemoteSha(c)
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
}

/** Scarica il contenuto del file remoto, o null se non esiste. */
async function getFile(c: GitConfig): Promise<string | null> {
  const res = await fetch(`${contentsUrl(c)}?ref=${encodeURIComponent(c.branch)}`, {
    headers: authHeaders(c.token),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const data = (await res.json()) as { content?: string; download_url?: string }
  if (data.content) return base64ToUtf8(data.content)
  if (data.download_url) return (await fetch(data.download_url)).text()
  return null
}

// ─── API di alto livello ─────────────────────────────────────────────────────

function isoStamp(): string {
  return new Date().toISOString()
}

/** Push manuale ("Sync ora"): esporta e carica sempre. */
export async function syncPushForce(): Promise<void> {
  const c = getGitConfig()
  if (!isGitConfigured(c)) throw new Error('Sync non configurato')
  const data = await exportData()
  await putFile(c, JSON.stringify(data, null, 2), `Backup ${isoStamp()}`)
  localStorage.setItem(HASH_KEY, contentHash(data))
}

/** Push automatico: carica solo se i dati sono cambiati dall'ultimo sync. */
export async function syncPushIfChanged(): Promise<boolean> {
  const c = getGitConfig()
  if (!isGitConfigured(c)) return false
  const data = await exportData()
  const h = contentHash(data)
  if (localStorage.getItem(HASH_KEY) === h) return false
  await putFile(c, JSON.stringify(data, null, 2), `Backup ${isoStamp()}`)
  localStorage.setItem(HASH_KEY, h)
  return true
}

/** Pull: scarica il backup remoto e lo importa (sovrascrive i dati locali). */
export async function syncPull(): Promise<void> {
  const c = getGitConfig()
  if (!isGitConfigured(c)) throw new Error('Sync non configurato')
  const text = await getFile(c)
  if (text === null) throw new Error('Nessun backup remoto')
  const parsed: unknown = JSON.parse(text)
  if (!isBackupData(parsed)) throw new Error('Backup remoto non valido')
  await importData(parsed)
  localStorage.setItem(HASH_KEY, contentHash(parsed))
}
