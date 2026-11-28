import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { connectGithub, fetchViewer, listAccessibleRepos } from './githubAccount'
import { fetchRepoMeta, listInvitations } from './githubRepos'
import { getRemoteFile, listBranches, listRemoteHistory, setGitConfig, type GitConfig } from './gitSync'

const CFG: GitConfig = { token: 't', login: 'matteo', owner: 'anna', repo: 'spesa', branch: 'main', path: 'lista.json' }

let calls: Array<{ url: string; method: string; cache: RequestCache | undefined }>

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) })
  setGitConfig(CFG)
  calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      calls.push({ url: String(input), method: init?.method ?? 'GET', cache: init?.cache })
      return new Response(JSON.stringify({ login: 'matteo', content: '', default_branch: 'main' }), { status: 200 })
    }),
  )
})
afterEach(() => vi.unstubAllGlobals())

/** GitHub risponde con `max-age=60`: senza `no-store` il browser riusa per un minuto contenuto e sha vecchi. */
describe('letture da GitHub: mai dalla cache del browser', () => {
  it('ogni funzione che legge dall\'API chiede il dato fresco', async () => {
    await getRemoteFile(CFG)
    await fetchViewer('t')
    await listAccessibleRepos('t').catch(() => undefined)
    await fetchRepoMeta('t', 'anna', 'spesa')
    await listInvitations('t').catch(() => undefined)
    await connectGithub('t').catch(() => undefined)
    await listBranches().catch(() => undefined)
    await listRemoteHistory().catch(() => undefined)
    expect(calls.length).toBeGreaterThanOrEqual(8)
    const reads = calls.filter((c) => c.method === 'GET')
    expect(reads.length).toBeGreaterThanOrEqual(8)
    for (const c of reads) expect(c.cache, c.url).toBe('no-store')
  })
})
