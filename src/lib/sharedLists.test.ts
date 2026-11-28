import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../db/db'
import type { ShoppingList, SharedLink } from '../db/types'
import { FakeGithub } from './fakeGithub'
import { getGitConfig, setGitConfig } from './gitSync'
import {
  SharedListError,
  defaultRepoName,
  displayName,
  inviteToList,
  isReadOnly,
  isValidRepoName,
  joinSharedList,
  setMember,
  shareList,
  unlinkSharedList,
  type SharedListErrorCode,
} from './sharedLists'
import { SHARED_FORMAT, SHARED_VERSION, serializeSharedFile, parseSharedFile, type SharedListFile } from './sharedListFile'

const LINK: SharedLink = {
  uid: 'lista-1', owner: 'anna', repo: 'spesa', branch: 'main', path: 'lista.json',
  me: 'matteo', canWrite: true, members: {}, tombstones: {},
}
const rFile = (over: Partial<SharedListFile> = {}): SharedListFile => ({
  format: SHARED_FORMAT, version: SHARED_VERSION, uid: 'lista-9', name: 'Casa di Anna', nameUpdatedAt: 0,
  items: [{ uid: 'a', name: 'Uova', categoryName: 'Frigo', quantity: 2, addedAt: 1000, addedBy: 'anna', updatedAt: 1500, takenBy: null }],
  tombstones: {}, sessions: [], ...over,
})

let gh: FakeGithub
let store: Map<string, string>
/** Risposte per gli endpoint che FakeGithub non conosce (repo, inviti). */
let api: (method: string, url: string) => Response | Error | undefined

const codeOf = async (p: Promise<unknown>): Promise<SharedListErrorCode> => {
  try {
    await p
  } catch (e) {
    expect(e).toBeInstanceOf(SharedListError)
    return (e as SharedListError).code
  }
  throw new Error('doveva lanciare')
}
const res = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status })

beforeEach(async () => {
  store = new Map()
  vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) })
  setGitConfig({ token: 't', login: 'matteo', owner: '', repo: '', branch: 'main', path: 'spesa-db.json' })
  gh = new FakeGithub()
  api = () => undefined
  gh.override = (m, u) => api(m, u)
  vi.stubGlobal('fetch', gh.fetch)
  await Promise.all([db.categories.clear(), db.items.clear(), db.listItems.clear(), db.shoppingLists.clear(), db.sessions.clear(), db.purchases.clear(), db.supermarkets.clear()])
  await db.categories.bulkAdd([{ id: 1, name: 'Frigo', sortOrder: 0 }, { id: 2, name: 'Altro', sortOrder: 1 }])
  await db.shoppingLists.add({ id: 1, name: 'Casa', supermarketId: null, sortOrder: 0, archivedAt: null })
})
afterEach(() => vi.unstubAllGlobals())

describe('isReadOnly', () => {
  it('è vero solo per una lista condivisa senza permesso di scrittura', () => {
    const base: ShoppingList = { name: 'x', supermarketId: null, sortOrder: 0, archivedAt: null }
    expect(isReadOnly(undefined)).toBe(false)
    expect(isReadOnly(base)).toBe(false)
    expect(isReadOnly({ ...base, shared: LINK })).toBe(false)
    expect(isReadOnly({ ...base, shared: { ...LINK, canWrite: false } })).toBe(true)
  })
})

describe('displayName', () => {
  it('usa il nome scelto, altrimenti il login', () => {
    const link = { ...LINK, members: { anna: { label: 'Anna', kind: 'partner' as const }, luca: { label: '', kind: 'stranger' as const } } }
    expect(displayName(link, 'anna')).toBe('Anna')
    expect(displayName(link, 'luca')).toBe('luca')
    expect(displayName(link, 'sconosciuto')).toBe('sconosciuto')
    expect(displayName(undefined, 'anna')).toBe('anna')
  })
})

describe('defaultRepoName / isValidRepoName', () => {
  it('toglie accenti e simboli e ha un nome di ripiego', () => {
    expect(defaultRepoName('Casa di Nonna')).toBe('spesa-casa-di-nonna')
    expect(defaultRepoName('  Pasqua è già qui! ')).toBe('spesa-pasqua-e-gia-qui')
    expect(defaultRepoName('???')).toBe('spesa-lista')
    expect(defaultRepoName('a'.repeat(80))).toBe('spesa-' + 'a'.repeat(50))
    expect(defaultRepoName('x'.repeat(49) + ' yyy')).toBe('spesa-' + 'x'.repeat(49))
  })

  it('valida i nomi di repo', () => {
    expect(isValidRepoName('spesa-casa_1.2')).toBe(true)
    expect(isValidRepoName('con spazi')).toBe(false)
    expect(isValidRepoName('a/b')).toBe(false)
    expect(isValidRepoName('')).toBe(false)
    expect(isValidRepoName('..')).toBe(false)
  })
})

describe('shareList', () => {
  const created = () => res({ name: 'spesa-casa', owner: { login: 'matteo' }, default_branch: 'main' }, 201)

  it('crea il repo, collega la lista, scrive il file e invita', async () => {
    await db.items.add({ id: 1, name: 'Latte', normalizedName: 'latte', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null })
    await db.listItems.add({ listId: 1, itemId: 1, quantity: 2, addedAt: 5 })
    const seen: string[] = []
    api = (m, u) => {
      seen.push(`${m} ${u.replace('https://api.github.com', '')}`)
      if (m === 'POST' && u.endsWith('/user/repos')) return created()
      if (m === 'PUT' && u.includes('/collaborators/')) return res({}, 201)
      if (u === 'https://api.github.com/repos/matteo/spesa-casa') return res({ permissions: { push: true } })
      return undefined
    }
    const r = await shareList(1, { repoName: 'spesa-casa', invite: { username: ' anna ', permission: 'push' } })
    expect(r).toEqual({ owner: 'matteo', repo: 'spesa-casa', invite: 'invited', pending: false })
    const list = await db.shoppingLists.get(1)
    expect(list?.shared).toMatchObject({ owner: 'matteo', repo: 'spesa-casa', path: 'lista.json', me: 'matteo', canWrite: true })
    expect(list?.shared?.sharedSince).toBeGreaterThan(0)
    expect(list?.shared?.lastSha).toBeTruthy()
    expect(parseSharedFile(gh.files.get('lista.json') as string)).toMatchObject({ name: 'Casa', uid: list?.shared?.uid })
    expect(parseSharedFile(gh.files.get('lista.json') as string).items.map((i) => i.name)).toEqual(['Latte'])
    expect(seen).toContain('PUT /repos/matteo/spesa-casa/collaborators/anna')
  })

  it('senza invito non invita; se l\'invito fallisce la lista resta condivisa', async () => {
    api = (m, u) => {
      if (m === 'POST' && u.endsWith('/user/repos')) return created()
      if (u === 'https://api.github.com/repos/matteo/spesa-casa') return res({ permissions: { push: true } })
      if (u.includes('/collaborators/')) return res({}, 404)
      return undefined
    }
    expect((await shareList(1, { repoName: 'spesa-casa' })).invite).toBe('none')
    await unlinkSharedList(1)
    gh.files.clear() // un repo nuovo e vuoto
    const r = await shareList(1, { repoName: 'spesa-casa', invite: { username: 'nessuno', permission: 'pull' } })
    expect(r.invite).toBe('failed')
    expect((await db.shoppingLists.get(1))?.shared).toBeDefined()
  })

  it('senza collegamento a GitHub o con un nome non valido non fa niente', async () => {
    setGitConfig({ token: '', login: '', owner: '', repo: '', branch: 'main', path: 'spesa-db.json' })
    expect(await codeOf(shareList(1, { repoName: 'spesa-casa' }))).toBe('not-connected')
    setGitConfig({ token: 't', login: 'matteo', owner: '', repo: '', branch: 'main', path: 'spesa-db.json' })
    expect(await codeOf(shareList(1, { repoName: 'no no' }))).toBe('invalid-name')
    expect((await db.shoppingLists.get(1))?.shared).toBeUndefined()
  })

  it('con un token inserito a mano (senza login salvato) chiede il login a GitHub, lo ricorda e condivide', async () => {
    setGitConfig({ token: 't', login: '', owner: '', repo: '', branch: 'main', path: 'spesa-db.json' })
    api = (m, u) => {
      if (u === 'https://api.github.com/user') return res({ login: 'matteo' })
      if (m === 'POST' && u.endsWith('/user/repos')) return created()
      if (u === 'https://api.github.com/repos/matteo/spesa-casa') return res({ permissions: { push: true } })
      return undefined
    }
    await shareList(1, { repoName: 'spesa-casa' })
    expect(getGitConfig().login).toBe('matteo')
    expect((await db.shoppingLists.get(1))?.shared?.me).toBe('matteo')
  })

  it('un token senza login che GitHub non accetta (o un errore diverso) non condivide', async () => {
    setGitConfig({ token: 't', login: '', owner: '', repo: '', branch: 'main', path: 'spesa-db.json' })
    for (const status of [401, 403]) {
      api = () => res({}, status)
      expect(await codeOf(shareList(1, { repoName: 'spesa-casa' }))).toBe('not-connected')
    }
    api = () => res({}, 500)
    await expect(shareList(1, { repoName: 'spesa-casa' })).rejects.toThrow('GitHub 500')
    expect((await db.shoppingLists.get(1))?.shared).toBeUndefined()
    expect(getGitConfig().login).toBe('')
  })

  it('se la prima scrittura va in conflitto o manca la rete la lista resta condivisa e il lavoro lo finisce la sync dopo', async () => {
    for (const fail of [new Response('{}', { status: 409 }), new TypeError('offline')]) {
      await unlinkSharedList(1)
      gh.files.clear()
      api = (m, u) => {
        if (m === 'POST' && u.endsWith('/user/repos')) return created()
        if (u === 'https://api.github.com/repos/matteo/spesa-casa') return res({ permissions: { push: true } })
        if (m === 'PUT' && u.includes('/contents/')) return fail
        return undefined
      }
      const r = await shareList(1, { repoName: 'spesa-casa' })
      expect(r.pending).toBe(true)
      expect((await db.shoppingLists.get(1))?.shared).toBeDefined()
    }
  })

  it('un repo con quel nome già mio e senza lista (resto di un tentativo a metà) si riusa', async () => {
    api = (m, u) => {
      if (m === 'POST' && u.endsWith('/user/repos')) return res({ message: 'name already exists' }, 422)
      if (u === 'https://api.github.com/repos/matteo/spesa-casa') return res({ default_branch: 'main', permissions: { push: true } })
      return undefined
    }
    const r = await shareList(1, { repoName: 'spesa-casa' })
    expect(r).toMatchObject({ owner: 'matteo', repo: 'spesa-casa', pending: false })
    expect(gh.files.get('lista.json')).toBeDefined()
    expect((await db.shoppingLists.get(1))?.shared?.owner).toBe('matteo')
  })

  it('un repo con quel nome che non si può riusare dà "esiste già"', async () => {
    const taken = (m: string, u: string) => (m === 'POST' && u.endsWith('/user/repos') ? res({}, 422) : undefined)
    // senza permesso di scrittura
    api = (m, u) => taken(m, u) ?? (u === 'https://api.github.com/repos/matteo/spesa-casa' ? res({ permissions: { push: false } }) : undefined)
    expect(await codeOf(shareList(1, { repoName: 'spesa-casa' }))).toBe('name-taken')
    // ha già una lista condivisa dentro
    gh.files.set('lista.json', '{}')
    api = (m, u) => taken(m, u) ?? (u === 'https://api.github.com/repos/matteo/spesa-casa' ? res({ permissions: { push: true } }) : undefined)
    expect(await codeOf(shareList(1, { repoName: 'spesa-casa' }))).toBe('name-taken')
    // il repo non si vede
    gh.files.clear()
    api = (m, u) => taken(m, u) ?? (u === 'https://api.github.com/repos/matteo/spesa-casa' ? res({}, 404) : undefined)
    expect(await codeOf(shareList(1, { repoName: 'spesa-casa' }))).toBe('name-taken')
    expect((await db.shoppingLists.get(1))?.shared).toBeUndefined()
  })

  it('traduce gli errori nella creazione del repo', async () => {
    for (const [status, code] of [[422, 'name-taken'], [403, 'no-permission'], [401, 'not-connected']] as const) {
      api = (m, u) => (m === 'POST' && u.endsWith('/user/repos') ? res({}, status) : undefined)
      expect(await codeOf(shareList(1, { repoName: 'spesa-casa' }))).toBe(code)
    }
    api = (m, u) => (m === 'POST' && u.endsWith('/user/repos') ? res({}, 500) : undefined)
    await expect(shareList(1, { repoName: 'spesa-casa' })).rejects.toThrow('GitHub 500')
    expect((await db.shoppingLists.get(1))?.shared).toBeUndefined()
  })

  it('un errore che non è un Error passa com\'è', async () => {
    vi.stubGlobal('fetch', () => Promise.reject('boom'))
    await expect(shareList(1, { repoName: 'spesa-casa' })).rejects.toBe('boom')
  })

  it('se la prima sync fallisce la lista torna normale', async () => {
    api = (m, u) => {
      if (m === 'POST' && u.endsWith('/user/repos')) return created()
      if (u === 'https://api.github.com/repos/matteo/spesa-casa') return res({}, 403)
      return undefined
    }
    await expect(shareList(1, { repoName: 'spesa-casa' })).rejects.toMatchObject({ code: 'no-access' })
    expect((await db.shoppingLists.get(1))?.shared).toBeUndefined()
  })
})

describe('inviteToList', () => {
  beforeEach(async () => {
    await db.shoppingLists.update(1, { shared: LINK })
  })

  it('invita sul repo della lista', async () => {
    api = (m, u) => (m === 'PUT' && u === 'https://api.github.com/repos/anna/spesa/collaborators/luca' ? res({}, 201) : undefined)
    expect(await inviteToList(1, ' luca ', 'pull')).toBe('invited')
    api = () => new Response(null, { status: 204 })
    expect(await inviteToList(1, 'luca', 'pull')).toBe('already')
  })

  it('traduce gli errori e rifiuta liste non condivise o senza collegamento', async () => {
    for (const [status, code] of [[404, 'user-not-found'], [422, 'cannot-invite'], [403, 'no-permission'], [401, 'not-connected']] as const) {
      api = () => res({}, status)
      expect(await codeOf(inviteToList(1, 'luca', 'push'))).toBe(code)
    }
    api = () => res({}, 500)
    await expect(inviteToList(1, 'luca', 'push')).rejects.toThrow('GitHub 500')
    await db.shoppingLists.update(1, { shared: undefined })
    await expect(inviteToList(1, 'luca', 'push')).rejects.toThrow('non condivisa')
    setGitConfig({ token: '', login: '', owner: '', repo: '', branch: 'main', path: 'spesa-db.json' })
    expect(await codeOf(inviteToList(1, 'luca', 'push'))).toBe('not-connected')
  })
})

describe('joinSharedList', () => {
  const meta = (push = true) => (_m: string, u: string) =>
    u === 'https://api.github.com/repos/anna/spesa' ? res({ default_branch: 'main', permissions: { push } }) : undefined
  const putRemote = (f: SharedListFile) => gh.files.set('lista.json', serializeSharedFile(f))

  it('aggiunge la lista con il nome del file, le sue voci e il permesso del repo', async () => {
    api = meta(true)
    putRemote(rFile())
    const id = await joinSharedList({ owner: 'anna', repo: 'spesa' })
    const list = await db.shoppingLists.get(id)
    expect(list).toMatchObject({ name: 'Casa di Anna' })
    expect(list?.shared).toMatchObject({ uid: 'lista-9', owner: 'anna', repo: 'spesa', me: 'matteo', canWrite: true })
    expect(list?.shared?.sharedSince).toBeGreaterThan(0)
    expect(list?.shared?.members.anna).toEqual({ label: '', kind: 'stranger' })
    const rows = await db.listItems.where('listId').equals(id).toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ quantity: 2, uid: 'a', addedBy: 'anna' })
  })

  it('in sola lettura ricorda il permesso', async () => {
    api = meta(false)
    putRemote(rFile())
    const id = await joinSharedList({ owner: 'anna', repo: 'spesa' })
    expect((await db.shoppingLists.get(id))?.shared?.canWrite).toBe(false)
  })

  it('non la aggiunge due volte', async () => {
    api = meta(true)
    putRemote(rFile())
    const id = await joinSharedList({ owner: 'anna', repo: 'spesa' })
    const err = await joinSharedList({ owner: 'anna', repo: 'spesa' }).catch((e: unknown) => e)
    expect(err).toMatchObject({ code: 'already-joined', listId: id })
    expect(await db.shoppingLists.count()).toBe(2)
  })

  it('repo non visibile, lista non ancora pronta o file non valido', async () => {
    api = () => res({}, 404)
    expect(await codeOf(joinSharedList({ owner: 'anna', repo: 'spesa' }))).toBe('no-access')
    api = () => res({}, 403)
    expect(await codeOf(joinSharedList({ owner: 'anna', repo: 'spesa' }))).toBe('no-access')
    api = () => res({}, 401)
    expect(await codeOf(joinSharedList({ owner: 'anna', repo: 'spesa' }))).toBe('not-connected')
    api = (_m, u) => (u === 'https://api.github.com/repos/anna/spesa' ? res({ permissions: { push: true } }) : undefined)
    expect(await codeOf(joinSharedList({ owner: 'anna', repo: 'spesa' }))).toBe('not-ready')
    gh.files.set('lista.json', 'non è json')
    expect(await codeOf(joinSharedList({ owner: 'anna', repo: 'spesa' }))).toBe('invalid')
    expect(await db.shoppingLists.count()).toBe(1)
  })

  it('un errore imprevisto nel controllo del repo passa com\'è, senza collegamento non parte', async () => {
    api = () => res({}, 500)
    await expect(joinSharedList({ owner: 'anna', repo: 'spesa' })).rejects.toThrow('GitHub 500')
    setGitConfig({ token: '', login: '', owner: '', repo: '', branch: 'main', path: 'spesa-db.json' })
    expect(await codeOf(joinSharedList({ owner: 'anna', repo: 'spesa' }))).toBe('not-connected')
  })

  it('se la prima sync fallisce la lista non resta', async () => {
    api = meta(true)
    putRemote(rFile())
    const base = gh.override
    let contents = 0
    gh.override = (m, u) => (u.includes('/contents/') && ++contents === 2 ? new Response('{}', { status: 500 }) : base?.(m, u))
    await expect(joinSharedList({ owner: 'anna', repo: 'spesa' })).rejects.toThrow('GitHub 500')
    expect(await db.shoppingLists.count()).toBe(1)
  })
})

describe('unlinkSharedList / setMember', () => {
  it('scollegare lascia una lista normale con i suoi articoli', async () => {
    await db.shoppingLists.update(1, { shared: LINK })
    await db.items.add({ id: 1, name: 'Latte', normalizedName: 'latte', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null })
    await db.listItems.add({ listId: 1, itemId: 1, quantity: 1, addedAt: 1, uid: 'u' })
    await unlinkSharedList(1)
    expect((await db.shoppingLists.get(1))?.shared).toBeUndefined()
    expect(await db.listItems.count()).toBe(1)
  })

  it('cambia nome e tipo di una persona, anche nuova, e lascia gli altri', async () => {
    await db.shoppingLists.update(1, { shared: { ...LINK, members: { luca: { label: 'Luca', kind: 'partner' } } } })
    await setMember(1, 'anna', { label: 'Anna' })
    await setMember(1, 'anna', { kind: 'partner' })
    await setMember(1, 'luca', { kind: 'stranger' })
    const m = (await db.shoppingLists.get(1))?.shared?.members
    expect(m?.anna).toEqual({ label: 'Anna', kind: 'partner' })
    expect(m?.luca).toEqual({ label: 'Luca', kind: 'stranger' })
    await db.shoppingLists.update(1, { shared: undefined })
    await expect(setMember(1, 'anna', { label: 'x' })).rejects.toThrow('non condivisa')
  })

  it('passare una persona a partner (o a estraneo) cambia se le sue spese contano', async () => {
    await db.shoppingLists.update(1, { shared: { ...LINK, members: { anna: { label: 'Anna', kind: 'stranger' } } } })
    await db.sessions.add({
      isoWeek: 'w', supermarketId: 1, listId: 1, startedAt: 1, finishedAt: 2, confirmedTotalCents: 1,
      buoniSpent: 1, buoniValueCents: 800, doneBy: 'anna', uncounted: true,
    })
    await setMember(1, 'anna', { kind: 'partner' })
    expect((await db.sessions.toArray())[0].uncounted).toBeUndefined()
    await setMember(1, 'anna', { kind: 'stranger' })
    expect((await db.sessions.toArray())[0].uncounted).toBe(true)
  })
})
