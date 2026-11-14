import type { BackupData } from '../db/backup'

/**
 * Confronto tra due backup. Gli id sono locali al dispositivo (due dispositivi possono dare lo
 * stesso id a record diversi), quindi i record si abbinano per CHIAVE NATURALE (nome, settimana,
 * orario di inizio…) e i riferimenti (articolo, negozio, lista, piatto) si confrontano per nome.
 *
 * `diffBackups(a, b)` descrive cosa serve per passare da `a` a `b`:
 * aggiunto = c'è solo in `b`, rimosso = c'è solo in `a`, modificato = stessa chiave, campi diversi.
 *
 * Le statistiche degli articoli (ultimo prezzo, prezzo medio, quantità acquistata) NON sono
 * confrontate: si ricalcolano dagli acquisti e farebbero solo rumore.
 */

export type TableName =
  | 'categories'
  | 'items'
  | 'supermarkets'
  | 'weekBudgets'
  | 'shoppingLists'
  | 'listItems'
  | 'sessions'
  | 'purchases'
  | 'mealPlans'
  | 'dishes'
  | 'dishIngredients'

export const TABLE_NAMES: readonly TableName[] = [
  'categories',
  'items',
  'supermarkets',
  'weekBudgets',
  'shoppingLists',
  'listItems',
  'sessions',
  'purchases',
  'mealPlans',
  'dishes',
  'dishIngredients',
]

export type FieldValue = string | number | boolean | null

export interface DiffRow {
  /** Id del record nel backup di provenienza (locale a quel dispositivo). */
  id: number
  /** Chiave naturale: identifica il record tra dispositivi. */
  key: string
  /** Nome leggibile (articolo, negozio, settimana…); le date si formattano dai `fields`. */
  label: string
  /** Contenuto confrontabile: i riferimenti sono già risolti in nomi. */
  fields: Record<string, FieldValue>
}

export interface FieldChange {
  field: string
  from: FieldValue
  to: FieldValue
}

export interface ModifiedRow {
  key: string
  label: string
  changes: FieldChange[]
}

export interface TableDiff {
  added: DiffRow[]
  removed: DiffRow[]
  modified: ModifiedRow[]
}

export type BackupDiff = Record<TableName, TableDiff>

/** Hash FNV-1a: per confrontare i dati grossi (tessera fedeltà) senza tenerli nei campi. */
function fingerprint(s: string | null | undefined): string | null {
  if (!s) return null
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

/** Aggiunge "#2", "#3"… alle chiavi ripetute, così ogni riga ha una chiave unica. */
function uniqueKeys(rows: DiffRow[]): DiffRow[] {
  const seen = new Map<string, number>()
  return rows.map((r) => {
    const n = (seen.get(r.key) ?? 0) + 1
    seen.set(r.key, n)
    return n === 1 ? r : { ...r, key: `${r.key}#${n}` }
  })
}

/** Porta tutte le tabelle di un backup in righe con chiave naturale e riferimenti per nome. */
export function toRows(data: BackupData): Record<TableName, DiffRow[]> {
  const ref = (names: Map<number, string>, id: number): string => names.get(id) ?? `#${id}`
  const nameMap = <T extends { id?: number }>(rows: T[], name: (r: T) => string) =>
    new Map(rows.map((r) => [r.id as number, name(r)]))

  const dishes = data.dishes ?? []
  const lists = data.shoppingLists ?? []
  const categoryNames = nameMap(data.categories, (r) => r.name)
  const itemKeys = nameMap(data.items, (r) => r.normalizedName)
  const itemLabels = nameMap(data.items, (r) => r.name)
  const supermarketLabels = nameMap(data.supermarkets, (r) => r.name)
  const listNames = nameMap(lists, (r) => r.name)
  const dishKeys = nameMap(dishes, (r) => r.normalizedName)
  const dishLabels = nameMap(dishes, (r) => r.name)
  const sessionKeys = new Map(data.sessions.map((s) => [s.id as number, String(s.startedAt)]))
  const itemList = (ids: number[]) => ids.map((id) => ref(itemKeys, id))

  const rows: Record<TableName, DiffRow[]> = {
    categories: data.categories.map((c) => ({
      id: c.id as number,
      key: c.name,
      label: c.name,
      fields: { sortOrder: c.sortOrder },
    })),
    items: data.items.map((i) => ({
      id: i.id as number,
      key: i.normalizedName,
      label: i.name,
      fields: { name: i.name, category: ref(categoryNames, i.categoryId) },
    })),
    supermarkets: data.supermarkets.map((s) => ({
      id: s.id as number,
      key: s.normalizedName,
      label: s.name,
      fields: { name: s.name, loyaltyCard: fingerprint(s.loyaltyCard) },
    })),
    weekBudgets: data.weekBudgets.map((w) => ({
      id: w.id as number,
      key: w.isoWeek,
      label: w.isoWeek,
      fields: { buoniAvailable: w.buoniAvailable },
    })),
    shoppingLists: lists.map((l) => ({
      id: l.id as number,
      key: l.name,
      label: l.name,
      fields: {
        supermarket: l.supermarketId === null ? null : ref(supermarketLabels, l.supermarketId),
        sortOrder: l.sortOrder,
        archivedAt: l.archivedAt,
        usualItems: l.usualItemIds ? itemList(l.usualItemIds).join('|') : null,
        quickItems: l.quickItemIds ? itemList(l.quickItemIds).join('|') : null,
      },
    })),
    listItems: data.listItems.map((li) => ({
      id: li.id as number,
      key: `${ref(listNames, li.listId)}|${ref(itemKeys, li.itemId)}`,
      label: ref(itemLabels, li.itemId),
      fields: { list: ref(listNames, li.listId), quantity: li.quantity, addedAt: li.addedAt },
    })),
    sessions: data.sessions.map((s) => ({
      id: s.id as number,
      key: String(s.startedAt),
      label: ref(supermarketLabels, s.supermarketId),
      fields: {
        isoWeek: s.isoWeek,
        startedAt: s.startedAt,
        finishedAt: s.finishedAt,
        list: s.listId === undefined ? null : ref(listNames, s.listId),
        confirmedTotalCents: s.confirmedTotalCents,
        buoniSpent: s.buoniSpent,
        buoniValueCents: s.buoniValueCents,
      },
    })),
    purchases: data.purchases.map((p) => ({
      id: p.id as number,
      key: `${ref(sessionKeys, p.sessionId)}|${ref(itemKeys, p.itemId)}`,
      label: ref(itemLabels, p.itemId),
      fields: { session: ref(sessionKeys, p.sessionId), priceCents: p.priceCents, quantity: p.quantity },
    })),
    mealPlans: data.mealPlans.map((m) => ({
      id: m.id as number,
      key: `${m.isoWeek}|${m.dayIndex}|${m.mealType}`,
      label: m.dish,
      fields: {
        isoWeek: m.isoWeek,
        dayIndex: m.dayIndex,
        mealType: m.mealType,
        dish: m.dish,
        dishCatalog: m.dishId === undefined ? null : ref(dishKeys, m.dishId),
        selectedItems: m.selectedItemIds ? itemList(m.selectedItemIds).sort().join('|') : null,
      },
    })),
    dishes: dishes.map((d) => ({
      id: d.id as number,
      key: d.normalizedName,
      label: d.name,
      fields: { name: d.name },
    })),
    dishIngredients: (data.dishIngredients ?? []).map((di) => ({
      id: di.id as number,
      key: `${ref(dishKeys, di.dishId)}|${ref(itemKeys, di.itemId)}`,
      label: `${ref(dishLabels, di.dishId)} · ${ref(itemLabels, di.itemId)}`,
      fields: { dish: ref(dishKeys, di.dishId) },
    })),
  }
  for (const t of TABLE_NAMES) rows[t] = uniqueKeys(rows[t])
  return rows
}

function diffRows(a: DiffRow[], b: DiffRow[]): TableDiff {
  const before = new Map(a.map((r) => [r.key, r]))
  const after = new Map(b.map((r) => [r.key, r]))
  const modified: ModifiedRow[] = []
  for (const row of b) {
    const old = before.get(row.key)
    if (!old) continue
    const changes = Object.keys(row.fields)
      .filter((f) => old.fields[f] !== row.fields[f])
      .map((f) => ({ field: f, from: old.fields[f], to: row.fields[f] }))
    if (changes.length > 0) modified.push({ key: row.key, label: row.label, changes })
  }
  return {
    added: b.filter((r) => !before.has(r.key)),
    removed: a.filter((r) => !after.has(r.key)),
    modified,
  }
}

/** Cosa serve per passare dal backup `a` al backup `b`, tabella per tabella. */
export function diffBackups(a: BackupData, b: BackupData): BackupDiff {
  const ra = toRows(a)
  const rb = toRows(b)
  const out = {} as BackupDiff
  for (const t of TABLE_NAMES) out[t] = diffRows(ra[t], rb[t])
  return out
}

/** Numero totale di differenze (aggiunti + rimossi + modificati). */
export function countChanges(diff: BackupDiff): number {
  return TABLE_NAMES.reduce(
    (n, t) => n + diff[t].added.length + diff[t].removed.length + diff[t].modified.length,
    0,
  )
}
