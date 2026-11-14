import type { BackupData } from '../db/backup'
import { SEED_CATEGORIES } from '../db/db'
import { DEFAULT_LIST_NAME } from '../db/types'

export type BackupSide = 'local' | 'remote'

/** Percorso nel repo del backup del lato scartato: senza ":" né "." nel timestamp (valido ovunque). */
export function backupPath(iso: string, side: BackupSide): string {
  return `backups/${iso.replace(/[:.]/g, '-')}-${side}.json`
}

/**
 * True se i dati locali sono solo quelli iniziali (categorie seed + lista "Spesa" vuote):
 * non c'è niente da proteggere e un conflitto di sync non ha senso.
 */
export function isInitialData(data: BackupData): boolean {
  const empty = [
    data.items,
    data.supermarkets,
    data.weekBudgets,
    data.listItems,
    data.sessions,
    data.purchases,
    data.mealPlans,
    data.dishes ?? [],
    data.dishIngredients ?? [],
  ].every((rows) => rows.length === 0)
  if (!empty) return false
  const seedLike =
    data.categories.length === SEED_CATEGORIES.length &&
    SEED_CATEGORIES.every((s) => data.categories.some((c) => c.name === s.name && c.sortOrder === s.sortOrder))
  if (!seedLike) return false
  const lists = data.shoppingLists ?? []
  return (
    lists.length === 0 ||
    (lists.length === 1 &&
      lists[0].name === DEFAULT_LIST_NAME &&
      lists[0].supermarketId === null &&
      lists[0].archivedAt === null)
  )
}

const BACKUP_NAME = /^backups\/(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z-(local|remote)\.json$/

/** Inverso di `backupPath`: data (ISO) e lato di un file di backup, o null se non è uno dei nostri. */
export function parseBackupPath(path: string): { iso: string; side: BackupSide } | null {
  const m = BACKUP_NAME.exec(path)
  if (!m) return null
  return { iso: `${m[1]}T${m[2]}:${m[3]}:${m[4]}.${m[5]}Z`, side: m[6] as BackupSide }
}

/** Regole di base di git per i nomi dei branch (abbastanza severe da non produrre mai un nome rifiutato). */
export function isValidBranchName(name: string): boolean {
  if (name.length === 0 || name.length > 100) return false
  if (name.startsWith('-') || name.startsWith('/') || name.endsWith('/') || name.endsWith('.') || name.endsWith('.lock')) {
    return false
  }
  if (name.includes('..') || name.includes('//') || name.includes('@{')) return false
  // spazi e ~ ^ : ? * [ \ non sono ammessi, né i caratteri di controllo
  if (/[\s~^:?*[\\]/.test(name)) return false
  return ![...name].some((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127)
}
