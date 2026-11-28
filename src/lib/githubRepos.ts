import { API, authHeaders, NO_CACHE } from './gitSync'

const json = (token: string) => ({ ...authHeaders(token), 'Content-Type': 'application/json' })

async function fail(res: Response): Promise<never> {
  throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 160)}`)
}

export interface CreatedRepo {
  owner: string
  repo: string
  defaultBranch: string
}

/** Crea un repo privato vuoto. 422 = esiste già uno con quel nome; 403 = il token non ha il permesso `repo`. */
export async function createPrivateRepo(token: string, name: string): Promise<CreatedRepo> {
  const res = await fetch(`${API}/user/repos`, {
    method: 'POST',
    headers: json(token),
    body: JSON.stringify({ name, private: true, description: 'Lista condivisa - App Spesa', auto_init: false }),
  })
  if (!res.ok) return fail(res)
  const data = (await res.json()) as { name: string; owner: { login: string }; default_branch?: string }
  return { owner: data.owner.login, repo: data.name, defaultBranch: data.default_branch || 'main' }
}

export type SharePermission = 'push' | 'pull'

/** Invita una persona sul repo: `invited` = invito spedito, `already` = ci aveva già accesso. 404 = utente inesistente. */
export async function inviteCollaborator(
  token: string,
  owner: string,
  repo: string,
  username: string,
  permission: SharePermission,
): Promise<'invited' | 'already'> {
  const res = await fetch(`${API}/repos/${owner}/${repo}/collaborators/${encodeURIComponent(username)}`, {
    method: 'PUT',
    headers: json(token),
    body: JSON.stringify({ permission }),
  })
  if (res.status === 204) return 'already'
  if (!res.ok) return fail(res)
  return 'invited'
}

export interface Invitation {
  id: number
  owner: string
  repo: string
  inviter: string
  /** Può scrivere (false = sola lettura). */
  canWrite: boolean
}

interface RawInvitation {
  id: number
  repository: { name: string; owner: { login: string } }
  inviter?: { login: string }
  permissions?: string
}

/** Inviti a repo che aspettano di essere accettati. */
export async function listInvitations(token: string): Promise<Invitation[]> {
  const res = await fetch(`${API}/user/repository_invitations?per_page=100`, { headers: authHeaders(token), cache: NO_CACHE })
  if (!res.ok) return fail(res)
  const raw = (await res.json()) as RawInvitation[]
  return raw.map((i) => ({
    id: i.id,
    owner: i.repository.owner.login,
    repo: i.repository.name,
    inviter: i.inviter?.login ?? i.repository.owner.login,
    canWrite: i.permissions !== 'read',
  }))
}

export async function acceptInvitation(token: string, id: number): Promise<void> {
  const res = await fetch(`${API}/user/repository_invitations/${id}`, { method: 'PATCH', headers: authHeaders(token) })
  if (!res.ok) await fail(res)
}

export interface RepoMeta {
  defaultBranch: string
  canPush: boolean
}

/** Branch di default e permesso di scrittura di un repo. 404/403 = non esiste o non si vede. */
export async function fetchRepoMeta(token: string, owner: string, repo: string): Promise<RepoMeta> {
  const res = await fetch(`${API}/repos/${owner}/${repo}`, { headers: authHeaders(token), cache: NO_CACHE })
  if (!res.ok) return fail(res)
  const data = (await res.json()) as { default_branch?: string; permissions?: { push?: boolean } }
  return { defaultBranch: data.default_branch || 'main', canPush: data.permissions?.push === true }
}
