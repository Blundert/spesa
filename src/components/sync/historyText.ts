import type { TFunction } from 'i18next'
import type { HistoryItem } from '../../lib/historyItems'
import { formatDate } from '../../lib/date'

export function formatDateTime(ts: number): string {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(ts)}, ${hh}:${mm}`
}

/** Titolo di una voce della cronologia. */
export function historyTitle(t: TFunction, item: HistoryItem): string {
  switch (item.kind) {
    case 'commit':
      return t('syncPage.kindCommit')
    case 'backupLocal':
      return t('syncPage.kindBackupLocal')
    case 'backupRemote':
      return t('syncPage.kindBackupRemote')
    case 'localCopy':
      return t('syncPage.kindLocalCopy')
  }
}

/** Riga di dettaglio sotto il titolo: motivo della copia locale o messaggio del commit. */
export function historyDetail(t: TFunction, item: HistoryItem): string | null {
  if (item.kind === 'localCopy') {
    if (item.reason === 'pull') return t('syncPage.reasonPull')
    if (item.reason === 'import-file') return t('syncPage.reasonImport')
    return t('syncPage.reasonRestore')
  }
  return item.kind === 'commit' ? (item.message ?? null) : null
}
