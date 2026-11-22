import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../db/db'
import type { SharedLink } from '../db/types'
import { FakeGithub } from './fakeGithub'
import { setGitConfig } from './gitSync'
import { SharedSyncError, syncSharedList, type SharedSyncCode } from './sharedSync'
import {
  SHARED_FORMAT,
  SHARED_VERSION,
  parseSharedFile,
  serializeSharedFile,
  type SharedItem,
  type SharedListFile,
} from './sharedListFile'

const NOW = 1_800_000_000_000
const REPO_URL = 'https://api.github.com/repos/anna/spesa'
const PATH = 'lista.json'

const LINK: SharedLink = {
  uid: 'lista-1', owner: 'anna', repo: 'spesa', branch: 'main', path: PATH,
  me: 'matteo', canWrite: true, members: {}, tombstones: {},
}

let gh: FakeGithub
let store: Map<string, string>
/** Permesso di scrittura che GitHub dichiara per il repo (null = il repo non si vede). */
let push: boolean | null

const rItem = (uid: string, name: string, over: Partial<SharedItem> = {}): SharedItem => ({
  uid, name, categoryName: 'Frigo', quantity: 1, addedAt: 1000, addedBy: 'anna', updatedAt: NOW - 5000, takenBy: null, ...over,
})
const rFile = (over: Partial<SharedListFile> = {}): SharedListFile => ({
  format: SHARED_FORMAT, version: SHARED_VERSION, uid: 'lista-1', name: 'Casa', nameUpdatedAt: 0,
  items: [], tombstones: {}, sessions: [], ...over,
})
const putRemote = (f: SharedListFile) => gh.files.set(PATH, serializeSharedFile(f))
const remote = () => parseSharedFile(gh.files.get(PATH) as string)
const names = async () => (await db.items.toArray()).filter((i) => i.name).length

async function localNames(): Promise<string[]> {
  const rows = await db.listItems.where('listId').equals(1).toArray()
  const items = await db.items.bulkGet(rows.map((r) => r.itemId))
  return items.map((i) => i?.name as string).sort()
}

async function setup(link: Partial<SharedLink> = {}) {
  await Promise.all([db.categories.clear(), db.items.clear(), db.listItems.clear(), db.shoppingLists.clear()])
  await db.categories.bulkAdd([{ id: 1, name: 'Frigo', sortOrder: 0 }, { id: 2, name: 'Altro', sortOrder: 1 }])
  await db.shoppingLists.add({ id: 1, name: 'Casa', supermarketId: null, sortOrder: 0, archivedAt: null, shared: { ...LINK, ...link } })
}
async function addLocal(name: string, uid: string, updatedAt = NOW - 1000) {
  const itemId = (await db.items.add({ name, normalizedName: name.toLowerCase(), categoryId: 1, lastPriceCents: null, suggestedPriceCents: null })) as number
  await db.listItems.add({ listId: 1, itemId, quantity: 1, addedAt: 2000, uid, updatedAt, addedBy: 'matteo' })
}
const link = async () => (await db.shoppingLists.get(1))?.shared as SharedLink
const codeOf = async (p: Promise<unknown>): Promise<SharedSyncCode> => {
  try {
    await p
  } catch (e) {
    expect(e).toBeInstanceOf(SharedSyncError)
    return (e as SharedSyncError).code
  }
  throw new Error('doveva lanciare')
}

beforeEach(async () => {
  store = new Map()
  vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) })
  setGitConfig({ token: 't', login: 'matteo', owner: '', repo: '', branch: 'main', path: 'spesa-db.json' })
  gh = new FakeGithub()
  push = true
  gh.override = (_m, url) => {
    if (url !== REPO_URL) return undefined
    if (push === null) return new Response('{}', { status: 404 })
    return new Response(JSON.stringify({ permissions: { push } }), { status: 200 })
  }
  vi.stubGlobal('fetch', gh.fetch)
  await setup()
})
afterEach(() => vi.unstubAllGlobals())

describe('syncSharedList: prima volta', () => {
  it('con il repo vuoto crea il file con la lista locale', async () => {
    await addLocal('Latte', 'v1')
    const r = await syncSharedList(1, NOW)
    expect(r).toEqual({ changed: false, pushed: true, canWrite: true })
    expect(remote().items.map((i) => i.name)).toEqual(['Latte'])
    expect(remote().uid).toBe('lista-1')
    expect((await link()).lastSha).toBeTruthy()
    const put = gh.calls.find((c) => c.method === 'PUT')
    expect((put?.body as { message: string }).message).toBe('Aggiorna lista (matteo)')
  })

  it('con il repo vuoto e senza permesso di scrittura dice sola lettura; senza accesso dice no-access', async () => {
    push = false
    expect(await codeOf(syncSharedList(1, NOW))).toBe('read-only')
    push = null
    expect(await codeOf(syncSharedList(1, NOW))).toBe('no-access')
  })

  it('chi aggiunge una lista esistente scarica tutto e non scrive', async () => {
    await setup({ lastSha: undefined })
    putRemote(rFile({ items: [rItem('a', 'Uova'), rItem('b', 'Pane', { addedAt: 1500 })] }))
    const commits = gh.commits
    const r = await syncSharedList(1, NOW)
    expect(r).toEqual({ changed: true, pushed: false, canWrite: true })
    expect(await localNames()).toEqual(['Pane', 'Uova'])
    expect(gh.commits).toBe(commits)
    expect((await link()).lastSha).toBe(FakeGithub.sha(gh.files.get(PATH) as string))
  })

  it('la prima sync con voci locali le unisce senza scrivere; la seconda le scrive', async () => {
    putRemote(rFile({ items: [rItem('a', 'Uova')] }))
    await addLocal('Latte', 'v1')
    const commits = gh.commits
    const first = await syncSharedList(1, NOW)
    expect(first.pushed).toBe(false)
    expect(gh.commits).toBe(commits)
    expect(await localNames()).toEqual(['Latte', 'Uova'])
    const second = await syncSharedList(1, NOW + 1)
    expect(second.pushed).toBe(true)
    expect(remote().items.map((i) => i.name).sort()).toEqual(['Latte', 'Uova'])
  })

  it('la prima sync controlla il permesso di scrittura e lo ricorda', async () => {
    push = false
    putRemote(rFile({ items: [rItem('a', 'Uova')] }))
    const r = await syncSharedList(1, NOW)
    expect(r.canWrite).toBe(false)
    expect((await link()).canWrite).toBe(false)
  })
})

describe('syncSharedList: sync normali', () => {
  beforeEach(async () => {
    putRemote(rFile({ items: [rItem('a', 'Uova')] }))
    await syncSharedList(1, NOW) // prima sync: scarica
  })

  it('una voce aggiunta qui viene scritta nel repo', async () => {
    await addLocal('Latte', 'v1')
    const r = await syncSharedList(1, NOW + 10)
    expect(r).toMatchObject({ pushed: true, changed: false })
    expect(remote().items.map((i) => i.name).sort()).toEqual(['Latte', 'Uova'])
    expect((await link()).lastSha).toBe(FakeGithub.sha(gh.files.get(PATH) as string))
  })

  it('senza novità non scrive e non cambia niente', async () => {
    const commits = gh.commits
    expect(await syncSharedList(1, NOW + 10)).toEqual({ changed: false, pushed: false, canWrite: true })
    expect(gh.commits).toBe(commits)
  })

  it('le novità degli altri arrivano qui e non si riscrive', async () => {
    putRemote(rFile({ items: [rItem('a', 'Uova'), rItem('b', 'Pane', { addedAt: 1500 })] }))
    const commits = gh.commits
    expect(await syncSharedList(1, NOW + 10)).toEqual({ changed: true, pushed: false, canWrite: true })
    expect(await localNames()).toEqual(['Pane', 'Uova'])
    expect(gh.commits).toBe(commits)
  })

  it('un\'eliminazione fatta qui arriva nel repo e quella degli altri arriva qui', async () => {
    const row = (await db.listItems.toArray())[0]
    await db.listItems.delete(row.id as number)
    await db.shoppingLists.update(1, { shared: { ...(await link()), tombstones: { a: NOW + 5 } } })
    await syncSharedList(1, NOW + 10)
    expect(remote().items).toEqual([])
    expect(remote().tombstones).toEqual({ a: NOW + 5 })
    putRemote(rFile({ items: [], tombstones: { a: NOW + 5 }, name: 'Casa' }))
    await addLocal('Sale', 's1')
    await syncSharedList(1, NOW + 20)
    expect(await localNames()).toEqual(['Sale'])
  })

  it('dopo un conflitto di scrittura riprova e ce la fa', async () => {
    await addLocal('Latte', 'v1')
    let puts = 0
    const base = gh.override
    gh.override = (m, u) => (m === 'PUT' && ++puts === 1 ? new Response('{}', { status: 409 }) : base?.(m, u))
    const r = await syncSharedList(1, NOW + 10)
    expect(r.pushed).toBe(true)
    expect(puts).toBe(2)
  })

  it('se i conflitti non finiscono si ferma con "conflict"', async () => {
    await addLocal('Latte', 'v1')
    const base = gh.override
    gh.override = (m, u) => (m === 'PUT' ? new Response('{}', { status: 422 }) : base?.(m, u))
    expect(await codeOf(syncSharedList(1, NOW + 10))).toBe('conflict')
  })

  it('403 in scrittura: ricorda che è sola lettura', async () => {
    await addLocal('Latte', 'v1')
    const base = gh.override
    gh.override = (m, u) => (m === 'PUT' ? new Response('{}', { status: 403 }) : base?.(m, u))
    expect(await codeOf(syncSharedList(1, NOW + 10))).toBe('read-only')
    expect((await link()).canWrite).toBe(false)
  })

  it('un altro errore in scrittura passa com\'è', async () => {
    await addLocal('Latte', 'v1')
    const base = gh.override
    gh.override = (m, u) => (m === 'PUT' ? new Response('boom', { status: 500 }) : base?.(m, u))
    await expect(syncSharedList(1, NOW + 10)).rejects.toThrow('GitHub 500')
  })
})

describe('syncSharedList: sola lettura', () => {
  it('la copia locale diventa quella del repo e non si scrive mai', async () => {
    push = false
    putRemote(rFile({ items: [rItem('a', 'Uova')] }))
    await syncSharedList(1, NOW)
    await addLocal('Latte', 'v1') // non dovrebbe esistere, ma se c'è non va nel repo
    const commits = gh.commits
    const r = await syncSharedList(1, NOW + 10)
    expect(r).toEqual({ changed: true, pushed: false, canWrite: false })
    expect(await localNames()).toEqual(['Uova'])
    expect(gh.commits).toBe(commits)
  })
})

describe('syncSharedList: collisione alla creazione', () => {
  it('se il file compare nel frattempo riprova e unisce', async () => {
    await addLocal('Latte', 'v1')
    let puts = 0
    const base = gh.override
    gh.override = (m, u) => {
      if (m === 'PUT' && ++puts === 1) {
        putRemote(rFile({ items: [rItem('a', 'Uova')] }))
        return new Response('{}', { status: 422 })
      }
      return base?.(m, u)
    }
    const r = await syncSharedList(1, NOW)
    expect(r.pushed).toBe(false) // seconda passata = prima sync con il file presente: solo unione
    expect(await localNames()).toEqual(['Latte', 'Uova'])
  })

  it('un errore diverso alla creazione passa com\'è', async () => {
    const base = gh.override
    gh.override = (m, u) => (m === 'PUT' ? new Response('boom', { status: 500 }) : base?.(m, u))
    await expect(syncSharedList(1, NOW)).rejects.toThrow('GitHub 500')
  })
})

describe('syncSharedList: errori', () => {
  it('senza token', async () => {
    setGitConfig({ token: '', login: '', owner: '', repo: '', branch: 'main', path: 'spesa-db.json' })
    expect(await codeOf(syncSharedList(1, NOW))).toBe('no-token')
  })

  it('lista non condivisa o inesistente', async () => {
    await db.shoppingLists.add({ id: 7, name: 'Mia', supermarketId: null, sortOrder: 1, archivedAt: null })
    await expect(syncSharedList(7, NOW)).rejects.toThrow('non condivisa')
    await expect(syncSharedList(404, NOW)).rejects.toThrow('non condivisa')
  })

  it('file del repo rovinato, di un\'altra lista o di una versione più nuova', async () => {
    gh.files.set(PATH, 'non è json')
    expect(await codeOf(syncSharedList(1, NOW))).toBe('invalid-remote')
    putRemote(rFile({ uid: 'altra-lista' }))
    expect(await codeOf(syncSharedList(1, NOW))).toBe('invalid-remote')
    gh.files.set(PATH, JSON.stringify({ ...rFile(), version: 99 }))
    expect(await codeOf(syncSharedList(1, NOW))).toBe('newer-format')
  })

  it('un errore imprevisto nella lettura del file passa com\'è', async () => {
    gh.override = (_m, url) => (url.includes('/contents/') ? new Response('{}', { status: 500 }) : undefined)
    await expect(syncSharedList(1, NOW)).rejects.toThrow('GitHub 500')
  })

  it('un errore che non è un Error passa com\'è', async () => {
    vi.stubGlobal('fetch', () => Promise.reject('boom'))
    await expect(syncSharedList(1, NOW)).rejects.toBe('boom')
  })

  it('401 = token non valido, 403 = niente accesso, rete assente = network', async () => {
    gh.override = () => new Response('{}', { status: 401 })
    expect(await codeOf(syncSharedList(1, NOW))).toBe('auth')
    gh.override = () => new Response('{}', { status: 403 })
    expect(await codeOf(syncSharedList(1, NOW))).toBe('no-access')
    gh.override = () => new TypeError('Failed to fetch')
    expect(await codeOf(syncSharedList(1, NOW))).toBe('network')
  })

  it('un file valido ma con dati inattesi non rompe: esempio con articoli già presenti nel catalogo', async () => {
    await db.items.add({ name: 'Uova', normalizedName: 'uova', categoryId: 2, lastPriceCents: null, suggestedPriceCents: null })
    putRemote(rFile({ items: [rItem('a', 'uova')] }))
    await syncSharedList(1, NOW)
    expect(await names()).toBe(1)
    expect(await localNames()).toEqual(['Uova'])
  })
})
