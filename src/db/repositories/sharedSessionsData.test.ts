import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../db'
import type { SharedLink } from '../types'
import type { SharedSession } from '../../lib/sharedListFile'
import { exportSharedSessions, importSharedSessions, recountSharedSessions } from './sharedSessionsData'

const LINK: SharedLink = {
  uid: 'l1', owner: 'anna', repo: 'spesa', branch: 'main', path: 'lista.json', me: 'matteo', canWrite: true,
  members: { anna: { label: 'Anna', kind: 'partner' }, luca: { label: '', kind: 'stranger' } },
  tombstones: {}, sharedSince: 1000,
}

const ss = (uid: string, over: Partial<SharedSession> = {}): SharedSession => ({
  uid, doneBy: 'anna', supermarketName: 'Coop', startedAt: 5000, finishedAt: 6000, confirmedTotalCents: 450,
  buoniSpent: 1, buoniValueCents: 800,
  purchases: [
    { name: 'Latte', categoryName: 'Frigo', priceCents: 120, quantity: 2 },
    { name: 'Biscotti', categoryName: 'Boh', priceCents: 210, quantity: 1 },
  ],
  ...over,
})

beforeEach(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} })
  await Promise.all([
    db.categories.clear(), db.items.clear(), db.supermarkets.clear(), db.sessions.clear(), db.purchases.clear(), db.shoppingLists.clear(),
  ])
  await db.categories.bulkAdd([{ id: 1, name: 'Frigo', sortOrder: 0 }, { id: 2, name: 'Altro', sortOrder: 1 }])
  await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
  await db.shoppingLists.add({ id: 1, name: 'Casa', supermarketId: null, sortOrder: 0, archivedAt: null, shared: LINK })
})
afterEach(() => vi.unstubAllGlobals())

describe('exportSharedSessions', () => {
  async function seedMine() {
    await db.items.bulkAdd([
      { id: 1, name: 'Latte', normalizedName: 'latte', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null },
      { id: 2, name: 'Pane\u0000', normalizedName: 'pane', categoryId: 99, lastPriceCents: null, suggestedPriceCents: null },
    ])
    await db.sessions.bulkAdd([
      { id: 1, isoWeek: 'w', supermarketId: 1, listId: 1, startedAt: 4000, finishedAt: 5000, confirmedTotalCents: 330, buoniSpent: 1, buoniValueCents: 800 },
      { id: 2, isoWeek: 'w', supermarketId: 1, listId: 1, startedAt: 100, finishedAt: 500, confirmedTotalCents: 99, buoniSpent: 0, buoniValueCents: 800 }, // prima della condivisione
      { id: 3, isoWeek: 'w', supermarketId: 1, listId: 1, startedAt: 6000, finishedAt: null, confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800 }, // in corso
      { id: 4, isoWeek: 'w', supermarketId: 1, listId: 2, startedAt: 4000, finishedAt: 5000, confirmedTotalCents: 1, buoniSpent: 0, buoniValueCents: 800 }, // altra lista
      { id: 5, isoWeek: 'w', supermarketId: 1, listId: 1, startedAt: 4000, finishedAt: 5000, confirmedTotalCents: 1, buoniSpent: 0, buoniValueCents: 800, doneBy: 'anna' }, // di Anna
    ])
    await db.purchases.bulkAdd([
      { sessionId: 1, itemId: 1, priceCents: 120, quantity: 2 },
      { sessionId: 1, itemId: 2, priceCents: 90, quantity: 1 },
      { sessionId: 1, itemId: 77, priceCents: 5, quantity: 1 }, // articolo sparito dal catalogo
    ])
  }

  it('pubblica solo le mie spese concluse da quando la lista è condivisa, con uid stabile', async () => {
    await seedMine()
    const out = await exportSharedSessions(1, LINK)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      doneBy: 'matteo', supermarketName: 'Coop', startedAt: 4000, finishedAt: 5000,
      confirmedTotalCents: 330, buoniSpent: 1, buoniValueCents: 800,
    })
    expect(out[0].purchases).toEqual([
      { name: 'Latte', categoryName: 'Frigo', priceCents: 120, quantity: 2 },
      { name: 'Pane', categoryName: '?', priceCents: 90, quantity: 1 },
    ])
    expect(out[0].uid).toMatch(/^[0-9a-f-]{36}$/)
    expect((await db.sessions.get(1))?.sharedUid).toBe(out[0].uid)
    // seconda volta: lo stesso uid
    expect((await exportSharedSessions(1, LINK))[0].uid).toBe(out[0].uid)
  })

  it('senza `sharedSince` pubblica tutte le concluse; ripulisce importi e negozio mancante', async () => {
    await seedMine()
    await db.sessions.update(1, { supermarketId: 404, confirmedTotalCents: null, buoniSpent: 5000, buoniValueCents: 999999 })
    await db.purchases.where('itemId').equals(1).modify({ priceCents: -5, quantity: 0 })
    const { sharedSince, ...old } = LINK
    void sharedSince
    const out = await exportSharedSessions(1, old)
    expect(out.map((s) => s.finishedAt).sort()).toEqual([500, 5000])
    const s = out.find((x) => x.finishedAt === 5000) as SharedSession
    expect(s).toMatchObject({ supermarketName: '?', confirmedTotalCents: null, buoniSpent: 1000, buoniValueCents: 100000 })
    expect(s.purchases[0]).toMatchObject({ priceCents: 0, quantity: 1 })
  })
})

describe('importSharedSessions', () => {
  it('porta nello storico le spese degli altri con autore, negozio, articoli e settimana', async () => {
    await importSharedSessions(1, LINK, [ss('s1')])
    const [s] = await db.sessions.toArray()
    expect(s).toMatchObject({
      listId: 1, supermarketId: 1, startedAt: 5000, finishedAt: 6000, confirmedTotalCents: 450, buoniSpent: 1,
      buoniValueCents: 800, sharedUid: 's1', doneBy: 'anna',
    })
    expect(s.isoWeek).toBe('1969-12-29') // 6000 ms dopo l'epoca (giovedì): la settimana inizia lunedì 29 dicembre 1969
    expect('uncounted' in s).toBe(false) // Anna è partner: conta
    const purchases = await db.purchases.toArray()
    expect(purchases.map((p) => [p.priceCents, p.quantity])).toEqual([[120, 2], [210, 1]])
    const latte = await db.items.where('normalizedName').equals('latte').first()
    expect(latte).toMatchObject({ categoryId: 1, lastPriceCents: 120, suggestedPriceCents: 120, purchaseCount: 2 })
    expect((await db.items.where('normalizedName').equals('biscotti').first())?.categoryId).toBe(2) // categoria sconosciuta → Altro
  })

  it('di un estraneo (o di uno sconosciuto) segna la spesa come non conteggiata', async () => {
    await importSharedSessions(1, LINK, [ss('a', { doneBy: 'luca' }), ss('b', { doneBy: 'sconosciuto' })])
    expect((await db.sessions.toArray()).map((s) => s.uncounted)).toEqual([true, true])
  })

  it('una mia spesa che non ho (dispositivo nuovo) torna normale, senza autore', async () => {
    await importSharedSessions(1, LINK, [ss('m', { doneBy: 'matteo' })])
    const [s] = await db.sessions.toArray()
    expect('doneBy' in s).toBe(false)
    expect('uncounted' in s).toBe(false)
  })

  it('non importa due volte la stessa spesa e crea il negozio se manca', async () => {
    const one = ss('s1', { supermarketName: 'Esselunga' })
    await importSharedSessions(1, LINK, [one])
    await importSharedSessions(1, LINK, [one, ss('s2', { supermarketName: 'esselunga ' })])
    expect(await db.sessions.count()).toBe(2)
    expect((await db.supermarkets.toArray()).map((m) => m.name).sort()).toEqual(['Coop', 'Esselunga'])
    expect(await db.purchases.count()).toBe(4)
  })

  it('ricalcola prezzo medio e quantità sommando gli acquisti di tutti', async () => {
    await importSharedSessions(1, LINK, [
      ss('s1', { purchases: [{ name: 'Latte', categoryName: 'Frigo', priceCents: 100, quantity: 1 }] }),
      ss('s2', { finishedAt: 7000, purchases: [{ name: 'Latte', categoryName: 'Frigo', priceCents: 150, quantity: 3 }] }),
    ])
    const latte = await db.items.where('normalizedName').equals('latte').first()
    expect(latte).toMatchObject({ lastPriceCents: 150, suggestedPriceCents: 125, purchaseCount: 4 })
  })

  it('senza spese nuove non fa niente (anche con categorie assenti)', async () => {
    await db.categories.clear()
    await importSharedSessions(1, LINK, [])
    await db.sessions.add({ isoWeek: 'w', supermarketId: 1, listId: 1, startedAt: 1, finishedAt: 2, confirmedTotalCents: 1, buoniSpent: 0, buoniValueCents: 800, sharedUid: 'gia' })
    await importSharedSessions(1, LINK, [ss('gia')])
    expect(await db.sessions.count()).toBe(1)
  })

  it('con "Altro" assente ripiega sulla prima categoria', async () => {
    await db.categories.delete(2)
    await importSharedSessions(1, LINK, [ss('s1')])
    expect((await db.items.where('normalizedName').equals('biscotti').first())?.categoryId).toBe(1)
  })
})

describe('recountSharedSessions', () => {
  beforeEach(async () => {
    await db.sessions.bulkAdd([
      { id: 1, isoWeek: 'w', supermarketId: 1, listId: 1, startedAt: 1, finishedAt: 2, confirmedTotalCents: 1, buoniSpent: 0, buoniValueCents: 800, doneBy: 'luca', uncounted: true },
      { id: 2, isoWeek: 'w', supermarketId: 1, listId: 1, startedAt: 1, finishedAt: 2, confirmedTotalCents: 1, buoniSpent: 0, buoniValueCents: 800, doneBy: 'anna' },
      { id: 3, isoWeek: 'w', supermarketId: 1, listId: 1, startedAt: 1, finishedAt: 2, confirmedTotalCents: 1, buoniSpent: 0, buoniValueCents: 800 },
      { id: 4, isoWeek: 'w', supermarketId: 1, listId: 2, startedAt: 1, finishedAt: 2, confirmedTotalCents: 1, buoniSpent: 0, buoniValueCents: 800, doneBy: 'luca', uncounted: true },
    ])
  })

  it('cambiare il tipo di una persona cambia se le sue spese contano', async () => {
    await db.shoppingLists.update(1, { shared: { ...LINK, members: { anna: { label: '', kind: 'stranger' }, luca: { label: '', kind: 'partner' } } } })
    await recountSharedSessions(1)
    const flags = Object.fromEntries((await db.sessions.toArray()).map((s) => [s.id, s.uncounted]))
    expect(flags).toEqual({ 1: undefined, 2: true, 3: undefined, 4: true }) // la 4 è di un'altra lista: intatta
    expect('uncounted' in ((await db.sessions.get(1)) as object)).toBe(false)
  })

  it('senza cambiamenti non tocca niente; liste non condivise ignorate', async () => {
    await recountSharedSessions(1)
    expect((await db.sessions.get(1))?.uncounted).toBe(true)
    expect((await db.sessions.get(2))?.uncounted).toBeUndefined()
    await recountSharedSessions(404)
  })
})
