import { db } from '../db'
import { isReceivedExpired, type ReceivedList } from '../../lib/receivedList'

export async function getReceivedList(id: string): Promise<ReceivedList | undefined> {
  return db.receivedLists.get(id)
}

export async function saveReceivedList(list: ReceivedList): Promise<void> {
  await db.receivedLists.put(list)
}

export async function deleteReceivedList(id: string): Promise<void> {
  await db.receivedLists.delete(id)
}

/** Elimina le liste ricevute che non si aprono da più di 30 giorni. */
export async function purgeExpiredReceivedLists(now: number = Date.now()): Promise<void> {
  const all = await db.receivedLists.toArray()
  await db.receivedLists.bulkDelete(all.filter((l) => isReceivedExpired(l, now)).map((l) => l.id))
}
