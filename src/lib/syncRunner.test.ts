import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'

const toastFn = Object.assign(vi.fn(), { warning: vi.fn(), error: vi.fn() })
vi.mock('sonner', () => ({ toast: toastFn }))
vi.mock('i18next', () => ({
  default: { t: (key: string, o?: { path?: string }) => (o?.path ? `${key}:${o.path}` : key) },
}))
const sync = { autoSync: vi.fn(), syncPull: vi.fn(), syncPushForce: vi.fn() }
vi.mock('./gitSync', () => sync)

const { runSync, toastWithBackup } = await import('./syncRunner')

const qc = { invalidateQueries: vi.fn(async () => {}) } as unknown as QueryClient

beforeEach(() => {
  vi.clearAllMocks()
})

type ConflictOpts = { action: { onClick: () => void }; cancel: { onClick: () => void } }
async function conflictOpts(): Promise<ConflictOpts> {
  sync.autoSync.mockResolvedValue({ status: 'conflict' })
  await runSync(qc)
  return toastFn.warning.mock.calls[0][1] as ConflictOpts
}
const flush = () => new Promise((r) => setTimeout(r, 0))

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
  it('"Usa remoto": scarica, aggiorna e mostra il backup salvato', async () => {
    const o = await conflictOpts()
    sync.syncPull.mockResolvedValue({ backupPath: 'backups/l.json' })
    o.action.onClick()
    await flush()
    expect(qc.invalidateQueries).toHaveBeenCalled()
    expect(toastFn).toHaveBeenCalledWith('settings.syncPulled', {
      description: 'settings.syncBackupSaved:backups/l.json',
    })
  })

  it('"Usa remoto": un errore (anche di backup) viene mostrato', async () => {
    const o = await conflictOpts()
    sync.syncPull.mockRejectedValue(new Error('GitHub 401'))
    o.action.onClick()
    await flush()
    expect(toastFn.error).toHaveBeenCalledWith('settings.syncError: GitHub 401')
    sync.syncPull.mockRejectedValue('x')
    o.action.onClick()
    await flush()
    expect(toastFn.error).toHaveBeenLastCalledWith('settings.syncError: ')
  })

  it('"Mantieni": un commit e toast con il backup del remoto', async () => {
    const o = await conflictOpts()
    sync.syncPushForce.mockResolvedValue({ backupPath: 'backups/r.json' })
    o.cancel.onClick()
    await flush()
    expect(toastFn).toHaveBeenCalledWith('settings.syncDone', {
      description: 'settings.syncBackupSaved:backups/r.json',
    })
  })

  it('"Mantieni": errore mostrato', async () => {
    const o = await conflictOpts()
    sync.syncPushForce.mockRejectedValue(new Error('Il remoto è cambiato'))
    o.cancel.onClick()
    await flush()
    expect(toastFn.error).toHaveBeenCalledWith('settings.syncError: Il remoto è cambiato')
    sync.syncPushForce.mockRejectedValue('x')
    o.cancel.onClick()
    await flush()
    expect(toastFn.error).toHaveBeenLastCalledWith('settings.syncError: ')
  })
})
