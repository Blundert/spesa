/** File della lista condivisa dentro il suo repo dedicato. */
export const SHARED_LIST_PATH = 'lista.json'

/** Identificatore stabile (voci e liste condivise): gli id numerici di Dexie sono diversi su ogni dispositivo. */
export function newUid(): string {
  return crypto.randomUUID()
}

export interface RepoRef {
  owner: string
  repo: string
}

const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/

/**
 * Legge un repo GitHub da quello che l'utente incolla: `owner/repo`, un indirizzo
 * `https://github.com/owner/repo(.git)(/…)` oppure `git@github.com:owner/repo.git`.
 * `null` se non è riconoscibile.
 */
export function parseRepoRef(input: string): RepoRef | null {
  let text = input.trim()
  text = text.replace(/^git@github\.com:/i, '').replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, '')
  const [owner, rawRepo] = text.split('/')
  if (!owner || !rawRepo) return null
  const repo = rawRepo.replace(/\.git$/i, '')
  if (!OWNER_RE.test(owner) || !REPO_RE.test(repo) || repo === '.' || repo === '..') return null
  return { owner, repo }
}
