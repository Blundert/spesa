import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CLASSIC_TOKEN_URL,
  connectGithub,
  fetchViewer,
  fullName,
  listAccessibleRepos,
  looksLikeToken,
} from './githubAccount'

afterEach(() => vi.unstubAllGlobals())

type Route = (url: string) => Response | undefined
function stubFetch(route: Route) {
  const calls: Array<{ url: string; auth: string | undefined }> = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      calls.push({ url: String(input), auth: (init?.headers as Record<string, string> | undefined)?.Authorization })
      return route(String(input)) ?? new Response('{}', { status: 404 })
    }),
  )
  return calls
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status })
const repo = (name: string, owner = 'matteo', push = true, priv = true) => ({
  name,
  private: priv,
  owner: { login: owner },
  permissions: { push },
})

describe('CLASSIC_TOKEN_URL', () => {
  it('chiede il permesso repo e compila il nome', () => {
    const u = new URL(CLASSIC_TOKEN_URL)
    expect(u.origin + u.pathname).toBe('https://github.com/settings/tokens/new')
    expect(u.searchParams.get('scopes')).toBe('repo')
    expect(u.searchParams.get('description')).toBe('Spesa')
  })
})

describe('looksLikeToken', () => {
  it('riconosce i token GitHub, anche con spazi attorno', () => {
    expect(looksLikeToken('ghp_' + 'a'.repeat(36))).toBe(true)
    expect(looksLikeToken('  github_pat_' + 'A1_'.repeat(10) + '\n')).toBe(true)
    expect(looksLikeToken('gho_' + 'b'.repeat(30))).toBe(true)
  })

  it('rifiuta il resto', () => {
    expect(looksLikeToken('')).toBe(false)
    expect(looksLikeToken('ghp_corto')).toBe(false)
    expect(looksLikeToken('una lista della spesa: latte, pane')).toBe(false)
    expect(looksLikeToken('ghp_' + 'a'.repeat(36) + ' altro')).toBe(false)
  })
})

describe('fullName', () => {
  it('unisce owner e repo', () => expect(fullName({ owner: 'anna', repo: 'spesa' })).toBe('anna/spesa'))
})

describe('fetchViewer', () => {
  it('legge il login mandando il token', async () => {
    const calls = stubFetch((u) => (u === 'https://api.github.com/user' ? json({ login: 'matteo' }) : undefined))
    expect(await fetchViewer('tok')).toBe('matteo')
    expect(calls[0].auth).toBe('Bearer tok')
  })

  it('con un token non valido lancia con lo stato', async () => {
    stubFetch(() => json({ message: 'Bad credentials' }, 401))
    await expect(fetchViewer('x')).rejects.toThrow('GitHub 401')
  })

  it('senza login nella risposta lancia', async () => {
    stubFetch(() => json({}))
    await expect(fetchViewer('x')).rejects.toThrow('senza login')
  })
})

describe('listAccessibleRepos', () => {
  it('mappa owner, nome, permesso di scrittura e privacy', async () => {
    stubFetch(() => json([repo('spesa'), repo('lista-casa', 'anna', false, false), { name: 'x', owner: { login: 'o' } }]))
    expect(await listAccessibleRepos('t')).toEqual([
      { owner: 'matteo', repo: 'spesa', canPush: true, private: true },
      { owner: 'anna', repo: 'lista-casa', canPush: false, private: false },
      { owner: 'o', repo: 'x', canPush: false, private: false },
    ])
  })

  it('chiede proprietà, collaborazioni e organizzazioni, i più recenti per primi', async () => {
    const calls = stubFetch(() => json([]))
    await listAccessibleRepos('t')
    expect(calls[0].url).toContain('affiliation=owner,collaborator,organization_member')
    expect(calls[0].url).toContain('sort=pushed')
  })

  it('segue le pagine finché sono piene e si ferma al limite', async () => {
    const full = Array.from({ length: 100 }, (_, i) => repo(`r${i}`))
    const calls = stubFetch((u) => (u.includes('page=2') ? json([repo('ultimo')]) : json(full)))
    const repos = await listAccessibleRepos('t')
    expect(repos).toHaveLength(101)
    expect(calls).toHaveLength(2)

    const endless = stubFetch(() => json(full))
    expect(await listAccessibleRepos('t')).toHaveLength(500)
    expect(endless).toHaveLength(5)
  })

  it('con un errore lancia con lo stato', async () => {
    stubFetch(() => json({}, 500))
    await expect(listAccessibleRepos('t')).rejects.toThrow('GitHub 500')
  })
})

describe('connectGithub', () => {
  it('dà login e repo', async () => {
    stubFetch((u) => (u.endsWith('/user') ? json({ login: 'matteo' }) : json([repo('spesa')])))
    expect(await connectGithub('t')).toEqual({
      login: 'matteo',
      repos: [{ owner: 'matteo', repo: 'spesa', canPush: true, private: true }],
    })
  })

  it('se il token non vale non chiede i repo', async () => {
    const calls = stubFetch(() => json({}, 401))
    await expect(connectGithub('t')).rejects.toThrow('GitHub 401')
    expect(calls).toHaveLength(1)
  })
})
