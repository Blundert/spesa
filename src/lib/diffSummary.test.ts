import { describe, it, expect } from 'vitest'
import { TABLE_NAMES, type BackupDiff } from './backupDiff'
import { summarizeDiff } from './diffSummary'

const row = (key: string) => ({ key, label: key, fields: {} })

function emptyDiff(): BackupDiff {
  return Object.fromEntries(TABLE_NAMES.map((t) => [t, { added: [], removed: [], modified: [] }])) as unknown as BackupDiff
}

describe('summarizeDiff', () => {
  it('nessuna differenza: nessuna riga', () => {
    expect(summarizeDiff(emptyDiff())).toEqual([])
  })

  it('conta per tabella, solo quelle con differenze, nell’ordine delle tabelle', () => {
    const d = emptyDiff()
    d.sessions.removed = [row('a'), row('b')]
    d.items.added = [row('x')]
    d.items.modified = [{ key: 'm', label: 'm', changes: [] }]
    expect(summarizeDiff(d)).toEqual([
      { table: 'items', added: 1, removed: 0, modified: 1 },
      { table: 'sessions', added: 0, removed: 2, modified: 0 },
    ])
  })
})
