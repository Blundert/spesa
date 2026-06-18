import { db } from '../db'
import type { Session } from '../types'

export async function getSessions(): Promise<Session[]> {
  return db.sessions.orderBy('startedAt').reverse().toArray()
}

export async function getSessionsByWeek(isoWeek: string): Promise<Session[]> {
  return db.sessions.where('isoWeek').equals(isoWeek).toArray()
}

export async function getSessionById(id: number): Promise<Session | undefined> {
  return db.sessions.get(id)
}

export async function createSession(
  isoWeek: string,
  supermarketId: number,
  buoniSpent: number,
  buoniValueCents: number,
): Promise<number> {
  const id = await db.sessions.add({
    isoWeek,
    supermarketId,
    startedAt: Date.now(),
    finishedAt: null,
    confirmedTotalCents: null,
    buoniSpent,
    buoniValueCents,
  })
  return id as number
}

export async function finishSession(id: number, confirmedTotalCents: number): Promise<void> {
  await db.sessions.update(id, { finishedAt: Date.now(), confirmedTotalCents })
}

export async function deleteSession(id: number): Promise<void> {
  await db.transaction('rw', [db.sessions, db.purchases], async () => {
    await db.purchases.where('sessionId').equals(id).delete()
    await db.sessions.delete(id)
  })
}
