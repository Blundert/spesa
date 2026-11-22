import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../db'
import {
  addToList,
  assignListItemUids,
  clearList,
  getListItems,
  removeFromList,
  removePurchasedFromList,
  setItemTaken,
  setSessionItemTaken,
  tombstoneListItems,
  updateListItemQuantity,
} from './listItems'
import { onSharedChange } from '../../lib/sharedChange'
import { upsertItem } from './items'
import type { SharedLink } from '../types'

const A = 1
const B = 2

beforeEach(async () => {
  await db.listItems.clear()
  await db.items.clear()
})

describe('addToList', () => {
  it('somma la quantità nella stessa lista, voci separate in liste diverse', async () => {
    const latte = await upsertItem('Latte', 1)
    await addToList(A, latte)
    await addToList(A, latte)
    await addToList(B, latte)

    const a = await getListItems(A)
    const b = await getListItems(B)
    expect(a).toHaveLength(1)
    expect(a[0]).toMatchObject({ itemName: 'Latte', quantity: 2, listId: A })
    expect(b[0]).toMatchObject({ quantity: 1, listId: B })
  })

  it('una voce di un item eliminato mostra un segnaposto', async () => {
    await db.listItems.add({ listId: A, itemId: 999, quantity: 1, addedAt: 0 })
    expect((await getListItems(A))[0]).toMatchObject({ itemName: '(eliminato)', itemCategoryId: 0, suggestedPriceCents: null })
  })
})

describe('quantità e rimozione', () => {
  it('aggiorna la quantità e rimuove la voce a zero', async () => {
    const latte = await upsertItem('Latte', 1)
    await addToList(A, latte)
    const [li] = await getListItems(A)
    await updateListItemQuantity(li.id as number, 3)
    expect((await getListItems(A))[0].quantity).toBe(3)
    await updateListItemQuantity(li.id as number, 0)
    expect(await getListItems(A)).toEqual([])
  })

  it('rimuove una voce', async () => {
    const latte = await upsertItem('Latte', 1)
    await addToList(A, latte)
    const [li] = await getListItems(A)
    await removeFromList(li.id as number)
    expect(await getListItems(A)).toEqual([])
  })
})

describe('removePurchasedFromList', () => {
  it('toglie gli acquistati solo dalla lista della spesa', async () => {
    const latte = await upsertItem('Latte', 1)
    const pane = await upsertItem('Pane', 2)
    await addToList(A, latte)
    await addToList(A, pane)
    await addToList(B, latte)

    await removePurchasedFromList(A, [latte])

    expect((await getListItems(A)).map((l) => l.itemName)).toEqual(['Pane'])
    expect((await getListItems(B)).map((l) => l.itemName)).toEqual(['Latte'])
  })

  it('senza acquisti non fa nulla', async () => {
    const latte = await upsertItem('Latte', 1)
    await addToList(A, latte)
    await removePurchasedFromList(A, [])
    expect(await getListItems(A)).toHaveLength(1)
  })
})

describe('clearList', () => {
  it('svuota solo la lista indicata, gli item del catalogo restano', async () => {
    const a = await upsertItem('Latte', 1)
    const b = await upsertItem('Pane', 2)
    await addToList(A, a)
    await addToList(A, b)
    await addToList(B, b)

    await clearList(A)

    expect(await getListItems(A)).toEqual([])
    expect(await getListItems(B)).toHaveLength(1)
    expect(await db.items.count()).toBe(2)
  })
})

describe('assignListItemUids', () => {
  it('dà uid, autore e data di modifica alle voci senza e lascia stare le altre e le altre liste', async () => {
    await db.listItems.bulkAdd([
      { id: 1, listId: 1, itemId: A, quantity: 1, addedAt: 1000 },
      { id: 2, listId: 1, itemId: B, quantity: 2, addedAt: 2000, uid: 'gia-mia', updatedAt: 5000, addedBy: 'anna' },
      { id: 3, listId: 2, itemId: A, quantity: 1, addedAt: 3000 },
    ])
    await assignListItemUids(1, 'matteo')
    const [one, two, three] = await db.listItems.orderBy('id').toArray()
    expect(one.uid).toMatch(/^[0-9a-f-]{36}$/)
    expect(one).toMatchObject({ updatedAt: 1000, addedBy: 'matteo' })
    expect(two).toMatchObject({ uid: 'gia-mia', updatedAt: 5000, addedBy: 'anna' })
    expect(three.uid).toBeUndefined()
  })

  it('è idempotente: una seconda chiamata non cambia gli uid', async () => {
    await db.listItems.add({ listId: 1, itemId: A, quantity: 1, addedAt: 1000 })
    await assignListItemUids(1, 'matteo')
    const first = (await db.listItems.toArray())[0].uid
    await assignListItemUids(1, 'altro')
    const after = (await db.listItems.toArray())[0]
    expect(after.uid).toBe(first)
    expect(after.addedBy).toBe('matteo')
  })
})

const SHARED: SharedLink = {
  uid: 'l1', owner: 'anna', repo: 'spesa', branch: 'main', path: 'lista.json',
  me: 'matteo', canWrite: true, members: {}, tombstones: {},
}

describe('liste condivise: uid, data di modifica e tombstone', () => {
  beforeEach(async () => {
    await db.shoppingLists.clear()
    await db.shoppingLists.bulkAdd([
      { id: 1, name: 'Condivisa', supermarketId: null, sortOrder: 0, archivedAt: null, shared: SHARED },
      { id: 2, name: 'Mia', supermarketId: null, sortOrder: 1, archivedAt: null },
    ])
  })

  it('aggiungere dà uid e autore; aggiungere ancora aggiorna quantità e data', async () => {
    await addToList(1, A)
    const [row] = await db.listItems.toArray()
    expect(row.uid).toMatch(/^[0-9a-f-]{36}$/)
    expect(row).toMatchObject({ addedBy: 'matteo', quantity: 1 })
    expect(row.updatedAt).toBe(row.addedAt)
    await db.listItems.update(row.id as number, { updatedAt: 1 })
    await addToList(1, A)
    const after = (await db.listItems.toArray())[0]
    expect(after.quantity).toBe(2)
    expect(after.updatedAt).toBeGreaterThan(1)
    expect(after.uid).toBe(row.uid)
  })

  it('in una lista normale non aggiunge niente di tutto questo', async () => {
    await addToList(2, A)
    await addToList(2, A)
    const [row] = await db.listItems.toArray()
    expect(row).toMatchObject({ quantity: 2 })
    expect(row.uid).toBeUndefined()
    expect(row.updatedAt).toBeUndefined()
  })

  it('cambiare la quantità aggiorna la data solo se la voce ha un uid', async () => {
    await addToList(1, A)
    await addToList(2, A)
    const [shared, normal] = await db.listItems.toArray()
    await db.listItems.update(shared.id as number, { updatedAt: 1 })
    await updateListItemQuantity(shared.id as number, 5)
    await updateListItemQuantity(normal.id as number, 5)
    expect(await db.listItems.get(shared.id as number)).toMatchObject({ quantity: 5 })
    expect((await db.listItems.get(shared.id as number))?.updatedAt).toBeGreaterThan(1)
    expect((await db.listItems.get(normal.id as number))?.updatedAt).toBeUndefined()
    await updateListItemQuantity(9999, 3) // inesistente: niente
  })

  it('eliminare una voce condivisa lascia un tombstone; una normale no', async () => {
    await addToList(1, A)
    await addToList(1, B)
    await addToList(2, A)
    const [a, , normal] = await db.listItems.toArray()
    await removeFromList(a.id as number)
    await removeFromList(normal.id as number)
    await removeFromList(9999) // inesistente: niente
    const list = await db.shoppingLists.get(1)
    expect(Object.keys(list?.shared?.tombstones ?? {})).toEqual([a.uid])
    expect((await db.shoppingLists.get(2))?.shared).toBeUndefined()
    expect(await db.listItems.count()).toBe(1) // resta solo la voce B della lista condivisa
  })

  it('quantità zero elimina e lascia il tombstone', async () => {
    await addToList(1, A)
    const [row] = await db.listItems.toArray()
    await updateListItemQuantity(row.id as number, 0)
    expect(await db.listItems.count()).toBe(0)
    expect(Object.keys((await db.shoppingLists.get(1))?.shared?.tombstones ?? {})).toEqual([row.uid])
  })

  it('fine spesa e svuota lista lasciano i tombstone solo delle voci tolte', async () => {
    await addToList(1, A)
    await addToList(1, B)
    const [a, b] = await db.listItems.toArray()
    await removePurchasedFromList(1, [A])
    expect(Object.keys((await db.shoppingLists.get(1))?.shared?.tombstones ?? {})).toEqual([a.uid])
    await clearList(1)
    expect(Object.keys((await db.shoppingLists.get(1))?.shared?.tombstones ?? {}).sort()).toEqual([a.uid, b.uid].sort())
    expect(await db.listItems.count()).toBe(0)
  })

  it('tombstoneListItems ignora voci senza uid o di liste che non esistono più', async () => {
    await tombstoneListItems([
      { listId: 1, itemId: A, quantity: 1, addedAt: 1 },
      { listId: 404, itemId: A, quantity: 1, addedAt: 1, uid: 'x' },
      { listId: 2, itemId: A, quantity: 1, addedAt: 1, uid: 'y' },
    ])
    expect((await db.shoppingLists.get(1))?.shared?.tombstones).toEqual({})
    expect((await db.shoppingLists.get(2))?.shared).toBeUndefined()
  })
})

describe('liste condivise: avviso delle modifiche e voci prese', () => {
  let changed: number[]
  let off: () => void

  beforeEach(async () => {
    changed = []
    off = onSharedChange((id) => changed.push(id))
    await Promise.all([db.shoppingLists.clear(), db.sessions.clear()])
    await db.shoppingLists.bulkAdd([
      { id: 1, name: 'Condivisa', supermarketId: null, sortOrder: 0, archivedAt: null, shared: SHARED },
      { id: 2, name: 'Mia', supermarketId: null, sortOrder: 1, archivedAt: null },
    ])
  })
  afterEach(() => off())

  it('aggiungere, cambiare quantità ed eliminare avvisano solo per le liste condivise', async () => {
    await addToList(1, A)
    await addToList(2, A)
    expect(changed).toEqual([1])
    const [shared, normal] = await db.listItems.toArray()
    await updateListItemQuantity(shared.id as number, 3)
    await updateListItemQuantity(normal.id as number, 3)
    expect(changed).toEqual([1, 1])
    await removeFromList(shared.id as number)
    await removeFromList(normal.id as number)
    expect(changed).toEqual([1, 1, 1])
  })

  it('segnare una voce come presa dice chi e quando, e la rimette da prendere', async () => {
    await addToList(1, A)
    changed.length = 0
    await setItemTaken(1, A, true)
    const row = (await db.listItems.toArray())[0]
    expect(row.takenBy).toBe('matteo')
    expect(changed).toEqual([1])
    await db.listItems.update(row.id as number, { updatedAt: 1 })
    await setItemTaken(1, A, false)
    const after = (await db.listItems.toArray())[0]
    expect(after.takenBy).toBeNull()
    expect(after.updatedAt).toBeGreaterThan(1)
  })

  it('non fa niente per liste normali, voci senza uid o voci che non ci sono', async () => {
    await addToList(2, A)
    await db.listItems.add({ listId: 1, itemId: B, quantity: 1, addedAt: 1 }) // senza uid
    await setItemTaken(2, A, true)
    await setItemTaken(1, B, true)
    await setItemTaken(1, 999, true)
    await setItemTaken(404, A, true)
    expect(changed).toEqual([])
    expect((await db.listItems.toArray()).every((r) => r.takenBy === undefined)).toBe(true)
  })

  it('dalla spesa risale alla lista di partenza', async () => {
    await addToList(1, A)
    await db.sessions.bulkAdd([
      { id: 1, isoWeek: '2026-W47', supermarketId: 1, listId: 1, startedAt: 1, finishedAt: null, confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800 },
      { id: 2, isoWeek: '2026-W47', supermarketId: 1, startedAt: 1, finishedAt: null, confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800 },
    ])
    await setSessionItemTaken(1, A, true)
    expect((await db.listItems.toArray())[0].takenBy).toBe('matteo')
    await setSessionItemTaken(2, A, false) // spesa senza lista
    await setSessionItemTaken(404, A, false) // spesa inesistente
    expect((await db.listItems.toArray())[0].takenBy).toBe('matteo')
  })

  it('eliminare una voce condivisa avvisa una volta per lista (tombstone)', async () => {
    await addToList(1, A)
    await addToList(1, B)
    changed.length = 0
    await clearList(1)
    expect(changed).toEqual([1])
  })
})
