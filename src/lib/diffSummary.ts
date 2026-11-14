import { TABLE_NAMES, type BackupDiff, type TableName } from './backupDiff'

export interface TableSummary {
  table: TableName
  added: number
  removed: number
  modified: number
}

/** Una riga per tabella con almeno una differenza, nell'ordine di `TABLE_NAMES`. */
export function summarizeDiff(diff: BackupDiff): TableSummary[] {
  return TABLE_NAMES.map((table) => ({
    table,
    added: diff[table].added.length,
    removed: diff[table].removed.length,
    modified: diff[table].modified.length,
  })).filter((s) => s.added + s.removed + s.modified > 0)
}
