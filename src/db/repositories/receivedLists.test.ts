import { beforeEach, describe, it, expect } from 'vitest'
import { db } from '../db'
import { RECEIVED_TTL_MS, type ReceivedList } from '../../lib/receivedList'
import { deleteReceivedList, getReceivedList, purgeExpiredReceivedLists, saveReceivedList } from './receivedLists'

const list = (id: string, openedAt: number): ReceivedList => ({
  id,
  name: id,
  items: [{ name: 'Latte', quantity: 1, category: 'Frigo' }],
  checked: [],
  openedAt,
})

beforeEach(async () => {
  await db.receivedLists.clear()
})

describe('receivedLists', () => {
  it('salva, rilegge, aggiorna ed elimina', async () => {
    expect(await getReceivedList('a')).toBeUndefined()
    await saveReceivedList(list('a', 1))
    expect((await getReceivedList('a'))?.openedAt).toBe(1)
    await saveReceivedList({ ...list('a', 2), checked: ['latte'] })
    expect(await db.receivedLists.count()).toBe(1)
    expect((await getReceivedList('a'))?.checked).toEqual(['latte'])
    await deleteReceivedList('a')
    expect(await getReceivedList('a')).toBeUndefined()
  })

  it('elimina solo le liste scadute', async () => {
    const now = 10 * RECEIVED_TTL_MS
    await saveReceivedList(list('vecchia', now - RECEIVED_TTL_MS - 1))
    await saveReceivedList(list('recente', now - 1000))
    await purgeExpiredReceivedLists(now)
    expect((await db.receivedLists.toArray()).map((l) => l.id)).toEqual(['recente'])
  })

  it('senza argomenti usa l\'ora attuale', async () => {
    await saveReceivedList(list('vecchia', 0))
    await saveReceivedList(list('adesso', Date.now()))
    await purgeExpiredReceivedLists()
    expect((await db.receivedLists.toArray()).map((l) => l.id)).toEqual(['adesso'])
  })
})
