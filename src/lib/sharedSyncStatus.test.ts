import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSyncStatus, resetSyncStatus, setSyncStatus, subscribeSyncStatus } from './sharedSyncStatus'

const OUT = { ok: true, result: { changed: false, pushed: false, canWrite: true }, at: 1 } as const

beforeEach(() => resetSyncStatus())

describe('sharedSyncStatus', () => {
  it('ricorda l\'ultimo esito per lista, lo stesso oggetto finché non cambia', () => {
    expect(getSyncStatus(1)).toBeUndefined()
    setSyncStatus(1, OUT)
    expect(getSyncStatus(1)).toBe(OUT)
    expect(getSyncStatus(1)).toBe(getSyncStatus(1))
    expect(getSyncStatus(2)).toBeUndefined()
    const err = { ok: false, code: 'network', at: 2 } as const
    setSyncStatus(1, err)
    expect(getSyncStatus(1)).toBe(err)
  })

  it('avvisa chi è iscritto a ogni cambio, finché non si disiscrive', () => {
    const l = vi.fn()
    const off = subscribeSyncStatus(l)
    setSyncStatus(1, OUT)
    setSyncStatus(2, OUT)
    expect(l).toHaveBeenCalledTimes(2)
    off()
    setSyncStatus(1, OUT)
    expect(l).toHaveBeenCalledTimes(2)
  })
})
