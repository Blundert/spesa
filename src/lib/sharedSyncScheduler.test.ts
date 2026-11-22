import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SharedSyncError, type SharedSyncCode, type SharedSyncResult } from './sharedSync'
import {
  POLL_INTERVAL_MS,
  PUSH_DELAY_MS,
  createSharedSyncScheduler,
  type SyncOutcome,
} from './sharedSyncScheduler'

const OK: SharedSyncResult = { changed: false, pushed: false, canWrite: true }

let sync: ReturnType<typeof vi.fn<(id: number) => Promise<SharedSyncResult>>>
let isShared: ReturnType<typeof vi.fn<(id: number) => Promise<boolean>>>
let outcomes: Array<[number, SyncOutcome]>

function make() {
  return createSharedSyncScheduler({
    sync,
    isShared,
    onOutcome: (id, o) => outcomes.push([id, o]),
    now: () => 42,
  })
}
/** Lascia girare le promesse (i timer finti non le fanno avanzare da soli). */
const flush = () => vi.advanceTimersByTimeAsync(0)

beforeEach(() => {
  vi.useFakeTimers()
  sync = vi.fn(async () => OK)
  isShared = vi.fn(async () => true)
  outcomes = []
})
afterEach(() => vi.useRealTimers())

describe('start / polling', () => {
  it('sincronizza subito e poi ogni 15 secondi', async () => {
    const s = make()
    s.start(1)
    await flush()
    expect(sync).toHaveBeenCalledTimes(1)
    expect(outcomes[0]).toEqual([1, { ok: true, result: OK, at: 42 }])
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(sync).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2)
    expect(sync).toHaveBeenCalledTimes(4)
    s.stop()
  })

  it('stop ferma il polling; start su un\'altra lista cambia quella seguita', async () => {
    const s = make()
    s.start(1)
    await flush()
    s.start(2)
    await flush()
    expect(sync.mock.calls.map((c) => c[0])).toEqual([1, 2])
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(sync.mock.calls.map((c) => c[0])).toEqual([1, 2, 2])
    s.stop()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3)
    expect(sync).toHaveBeenCalledTimes(3)
  })

  it('una lista non più condivisa non si sincronizza', async () => {
    isShared.mockResolvedValue(false)
    const s = make()
    s.start(1)
    await flush()
    expect(sync).not.toHaveBeenCalled()
    expect(outcomes).toEqual([])
    s.stop()
  })
})

describe('notifyChange', () => {
  it('sincronizza 5 secondi dopo l\'ultima modifica, raggruppandole', async () => {
    const s = make()
    s.notifyChange(1)
    await vi.advanceTimersByTimeAsync(PUSH_DELAY_MS - 1000)
    s.notifyChange(1)
    await vi.advanceTimersByTimeAsync(PUSH_DELAY_MS - 1)
    expect(sync).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(sync).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(PUSH_DELAY_MS * 3)
    expect(sync).toHaveBeenCalledTimes(1)
  })

  it('funziona anche con la lista chiusa e per liste diverse', async () => {
    const s = make()
    s.notifyChange(1)
    s.notifyChange(2)
    await vi.advanceTimersByTimeAsync(PUSH_DELAY_MS)
    expect(sync.mock.calls.map((c) => c[0]).sort()).toEqual([1, 2])
  })

  it('le modifiche annunciate partono anche dopo stop', async () => {
    const s = make()
    s.start(1)
    await flush()
    s.notifyChange(1)
    s.stop()
    await vi.advanceTimersByTimeAsync(PUSH_DELAY_MS)
    expect(sync).toHaveBeenCalledTimes(2)
  })
})

describe('una sync alla volta', () => {
  it('se ne arriva un\'altra mentre gira, ne parte una subito dopo (una sola)', async () => {
    let release: () => void = () => {}
    sync.mockImplementationOnce(() => new Promise<SharedSyncResult>((res) => (release = () => res(OK))))
    const s = make()
    void s.syncNow(1)
    await flush()
    void s.syncNow(1)
    void s.syncNow(1)
    await flush()
    expect(sync).toHaveBeenCalledTimes(1)
    release()
    await flush()
    expect(sync).toHaveBeenCalledTimes(2)
    await flush()
    expect(sync).toHaveBeenCalledTimes(2)
  })

  it('liste diverse non si bloccano a vicenda', async () => {
    let release: () => void = () => {}
    sync.mockImplementationOnce(() => new Promise<SharedSyncResult>((res) => (release = () => res(OK))))
    const s = make()
    void s.syncNow(1)
    await flush()
    await s.syncNow(2)
    expect(sync.mock.calls.map((c) => c[0])).toEqual([1, 2])
    release()
    await flush()
  })
})

describe('app in background', () => {
  it('senza polling in background; al ritorno sincronizza subito e riparte', async () => {
    const s = make()
    s.start(1)
    await flush()
    s.setVisible(false)
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 4)
    expect(sync).toHaveBeenCalledTimes(1)
    s.setVisible(true)
    await flush()
    expect(sync).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(sync).toHaveBeenCalledTimes(3)
    s.stop()
  })

  it('start in background non sincronizza finché non si torna visibili; senza lista aperta il ritorno non fa niente', async () => {
    const s = make()
    s.setVisible(false)
    s.setVisible(true) // nessuna lista aperta
    await flush()
    expect(sync).not.toHaveBeenCalled()
    s.setVisible(false)
    s.start(1)
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2)
    expect(sync).not.toHaveBeenCalled()
    s.setVisible(true)
    await flush()
    expect(sync).toHaveBeenCalledTimes(1)
    s.stop()
  })
})

describe('errori', () => {
  const fail = (code: SharedSyncCode) => sync.mockRejectedValue(new SharedSyncError(code))

  it('senza rete riprova al giro dopo e riporta l\'esito', async () => {
    fail('network')
    const s = make()
    s.start(1)
    await flush()
    expect(outcomes[0][1]).toEqual({ ok: false, code: 'network', at: 42 })
    sync.mockResolvedValue(OK)
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(outcomes[1][1].ok).toBe(true)
    s.stop()
  })

  it('un errore che non passa da solo ferma il polling; il ritorno in primo piano riprova', async () => {
    fail('auth')
    const s = make()
    s.start(1)
    await flush()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3)
    expect(sync).toHaveBeenCalledTimes(1)
    sync.mockResolvedValue(OK)
    s.setVisible(false)
    s.setVisible(true)
    await flush()
    expect(sync).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(sync).toHaveBeenCalledTimes(3)
    s.stop()
  })

  it('un errore fatale di una lista non seguita non ferma il polling di quella aperta', async () => {
    sync.mockImplementation(async (id) => {
      if (id === 2) throw new SharedSyncError('no-access')
      return OK
    })
    const s = make()
    s.start(1)
    await flush()
    await s.syncNow(2)
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(sync.mock.calls.filter((c) => c[0] === 1)).toHaveLength(2)
    s.stop()
  })

  it('un errore qualunque è "unknown" e il polling continua', async () => {
    sync.mockRejectedValueOnce(new Error('boom'))
    const s = make()
    s.start(1)
    await flush()
    expect(outcomes[0][1]).toEqual({ ok: false, code: 'unknown', at: 42 })
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(sync).toHaveBeenCalledTimes(2)
    s.stop()
  })

  it('i codici non fatali (conflitto, sola lettura) non fermano il polling', async () => {
    fail('conflict')
    const s = make()
    s.start(1)
    await flush()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(sync).toHaveBeenCalledTimes(2)
    s.stop()
  })
})

describe('orologio predefinito', () => {
  it('senza `now` usa l\'ora di sistema', async () => {
    vi.setSystemTime(777)
    const s = createSharedSyncScheduler({ sync, isShared, onOutcome: (id, o) => outcomes.push([id, o]) })
    await s.syncNow(1)
    expect(outcomes[0][1].at).toBe(777)
  })
})
