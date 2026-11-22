import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../db'
import type { SharedLink } from '../types'
import { parseSharedFile, serializeSharedFile, SHARED_FORMAT, SHARED_VERSION, type SharedListFile } from '../../lib/sharedListFile'
import { applySharedFile, exportSharedFile, patchSharedLink } from './sharedListData'

const LINK: SharedLink = {
  uid: 'lista-1',
  owner: 'anna',
  repo: 'spesa',
  branch: 'main',
  path: 'lista.json',
  me: 'matteo',
  canWrite: true,
  members: {},
  tombstones: { 'v-morta': 5 },
}

const file = (over: Partial<SharedListFile> = {}): SharedListFile => ({
  format: SHARED_FORMAT,
  version: SHARED_VERSION,
  uid: 'lista-1',
  name: 'Casa',
  nameUpdatedAt: 0,
  items: [],
  tombstones: {},
  sessions: [],
  ...over,
})

async function seed(withAltro = true) {
  await db.categories.bulkAdd([
    { id: 1, name: 'Frigo', sortOrder: 0 },
    ...(withAltro ? [{ id: 2, name: 'Altro', sortOrder: 1 }] : []),
  ])
  await db.items.bulkAdd([
    { id: 1, name: 'Latte', normalizedName: 'latte', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null },
    { id: 2, name: 'Pane', normalizedName: 'pane', categoryId: 99, lastPriceCents: null, suggestedPriceCents: null },
  ])
  await db.shoppingLists.add({ id: 1, name: 'Casa', supermarketId: null, sortOrder: 0, archivedAt: null, shared: LINK })
}

beforeEach(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} })
  await Promise.all([
    db.categories.clear(), db.items.clear(), db.listItems.clear(), db.shoppingLists.clear(),
    db.sessions.clear(), db.purchases.clear(), db.supermarkets.clear(),
  ])
})
afterEach(() => vi.unstubAllGlobals())

describe('exportSharedFile', () => {
  it('esporta nome, voci con uid e autore, e le eliminazioni; il testo passa la validazione', async () => {
    await seed()
    await db.listItems.bulkAdd([
      { id: 1, listId: 1, itemId: 1, quantity: 2, addedAt: 1000 },
      { id: 2, listId: 1, itemId: 2, quantity: 1, addedAt: 2000, uid: 'v-2', updatedAt: 3000, addedBy: 'anna', takenBy: 'anna' },
      { id: 3, listId: 2, itemId: 1, quantity: 1, addedAt: 1 }, // altra lista
      { id: 4, listId: 1, itemId: 77, quantity: 1, addedAt: 1 }, // articolo sparito dal catalogo
    ])
    const f = await exportSharedFile(1)
    expect(f).toMatchObject({ uid: 'lista-1', name: 'Casa', nameUpdatedAt: 0, tombstones: { 'v-morta': 5 }, sessions: [] })
    const latte = f.items.find((i) => i.name === 'Latte')
    expect(latte).toMatchObject({ quantity: 2, categoryName: 'Frigo', addedBy: 'matteo', updatedAt: 1000, takenBy: null })
    expect(latte?.uid).toMatch(/^[0-9a-f-]{36}$/)
    expect(f.items.find((i) => i.name === 'Pane')).toMatchObject({
      uid: 'v-2', addedBy: 'anna', updatedAt: 3000, takenBy: 'anna', categoryName: '?',
    })
    expect(f.items).toHaveLength(2)
    expect(() => parseSharedFile(serializeSharedFile(f))).not.toThrow()
    // gli uid dati restano sulle righe locali
    expect((await db.listItems.get(1))?.uid).toBe(latte?.uid)
  })

  it('un nome lungo o con caratteri di controllo viene ripulito, così il file resta valido', async () => {
    await seed()
    await db.items.update(1, { name: 'L'.repeat(200) + '\u0007' })
    await db.items.update(2, { name: '\u0001\u0002' })
    await db.shoppingLists.update(1, { name: 'Casa\u0000 nostra' })
    await db.listItems.bulkAdd([
      { listId: 1, itemId: 1, quantity: 0, addedAt: 1 },
      { listId: 1, itemId: 2, quantity: 99999, addedAt: 2 },
    ])
    const f = await exportSharedFile(1)
    expect(f.name).toBe('Casa  nostra')
    expect(f.items.map((i) => i.name)).toEqual(['L'.repeat(120), '?'])
    expect(f.items.map((i) => i.quantity)).toEqual([1, 9999])
    expect(() => parseSharedFile(serializeSharedFile(f))).not.toThrow()
  })

  it('una voce con uid ma senza autore né data prende me e la data di aggiunta', async () => {
    await seed()
    await db.listItems.add({ listId: 1, itemId: 1, quantity: 1, addedAt: 4242, uid: 'solo-uid' })
    const [one] = (await exportSharedFile(1)).items
    expect(one).toMatchObject({ uid: 'solo-uid', addedBy: 'matteo', updatedAt: 4242 })
  })

  it('rifiuta una lista non condivisa o inesistente', async () => {
    await seed()
    await db.shoppingLists.add({ id: 5, name: 'Mia', supermarketId: null, sortOrder: 1, archivedAt: null })
    await expect(exportSharedFile(5)).rejects.toThrow('non condivisa')
    await expect(exportSharedFile(404)).rejects.toThrow('non condivisa')
  })

  it('porta il momento dell\'ultimo cambio di nome', async () => {
    await seed()
    await patchSharedLink(1, { nameUpdatedAt: 777 })
    expect((await exportSharedFile(1)).nameUpdatedAt).toBe(777)
  })
})

describe('applySharedFile', () => {
  const fi = (uid: string, name: string, over = {}) => ({
    uid, name, categoryName: 'Frigo', quantity: 1, addedAt: 10, addedBy: 'anna', updatedAt: 20, takenBy: null, ...over,
  })

  it('crea le voci nuove (e gli articoli mancanti nel catalogo), aggiorna quelle cambiate, toglie quelle sparite', async () => {
    await seed()
    await db.listItems.bulkAdd([
      { id: 1, listId: 1, itemId: 1, quantity: 1, addedAt: 1, uid: 'v-latte', updatedAt: 1, addedBy: 'matteo' },
      { id: 2, listId: 1, itemId: 2, quantity: 1, addedAt: 1, uid: 'v-pane', updatedAt: 1, addedBy: 'matteo' },
      { id: 3, listId: 2, itemId: 1, quantity: 1, addedAt: 1, uid: 'altra-lista' },
    ])
    await applySharedFile(
      1,
      file({
        items: [
          fi('v-latte', 'Latte', { quantity: 4, takenBy: 'anna' }),
          fi('v-uova', 'Uova', { categoryName: 'Frigo' }),
          fi('v-sale', 'Sale', { categoryName: 'Sconosciuta' }),
        ],
        tombstones: { 'v-pane': 99 },
      }),
    )
    const rows = await db.listItems.where('listId').equals(1).toArray()
    expect(rows.map((r) => r.uid).sort()).toEqual(['v-latte', 'v-sale', 'v-uova'])
    expect(rows.find((r) => r.uid === 'v-latte')).toMatchObject({ quantity: 4, takenBy: 'anna', updatedAt: 20, addedBy: 'anna', itemId: 1 })
    const uova = await db.items.where('normalizedName').equals('uova').first()
    expect(uova?.categoryId).toBe(1)
    const sale = await db.items.where('normalizedName').equals('sale').first()
    expect(sale?.categoryId).toBe(2) // categoria sconosciuta → "Altro"
    expect((await db.listItems.get(3))?.uid).toBe('altra-lista') // altre liste intatte
    expect((await db.shoppingLists.get(1))?.shared?.tombstones).toEqual({ 'v-pane': 99 })
  })

  it('collega alle categorie per nome senza badare alle maiuscole e senza "Altro" ripiega sulla prima', async () => {
    await seed(false)
    await applySharedFile(1, file({ items: [fi('a', 'Uova', { categoryName: 'frigo' }), fi('b', 'Sale', { categoryName: 'Boh' })] }))
    expect((await db.items.where('normalizedName').equals('uova').first())?.categoryId).toBe(1)
    expect((await db.items.where('normalizedName').equals('sale').first())?.categoryId).toBe(1)
  })

  it('il nome nuovo vince solo se più recente', async () => {
    await seed()
    await patchSharedLink(1, { nameUpdatedAt: 50 })
    await applySharedFile(1, file({ name: 'Vecchio', nameUpdatedAt: 10 }))
    expect((await db.shoppingLists.get(1))?.name).toBe('Casa')
    await applySharedFile(1, file({ name: 'Casa nostra', nameUpdatedAt: 60 }))
    const list = await db.shoppingLists.get(1)
    expect(list?.name).toBe('Casa nostra')
    expect(list?.shared?.nameUpdatedAt).toBe(60)
    // senza un cambio di nome precedente si parte da 0
    await db.shoppingLists.update(1, { shared: { ...LINK } })
    await applySharedFile(1, file({ name: 'Zero', nameUpdatedAt: 0 }))
    expect((await db.shoppingLists.get(1))?.name).toBe('Casa nostra')
  })

  it('non tocca le righe senza uid e rifiuta una lista non condivisa', async () => {
    await seed()
    await db.listItems.add({ id: 9, listId: 1, itemId: 1, quantity: 1, addedAt: 1 })
    await applySharedFile(1, file())
    expect(await db.listItems.get(9)).toBeDefined()
    await db.shoppingLists.add({ id: 5, name: 'Mia', supermarketId: null, sortOrder: 1, archivedAt: null })
    await expect(applySharedFile(5, file())).rejects.toThrow('non condivisa')
  })

  it('scopre le persone della lista: autori, chi ha preso una voce, chi ha fatto la spesa e il proprietario', async () => {
    await seed()
    await db.shoppingLists.update(1, { shared: { ...LINK, members: { luca: { label: 'Luca', kind: 'partner' } } } })
    await applySharedFile(
      1,
      file({
        items: [fi('a', 'Uova', { addedBy: 'matteo', takenBy: 'sara' }), fi('b', 'Sale', { addedBy: 'luca' })],
        sessions: [
          {
            uid: 's1', doneBy: 'giorgio', supermarketName: 'Coop', startedAt: 1, finishedAt: 2,
            confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800, purchases: [],
          },
        ],
      }),
    )
    const members = (await db.shoppingLists.get(1))?.shared?.members
    expect(Object.keys(members ?? {}).sort()).toEqual(['anna', 'giorgio', 'luca', 'sara']) // me (matteo) escluso
    expect(members?.luca).toEqual({ label: 'Luca', kind: 'partner' }) // chi c'era già non cambia
    expect(members?.sara).toEqual({ label: '', kind: 'stranger' })
    expect(members?.anna).toEqual({ label: '', kind: 'stranger' }) // proprietario del repo
  })

  it('un login che sembra una proprietà di oggetto viene trattato come gli altri', async () => {
    await seed()
    await applySharedFile(1, file({ items: [fi('a', 'Uova', { addedBy: 'constructor' })] }))
    expect((await db.shoppingLists.get(1))?.shared?.members.constructor).toEqual({ label: '', kind: 'stranger' })
  })

  it('importa le spese del file con il tipo delle persone, e dopo aver applicato le esporta senza ripubblicare quelle altrui', async () => {
    await seed()
    await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
    await db.shoppingLists.update(1, {
      shared: { ...LINK, members: { anna: { label: 'Anna', kind: 'partner' } }, sharedSince: 0 },
    })
    const sess = (uid: string, doneBy: string) => ({
      uid, doneBy, supermarketName: 'Coop', startedAt: 5000, finishedAt: 6000, confirmedTotalCents: 300,
      buoniSpent: 1, buoniValueCents: 800, purchases: [{ name: 'Latte', categoryName: 'Frigo', priceCents: 150, quantity: 2 }],
    })
    await applySharedFile(1, file({ sessions: [sess('s-anna', 'anna'), sess('s-luca', 'luca')] }))
    const imported = await db.sessions.toArray()
    expect(imported.map((x) => [x.sharedUid, x.doneBy, x.uncounted])).toEqual([
      ['s-anna', 'anna', undefined],
      ['s-luca', 'luca', true], // persona nuova: parte come estraneo
    ])
    // le spese di altri non tornano nel file come mie
    expect((await exportSharedFile(1)).sessions).toEqual([])
  })

  it('esportare dopo aver applicato dà lo stesso contenuto', async () => {
    await seed()
    const f = file({ items: [fi('a', 'Uova'), fi('b', 'Sale', { quantity: 3 })], tombstones: { x: 5 } })
    await applySharedFile(1, f)
    const back = await exportSharedFile(1)
    expect(back.items.map((i) => [i.uid, i.name, i.quantity, i.addedBy])).toEqual([
      ['a', 'Uova', 1, 'anna'],
      ['b', 'Sale', 3, 'anna'],
    ])
    expect(back.tombstones).toEqual({ x: 5 })
  })
})

describe('patchSharedLink', () => {
  it('cambia solo i campi dati', async () => {
    await seed()
    await patchSharedLink(1, { lastSha: 'abc', canWrite: false })
    expect((await db.shoppingLists.get(1))?.shared).toEqual({ ...LINK, lastSha: 'abc', canWrite: false })
    await expect(patchSharedLink(404, {})).rejects.toThrow('non condivisa')
  })
})
