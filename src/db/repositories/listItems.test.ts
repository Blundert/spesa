import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import { addToList, clearList, getListItems } from './listItems'
import { upsertItem } from './items'

beforeEach(async () => {
  await db.listItems.clear()
  await db.items.clear()
})

describe('clearList', () => {
  it('rimuove tutte le voci della lista ma non gli item del catalogo', async () => {
    const a = await upsertItem('Latte', 1)
    const b = await upsertItem('Pane', 2)
    await addToList(a)
    await addToList(b)
    await addToList(b)
    expect(await db.listItems.count()).toBe(2)

    await clearList()

    expect(await getListItems()).toEqual([])
    expect(await db.items.count()).toBe(2)
  })

  it('su lista vuota non fa nulla', async () => {
    await clearList()
    expect(await db.listItems.count()).toBe(0)
  })
})
