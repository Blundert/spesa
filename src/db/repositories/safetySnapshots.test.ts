import { describe, it, expect, beforeEach, vi, afterEach, type MockInstance } from 'vitest'
import { db } from '../db'
import {
  MAX_SAFETY_SNAPSHOTS,
  deleteSafetySnapshot,
  getSafetySnapshot,
  getSafetySnapshots,
  saveSafetySnapshot,
} from './safetySnapshots'

let now: MockInstance<() => number>
const setNow = (t: number) => now.mockReturnValue(t)

beforeEach(async () => {
  await db.safetySnapshots.clear()
  now = vi.spyOn(Date, 'now')
  setNow(1_000)
})

afterEach(() => now.mockRestore())

describe('safetySnapshots', () => {
  it('salva e rilegge una copia', async () => {
    const id = await saveSafetySnapshot('pull', '{"a":1}')
    expect(await getSafetySnapshot(id)).toMatchObject({ createdAt: 1_000, reason: 'pull', json: '{"a":1}' })
    expect(await getSafetySnapshot(id + 100)).toBeUndefined()
  })

  it('le elenca dalla più recente', async () => {
    await saveSafetySnapshot('pull', 'a')
    setNow(2_000)
    await saveSafetySnapshot('restore', 'b')
    expect((await getSafetySnapshots()).map((s) => s.json)).toEqual(['b', 'a'])
  })

  it('tiene solo le ultime MAX_SAFETY_SNAPSHOTS', async () => {
    for (let i = 0; i < MAX_SAFETY_SNAPSHOTS + 3; i++) {
      setNow(1_000 + i)
      await saveSafetySnapshot('import-file', String(i))
    }
    const all = await getSafetySnapshots()
    expect(all).toHaveLength(MAX_SAFETY_SNAPSHOTS)
    expect(all[0].json).toBe(String(MAX_SAFETY_SNAPSHOTS + 2))
    expect(all.at(-1)?.json).toBe('3')
  })

  it('elimina una copia', async () => {
    const id = await saveSafetySnapshot('pull', 'x')
    await deleteSafetySnapshot(id)
    expect(await getSafetySnapshots()).toEqual([])
  })
})
