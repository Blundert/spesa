import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import {
  addToList,
  clearList,
  getListItems,
  removeFromList,
  removePurchasedFromList,
  updateListItemQuantity,
} from './listItems'
import { upsertItem } from './items'

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
