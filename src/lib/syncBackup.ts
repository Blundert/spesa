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
