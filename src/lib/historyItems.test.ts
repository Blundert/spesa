import { describe, it, expect } from 'vitest'
import type { SafetySnapshot } from '../db/types'
import type { HistoryEntry } from './gitSync'
import { buildHistoryItems, selectionKey } from './historyItems'

const commit: HistoryEntry = { kind: 'commit', sha: 'abc', date: '2026-11-14T10:00:00.000Z', message: 'Backup x' }
const backupL: HistoryEntry = { kind: 'backup', path: 'backups/l.json', date: '2026-11-14T12:00:00.000Z', side: 'local', sha: '1' }
const backupR: HistoryEntry = { kind: 'backup', path: 'backups/r.json', date: '2026-11-13T12:00:00.000Z', side: 'remote', sha: '2' }
const snap: SafetySnapshot = { id: 7, createdAt: Date.parse('2026-11-14T11:00:00.000Z'), reason: 'pull', json: '{}' }

describe('selectionKey', () => {
  it('distingue commit, backup e copie locali', () => {
    expect(selectionKey({ source: 'remote', entry: commit })).toBe('commit:abc')
    expect(selectionKey({ source: 'remote', entry: backupL })).toBe('backup:backups/l.json')
    expect(selectionKey({ source: 'local', snapshot: snap })).toBe('local:7')
  })
})

describe('buildHistoryItems', () => {
  it('lista vuota', () => {
    expect(buildHistoryItems([], [])).toEqual([])
  })

  it('unisce remoto e locale dalla più recente, con tipo e dettagli', () => {
    const items = buildHistoryItems([commit, backupR, backupL], [snap])
    expect(items.map((i) => [i.kind, i.key])).toEqual([
      ['backupLocal', 'backup:backups/l.json'],
      ['localCopy', 'local:7'],
      ['commit', 'commit:abc'],
      ['backupRemote', 'backup:backups/r.json'],
    ])
    expect(items[1]).toMatchObject({ reason: 'pull', when: snap.createdAt })
    expect(items[2]).toMatchObject({ message: 'Backup x' })
    expect(items[0].selection).toEqual({ source: 'remote', entry: backupL })
  })
})
