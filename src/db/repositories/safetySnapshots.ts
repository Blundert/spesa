import { db } from '../db'
import type { SafetySnapshot, SafetySnapshotReason } from '../types'

/** Quante copie di sicurezza locali si tengono: le più vecchie vengono eliminate. */
export const MAX_SAFETY_SNAPSHOTS = 10

/** Salva una copia (JSON di un BackupData) e scarta le più vecchie oltre il limite. */
export async function saveSafetySnapshot(reason: SafetySnapshotReason, json: string): Promise<number> {
  return db.transaction('rw', db.safetySnapshots, async () => {
    const id = (await db.safetySnapshots.add({ createdAt: Date.now(), reason, json })) as number
    const ids = (await db.safetySnapshots.orderBy('createdAt').primaryKeys()) as number[]
    const extra = ids.length - MAX_SAFETY_SNAPSHOTS
    if (extra > 0) await db.safetySnapshots.bulkDelete(ids.slice(0, extra))
    return id
  })
}

/** Dalla più recente alla più vecchia. */
export async function getSafetySnapshots(): Promise<SafetySnapshot[]> {
  return db.safetySnapshots.orderBy('createdAt').reverse().toArray()
}

export async function getSafetySnapshot(id: number): Promise<SafetySnapshot | undefined> {
  return db.safetySnapshots.get(id)
}

export async function deleteSafetySnapshot(id: number): Promise<void> {
  await db.safetySnapshots.delete(id)
}
