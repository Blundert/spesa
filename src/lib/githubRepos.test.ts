import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  acceptInvitation,
  createPrivateRepo,
  fetchRepoMeta,
  inviteCollaborator,
  listInvitations,
} from './githubRepos'

afterEach(() => vi.unstubAllGlobals())

interface Call { url: string; method: string; body: unknown; auth: string | undefined }
function stub(respond: (c: Call) => Response) {
  const calls: Call[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const call = {
      url,
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      auth: (init?.headers as Record<string, string>).Authorization,
    }
    calls.push(call)
    return respond(call)
  }))
  return calls
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status })

describe('createPrivateRepo', () => {
  it('crea un repo privato e dà proprietario, nome e branch di default', async () => {
    const calls = stub(() => json({ name: 'spesa-casa', owner: { login: 'matteo' }, default_branch: 'trunk' }, 201))
    expect(await createPrivateRepo('tok', 'spesa-casa')).toEqual({ owner: 'matteo', repo: 'spesa-casa', defaultBranch: 'trunk' })
    expect(calls[0]).toMatchObject({ url: 'https://api.github.com/user/repos', method: 'POST', auth: 'Bearer tok' })
    expect(calls[0].body).toMatchObject({ name: 'spesa-casa', private: true, auto_init: false })
  })

  it('senza branch nella risposta ripiega su main', async () => {
    stub(() => json({ name: 'x', owner: { login: 'm' } }, 201))
    expect((await createPrivateRepo('t', 'x')).defaultBranch).toBe('main')
  })

  it('con un nome già usato lancia con lo stato', async () => {
    stub(() => json({ message: 'name already exists' }, 422))
    await expect(createPrivateRepo('t', 'x')).rejects.toThrow('GitHub 422')
  })
})

describe('inviteCollaborator', () => {
  it('manda l\'invito con il permesso scelto', async () => {
    const calls = stub(() => json({ id: 1 }, 201))
    expect(await inviteCollaborator('t', 'matteo', 'spesa', 'anna rossi', 'pull')).toBe('invited')
    expect(calls[0]).toMatchObject({ method: 'PUT', url: 'https://api.github.com/repos/matteo/spesa/collaborators/anna%20rossi' })
    expect(calls[0].body).toEqual({ permission: 'pull' })
  })

  it('204 = ci aveva già accesso', async () => {
    stub(() => new Response(null, { status: 204 }))
    expect(await inviteCollaborator('t', 'm', 'r', 'anna', 'push')).toBe('already')
  })

  it('utente inesistente o altro errore: lancia', async () => {
    stub(() => json({}, 404))
    await expect(inviteCollaborator('t', 'm', 'r', 'nessuno', 'push')).rejects.toThrow('GitHub 404')
  })
})

describe('listInvitations / acceptInvitation', () => {
  it('elenca gli inviti con chi li ha mandati e il permesso', async () => {
    stub(() =>
      json([
        { id: 7, repository: { name: 'spesa', owner: { login: 'anna' } }, inviter: { login: 'anna' }, permissions: 'write' },
        { id: 8, repository: { name: 'casa', owner: { login: 'luca' } }, permissions: 'read' },
      ]),
    )
    expect(await listInvitations('t')).toEqual([
      { id: 7, owner: 'anna', repo: 'spesa', inviter: 'anna', canWrite: true },
      { id: 8, owner: 'luca', repo: 'casa', inviter: 'luca', canWrite: false },
    ])
  })

  it('un errore nell\'elenco lancia', async () => {
    stub(() => json({}, 401))
    await expect(listInvitations('t')).rejects.toThrow('GitHub 401')
  })

  it('accetta un invito', async () => {
    const calls = stub(() => new Response(null, { status: 204 }))
    await acceptInvitation('t', 7)
    expect(calls[0]).toMatchObject({ method: 'PATCH', url: 'https://api.github.com/user/repository_invitations/7' })
  })

  it('un invito scaduto o inesistente lancia', async () => {
    stub(() => json({}, 404))
    await expect(acceptInvitation('t', 7)).rejects.toThrow('GitHub 404')
  })
})

describe('fetchRepoMeta', () => {
  it('dà branch di default e permesso di scrittura', async () => {
    stub(() => json({ default_branch: 'master', permissions: { push: true } }))
    expect(await fetchRepoMeta('t', 'anna', 'spesa')).toEqual({ defaultBranch: 'master', canPush: true })
  })

  it('senza dati ripiega su main e sola lettura', async () => {
    stub(() => json({}))
    expect(await fetchRepoMeta('t', 'anna', 'spesa')).toEqual({ defaultBranch: 'main', canPush: false })
  })

  it('un repo che non si vede lancia', async () => {
    stub(() => json({}, 404))
    await expect(fetchRepoMeta('t', 'anna', 'spesa')).rejects.toThrow('GitHub 404')
  })
})
