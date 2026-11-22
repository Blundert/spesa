import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import type { Session, SharedLink } from '../types'
import { onSharedChange } from '../../lib/sharedChange'
import { createSession, deleteSession, deleteWeek, finishSession } from './sessions'

const LINK: SharedLink = {
  uid: 'l1', owner: 'anna', repo: 'spesa', branch: 'main', path: 'lista.json', me: 'matteo', canWrite: true,
  members: {}, tombstones: {},
}

const session = (id: number, over: Partial<Session> = {}): Session => ({
  id, isoWeek: '2026-11-16', supermarketId: 1, listId: 1, startedAt: 1000, finishedAt: null,
  confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800, ...over,
})

let changed: number[]
beforeEach(async () => {
  changed = []
  await Promise.all([
    db.sessions.clear(), db.purchases.clear(), db.items.clear(), db.shoppingLists.clear(),
    db.weekBudgets.clear(), db.mealPlans.clear(),
  ])
  await db.shoppingLists.bulkAdd([
    { id: 1, name: 'Condivisa', supermarketId: null, sortOrder: 0, archivedAt: null, shared: LINK },
    { id: 2, name: 'Mia', supermarketId: null, sortOrder: 1, archivedAt: null },
  ])
})
onSharedChange((id) => changed.push(id))

describe('finishSession', () => {
  it('a fine spesa di una lista condivisa avvisa che c\'è da pubblicare', async () => {
    await db.sessions.bulkAdd([session(1), session(2, { listId: 2 }), session(3, { listId: undefined })])
    await finishSession(1, 500)
    expect(changed).toEqual([1])
    await finishSession(2, 500)
    await finishSession(3, 500)
    expect(changed).toEqual([1]) // lista normale e spesa senza lista: niente
  })
})

describe('deleteSession', () => {
  it('eliminare una mia spesa già pubblicata lascia il tombstone', async () => {
    await db.sessions.add(session(1, { finishedAt: 2000, sharedUid: 'sess-1' }))
    await deleteSession(1)
    expect(await db.sessions.count()).toBe(0)
    expect((await db.shoppingLists.get(1))?.shared?.tombstones).toMatchObject({ 'sess-1': expect.any(Number) })
    expect(changed).toEqual([1])
  })

  it('una spesa non pubblicata, di lista normale o senza lista si elimina senza tombstone', async () => {
    await db.sessions.bulkAdd([
      session(1), // condivisa ma mai pubblicata (nessun sharedUid)
      session(2, { listId: 2, sharedUid: 'x' }), // lista normale
      session(3, { listId: undefined, sharedUid: 'y' }),
      session(4, { listId: 404, sharedUid: 'z' }), // lista sparita
    ])
    for (const id of [1, 2, 3, 4]) await deleteSession(id)
    expect(await db.sessions.count()).toBe(0)
    expect((await db.shoppingLists.get(1))?.shared?.tombstones).toEqual({})
  })

  it('le spese di altri non si eliminano; una spesa inesistente non fa niente', async () => {
    await db.sessions.add(session(1, { finishedAt: 2000, sharedUid: 'sess-1', doneBy: 'anna' }))
    await deleteSession(1)
    await deleteSession(404)
    expect(await db.sessions.count()).toBe(1)
    expect((await db.shoppingLists.get(1))?.shared?.tombstones).toEqual({})
  })
})

describe('deleteWeek', () => {
  it('elimina le mie spese della settimana (con tombstone) e lascia quelle degli altri', async () => {
    await db.sessions.bulkAdd([
      session(1, { finishedAt: 2000, sharedUid: 'mia' }),
      session(2, { finishedAt: 2000, sharedUid: 'sua', doneBy: 'anna' }),
      session(3, { isoWeek: '2026-11-23', finishedAt: 2000 }),
    ])
    await deleteWeek('2026-11-16')
    expect((await db.sessions.toArray()).map((s) => s.id).sort()).toEqual([2, 3])
    expect(Object.keys((await db.shoppingLists.get(1))?.shared?.tombstones ?? {})).toEqual(['mia'])
  })

  it('una settimana senza spese non fa niente', async () => {
    await deleteWeek('2030-01-01')
    expect(await db.sessions.count()).toBe(0)
  })
})

describe('la mia spesa in corso su una lista condivisa', () => {
  beforeEach(async () => {
    await db.supermarkets.clear()
    await db.supermarkets.add({ id: 1, name: 'Esselunga', normalizedName: 'esselunga' })
  })
  const mine = async () => (await db.shoppingLists.get(1))?.shared?.myShopping

  it('iniziarla la pubblica con negozio, buoni e valore; finirla la segna finita', async () => {
    await createSession('2026-11-16', 1, 2, 800, 1)
    expect(await mine()).toMatchObject({ by: 'matteo', supermarketName: 'Esselunga', buoniSpent: 2, buoniValueCents: 800, endedAt: null })
    expect(changed).toEqual([1])
    const id = ((await db.sessions.toArray())[0].id) as number
    await finishSession(id, 500)
    expect((await mine())?.endedAt).toEqual(expect.any(Number))
  })

  it('annullarla (eliminarla) la segna finita; eliminare un\'altra non la tocca', async () => {
    await createSession('2026-11-16', 1, 2, 800, 1)
    const id = ((await db.sessions.toArray())[0].id) as number
    await db.sessions.add(session(77, { startedAt: 1, finishedAt: null }))
    await deleteSession(77) // un'altra spesa non finita, non è quella pubblicata
    expect((await mine())?.endedAt).toBeNull()
    await deleteSession(id)
    expect((await mine())?.endedAt).toEqual(expect.any(Number))
  })

  it('eliminare la settimana con la spesa in corso la segna finita', async () => {
    await createSession('2026-11-16', 1, 0, 800, 1)
    await deleteWeek('2026-11-16')
    expect((await mine())?.endedAt).toEqual(expect.any(Number))
  })

  it('una spesa già finita non viene segnata di nuovo; una lista normale non pubblica niente', async () => {
    await createSession('2026-11-16', 1, 0, 800, 1)
    const id = ((await db.sessions.toArray())[0].id) as number
    await finishSession(id, 100)
    const ended = (await mine())?.endedAt
    await deleteSession(id)
    expect((await mine())?.endedAt).toBe(ended)
    await createSession('2026-11-16', 1, 3, 800, 2) // lista normale
    expect((await db.shoppingLists.get(2))?.shared).toBeUndefined()
  })

  it('con un negozio che non esiste pubblica "?" e una spesa di altri non pubblica niente', async () => {
    await createSession('2026-11-16', 404, 0, 800, 1)
    expect((await mine())?.supermarketName).toBe('?')
    await db.shoppingLists.update(1, { shared: { ...LINK, myShopping: undefined } })
    await db.sessions.add(session(88, { startedAt: 5, finishedAt: null, doneBy: 'anna' }))
    await finishSession(88, 1) // spesa di altri: niente di mio da chiudere
    expect(await mine()).toBeUndefined()
  })
})
