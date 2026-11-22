import { API, authHeaders } from './gitSync'

/**
 * Link di creazione di un token classico con il permesso `repo` e il nome già compilati
 * (`scopes` e `description` sono parametri non documentati da GitHub ma stabili da anni).
 * La scadenza NON si può precompilare: nella guida diciamo di lasciare i 30 giorni proposti.
 */
export const CLASSIC_TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=repo&description=Spesa'

const TOKEN_RE = /^(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|gho_[A-Za-z0-9]{20,})$/

/** Il testo (es. dagli appunti) ha la forma di un token GitHub? */
export function looksLikeToken(text: string): boolean {
  return TOKEN_RE.test(text.trim())
}

export interface RepoInfo {
  owner: string
  repo: string
  /** Permesso di scrittura (push) per chi ha il token. */
  canPush: boolean
  private: boolean
}

export const fullName = (r: Pick<RepoInfo, 'owner' | 'repo'>): string => `${r.owner}/${r.repo}`

/** Login del proprietario del token. 401 = token non valido o scaduto. */
export async function fetchViewer(token: string): Promise<string> {
  const res = await fetch(`${API}/user`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const data = (await res.json()) as { login?: string }
  if (!data.login) throw new Error('GitHub: risposta senza login')
  return data.login
}

const PAGE = 100
const MAX_PAGES = 5

interface RawRepo {
  name: string
  private?: boolean
  owner: { login: string }
  permissions?: { push?: boolean }
}

/** Repo a cui il token ha accesso (propri, da collaboratore, di organizzazioni), i più recenti per primi. */
export async function listAccessibleRepos(token: string): Promise<RepoInfo[]> {
  const repos: RepoInfo[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${API}/user/repos?per_page=${PAGE}&page=${page}&sort=pushed&affiliation=owner,collaborator,organization_member`
    const res = await fetch(url, { headers: authHeaders(token) })
    if (!res.ok) throw new Error(`GitHub ${res.status}`)
    const raw = (await res.json()) as RawRepo[]
    for (const r of raw) {
      repos.push({ owner: r.owner.login, repo: r.name, canPush: r.permissions?.push === true, private: r.private === true })
    }
    if (raw.length < PAGE) break
  }
  return repos
}

/** Verifica il token e legge chi è e a cosa ha accesso. */
export async function connectGithub(token: string): Promise<{ login: string; repos: RepoInfo[] }> {
  const login = await fetchViewer(token)
  return { login, repos: await listAccessibleRepos(token) }
}
