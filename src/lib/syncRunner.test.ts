import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'

const toastFn = Object.assign(vi.fn(), { warning: vi.fn(), error: vi.fn() })
vi.mock('sonner', () => ({ toast: toastFn }))
vi.mock('i18next', () => ({
  default: { t: (key: string, o?: { path?: string }) => (o?.path ? `${key}:${o.path}` : key) },
}))
const sync = { autoSync: vi.fn() }
vi.mock('./gitSync', () => sync)
const nav = { openMerge: vi.fn() }
vi.mock('./mergeNav', () => nav)

const { runSync, toastWithBackup } = await import('./syncRunner')

const qc = { invalidateQueries: vi.fn(async () => {}) } as unknown as QueryClient

beforeEach(() => {
  vi.clearAllMocks()
})

describe('toastWithBackup', () => {
  it('con backup indica il file', () => {
    toastWithBackup('ok', { backupPath: 'backups/x.json' })
    expect(toastFn).toHaveBeenCalledWith('ok', { description: 'settings.syncBackupSaved:backups/x.json' })
  })

  it('senza backup è un toast semplice', () => {
    toastWithBackup('ok', { backupPath: null })
    expect(toastFn).toHaveBeenCalledWith('ok')
  })
})

describe('runSync', () => {
  it('pulled: aggiorna le query e avvisa', async () => {
    sync.autoSync.mockResolvedValue({ status: 'pulled' })
    await runSync(qc)
    expect(qc.invalidateQueries).toHaveBeenCalled()
    expect(toastFn).toHaveBeenCalledWith('settings.syncPulled')
  })

  it('pushed / noop / notConfigured: silenzio, salvo announce', async () => {
    for (const status of ['pushed', 'noop', 'notConfigured']) {
      sync.autoSync.mockResolvedValue({ status })
      await runSync(qc)
    }
    expect(toastFn).not.toHaveBeenCalled()
    expect(toastFn.error).not.toHaveBeenCalled()

    sync.autoSync.mockResolvedValueOnce({ status: 'pushed' })
    await runSync(qc, { announce: true })
    sync.autoSync.mockResolvedValueOnce({ status: 'noop' })
    await runSync(qc, { announce: true })
    sync.autoSync.mockResolvedValueOnce({ status: 'notConfigured' })
    await runSync(qc, { announce: true })
    expect(toastFn).toHaveBeenCalledWith('settings.syncDone')
    expect(toastFn).toHaveBeenCalledWith('settings.syncUpToDate')
    expect(toastFn.error).toHaveBeenCalledWith('settings.syncNotConfigured')
  })

  it('errore: tace, salvo announce', async () => {
    sync.autoSync.mockRejectedValue(new Error('boom'))
    await runSync(qc)
    expect(toastFn.error).not.toHaveBeenCalled()
    await runSync(qc, { announce: true })
    expect(toastFn.error).toHaveBeenCalledWith('settings.syncError: boom')
    sync.autoSync.mockRejectedValue('stringa')
    await runSync(qc, { announce: true })
    expect(toastFn.error).toHaveBeenLastCalledWith('settings.syncError: ')
  })

  it('non parte due volte in parallelo', async () => {
    let release: () => void = () => {}
    sync.autoSync.mockReturnValue(new Promise((r) => (release = () => r({ status: 'noop' }))))
    const first = runSync(qc)
    await runSync(qc)
    expect(sync.autoSync).toHaveBeenCalledTimes(1)
    release()
    await first
  })
})

describe('conflitto', () => {
  it('toast persistente con un solo pulsante che apre la schermata di unione', async () => {
    sync.autoSync.mockResolvedValue({ status: 'conflict' })
    await runSync(qc)
    expect(toastFn.warning).toHaveBeenCalledOnce()
    const [text, opts] = toastFn.warning.mock.calls[0] as [string, { id: string; duration: number; action: { label: string; onClick: () => void } }]
    expect(text).toBe('settings.syncConflict')
    expect(opts).toMatchObject({ id: 'sync-conflict', duration: Infinity })
    expect(opts.action.label).toBe('syncMerge.review')
    opts.action.onClick()
    expect(nav.openMerge).toHaveBeenCalledOnce()
  })
})
