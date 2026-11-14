import type { SafetySnapshot, SafetySnapshotReason } from '../db/types'
import type { HistoryEntry } from './gitSync'

/** Una voce scelta nella cronologia: una versione nel repository o una copia di sicurezza locale. */
export type HistorySelection =
  | { source: 'remote'; entry: HistoryEntry }
  | { source: 'local'; snapshot: SafetySnapshot }

export type HistoryKind = 'commit' | 'backupLocal' | 'backupRemote' | 'localCopy'

export interface HistoryItem {
  key: string
  kind: HistoryKind
  /** Timestamp ms, per ordinare e mostrare la data. */
  when: number
  /** Messaggio del commit (solo `commit`). */
  message?: string
  /** Perché è stata fatta la copia (solo `localCopy`). */
  reason?: SafetySnapshotReason
  selection: HistorySelection
}

export function selectionKey(sel: HistorySelection): string {
  if (sel.source === 'local') return `local:${sel.snapshot.id}`
  return sel.entry.kind === 'commit' ? `commit:${sel.entry.sha}` : `backup:${sel.entry.path}`
}

/** Unisce versioni del repository e copie di sicurezza locali in un'unica lista, dalla più recente. */
export function buildHistoryItems(remote: HistoryEntry[], local: SafetySnapshot[]): HistoryItem[] {
  const items: HistoryItem[] = []
  for (const entry of remote) {
    const selection: HistorySelection = { source: 'remote', entry }
    const when = new Date(entry.date).getTime()
    if (entry.kind === 'commit') {
      items.push({ key: selectionKey(selection), kind: 'commit', when, message: entry.message, selection })
    } else {
      items.push({
        key: selectionKey(selection),
        kind: entry.side === 'local' ? 'backupLocal' : 'backupRemote',
        when,
        selection,
      })
    }
  }
  for (const snapshot of local) {
    const selection: HistorySelection = { source: 'local', snapshot }
    items.push({
      key: selectionKey(selection),
      kind: 'localCopy',
      when: snapshot.createdAt,
      reason: snapshot.reason,
      selection,
    })
  }
  return items.sort((a, b) => b.when - a.when)
}
