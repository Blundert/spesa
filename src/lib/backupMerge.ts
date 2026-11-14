import { BACKUP_VERSION, type BackupData } from '../db/backup'
import type {
  Category,
  Dish,
  DishIngredient,
  Item,
  ListItem,
  MealPlan,
  Purchase,
  Session,
  ShoppingList,
  Supermarket,
  WeekBudget,
} from '../db/types'
import { toRows, TABLE_NAMES, type DiffRow, type TableName } from './backupDiff'

/**
 * Unione di due backup (locale + remoto) scelta a gruppi:
 * - una SETTIMANA = spese, acquisti, budget e pasti di quella settimana;
 * - un ELEMENTO DEL CATALOGO = categoria, articolo, negozio, lista (con le sue voci) o piatto (con gli ingredienti).
 * Per ogni gruppo si sceglie il lato da tenere. Il risultato parte dal locale (id invariati) e inserisce i
 * record scelti dal remoto con id nuovi; i riferimenti si risolvono per nome e, se un record scelto ne richiede
 * uno che manca, questo viene aggiunto. Le statistiche degli articoli si ricalcolano dagli acquisti.
 */

export type Choice = 'local' | 'remote' | 'both'
export type GroupStatus = 'onlyLocal' | 'onlyRemote' | 'different'
export type GroupType = 'week' | 'list' | 'item' | 'supermarket' | 'category' | 'dish'

export interface MergeGroup {
  id: string
  type: GroupType
  /** Settimana ISO per `week`, nome leggibile per gli altri. */
  label: string
  status: GroupStatus
  /** Righe per tabella da una parte e dall'altra, per mostrare cosa contiene il gruppo. */
  local: Partial<Record<TableName, number>>
  remote: Partial<Record<TableName, number>>
  /** Scelte possibili: "both" (unione) solo per le settimane presenti da entrambe le parti. */
  choices: Choice[]
  /** Di partenza si tiene tutto: unione per le settimane diverse, il locale per il resto. */
  defaultChoice: Choice
}

const TYPE_ORDER: GroupType[] = ['week', 'list', 'item', 'supermarket', 'category', 'dish']
const ENTITY_TABLE: Record<Exclude<GroupType, 'week'>, TableName> = {
  list: 'shoppingLists',
  item: 'items',
  supermarket: 'supermarkets',
  category: 'categories',
  dish: 'dishes',
}

interface Member {
  table: TableName
  row: DiffRow
}

function groupsOf(data: BackupData): Map<string, Member[]> {
  const rows = toRows(data)
  const sessionWeek = new Map(rows.sessions.map((r) => [r.key, r.fields.isoWeek as string]))
  const out = new Map<string, Member[]>()
  const put = (id: string, table: TableName, row: DiffRow) => {
    const list = out.get(id) ?? []
    list.push({ table, row })
    out.set(id, list)
  }
  for (const r of rows.categories) put(`category:${r.key}`, 'categories', r)
  for (const r of rows.items) put(`item:${r.key}`, 'items', r)
  for (const r of rows.supermarkets) put(`supermarket:${r.key}`, 'supermarkets', r)
  for (const r of rows.shoppingLists) put(`list:${r.key}`, 'shoppingLists', r)
  for (const r of rows.listItems) put(`list:${r.fields.list}`, 'listItems', r)
  for (const r of rows.dishes) put(`dish:${r.key}`, 'dishes', r)
  for (const r of rows.dishIngredients) put(`dish:${r.fields.dish}`, 'dishIngredients', r)
  for (const r of rows.weekBudgets) put(`week:${r.key}`, 'weekBudgets', r)
  for (const r of rows.sessions) put(`week:${r.fields.isoWeek}`, 'sessions', r)
  for (const r of rows.purchases) put(`week:${sessionWeek.get(r.fields.session as string) ?? '?'}`, 'purchases', r)
  for (const r of rows.mealPlans) put(`week:${r.fields.isoWeek}`, 'mealPlans', r)
  return out
}

const signature = (members: Member[]): string =>
  members
    .map((m) => `${m.table}|${m.row.key}|${JSON.stringify(m.row.fields)}`)
    .sort()
    .join('\n')

function counts(members: Member[]): Partial<Record<TableName, number>> {
  const out: Partial<Record<TableName, number>> = {}
  for (const m of members) out[m.table] = (out[m.table] ?? 0) + 1
  return out
}

const typeOf = (id: string): GroupType => id.slice(0, id.indexOf(':')) as GroupType

/** I gruppi in cui locale e remoto non coincidono (quelli uguali non servono). */
export function planMerge(local: BackupData, remote: BackupData): MergeGroup[] {
  const l = groupsOf(local)
  const r = groupsOf(remote)
  const groups: MergeGroup[] = []
  for (const id of new Set([...l.keys(), ...r.keys()])) {
    const lm = l.get(id)
    const rm = r.get(id)
    const type = typeOf(id)
    const status: GroupStatus = !lm ? 'onlyRemote' : !rm ? 'onlyLocal' : 'different'
    if (lm && rm && signature(lm) === signature(rm)) continue
    const entity = type === 'week' ? undefined : ENTITY_TABLE[type]
    const label =
      type === 'week'
        ? id.slice('week:'.length)
        : (((rm ?? lm) as Member[]).find((m) => m.table === entity)?.row.label ?? id.slice(id.indexOf(':') + 1))
    const both = type === 'week' && status === 'different'
    groups.push({
      id,
      type,
      label,
      status,
      local: counts(lm ?? []),
      remote: counts(rm ?? []),
      choices: both ? ['both', 'local', 'remote'] : ['local', 'remote'],
      defaultChoice: both ? 'both' : status === 'onlyRemote' ? 'remote' : 'local',
    })
  }
  return groups.sort(
    (a, b) =>
      TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) ||
      (a.type === 'week' ? b.label.localeCompare(a.label) : a.label.localeCompare(b.label)),
  )
}

/** Gli id (per tabella) dei record di un gruppo, da una parte. */
function idsOf(members: Member[] | undefined): Record<TableName, Set<number>> {
  const out = Object.fromEntries(TABLE_NAMES.map((t) => [t, new Set<number>()])) as Record<TableName, Set<number>>
  for (const m of members ?? []) out[m.table].add(m.row.id)
  return out
}

interface Tables {
  categories: Category[]
  items: Item[]
  supermarkets: Supermarket[]
  weekBudgets: WeekBudget[]
  shoppingLists: ShoppingList[]
  listItems: ListItem[]
  sessions: Session[]
  purchases: Purchase[]
  mealPlans: MealPlan[]
  dishes: Dish[]
  dishIngredients: DishIngredient[]
}

const tablesOf = (d: BackupData): Tables => ({
  categories: d.categories,
  items: d.items,
  supermarkets: d.supermarkets,
  weekBudgets: d.weekBudgets,
  shoppingLists: d.shoppingLists ?? [],
  listItems: d.listItems,
  sessions: d.sessions,
  purchases: d.purchases,
  mealPlans: d.mealPlans,
  dishes: d.dishes ?? [],
  dishIngredients: d.dishIngredients ?? [],
})

/** Applica le scelte (mancanti = scelta di partenza) e produce il backup unito. */
export function applyMerge(
  local: BackupData,
  remote: BackupData,
  choices: Partial<Record<string, Choice>> = {},
): BackupData {
  const plan = planMerge(local, remote)
  const lg = groupsOf(local)
  const rg = groupsOf(remote)
  const L = tablesOf(local)
  const R = tablesOf(remote)
  const M: Tables = {
    categories: [...L.categories],
    items: [...L.items],
    supermarkets: [...L.supermarkets],
    weekBudgets: [...L.weekBudgets],
    shoppingLists: [...L.shoppingLists],
    listItems: [...L.listItems],
    sessions: [...L.sessions],
    purchases: [...L.purchases],
    mealPlans: [...L.mealPlans],
    dishes: [...L.dishes],
    dishIngredients: [...L.dishIngredients],
  }

  const next = Object.fromEntries(
    TABLE_NAMES.map((t) => [t, Math.max(0, ...L[t].map((r) => r.id as number), ...R[t].map((r) => r.id as number)) + 1]),
  ) as Record<TableName, number>
  const add = <T extends { id?: number }>(table: TableName, rows: T[], rec: T): number => {
    const id = next[table]++
    rows.push({ ...rec, id })
    return id
  }

  // id remoto → id nell'unione, per tabella
  const maps = Object.fromEntries(TABLE_NAMES.map((t) => [t, new Map<number, number>()])) as Record<
    TableName,
    Map<number, number>
  >

  const ensureCategory = (rid: number): number | undefined => {
    const hit = maps.categories.get(rid)
    if (hit !== undefined) return hit
    const rec = R.categories.find((c) => c.id === rid)
    if (!rec) return undefined
    const id =
      M.categories.find((c) => c.name === rec.name)?.id ?? add('categories', M.categories, rec)
    maps.categories.set(rid, id)
    return id
  }
  const ensureSupermarket = (rid: number): number | undefined => {
    const hit = maps.supermarkets.get(rid)
    if (hit !== undefined) return hit
    const rec = R.supermarkets.find((s) => s.id === rid)
    if (!rec) return undefined
    const id =
      M.supermarkets.find((s) => s.normalizedName === rec.normalizedName)?.id ??
      add('supermarkets', M.supermarkets, rec)
    maps.supermarkets.set(rid, id)
    return id
  }
  const ensureItem = (rid: number): number | undefined => {
    const hit = maps.items.get(rid)
    if (hit !== undefined) return hit
    const rec = R.items.find((i) => i.id === rid)
    if (!rec) return undefined
    const existing = M.items.find((i) => i.normalizedName === rec.normalizedName)
    const id =
      existing?.id ??
      add('items', M.items, { ...rec, categoryId: ensureCategory(rec.categoryId) ?? M.categories[0].id! })
    maps.items.set(rid, id)
    return id
  }
  const itemIds = (ids: number[] | undefined): number[] | undefined =>
    ids?.map(ensureItem).filter((x): x is number => x !== undefined)
  const listFields = (rec: ShoppingList) => ({
    name: rec.name,
    supermarketId: rec.supermarketId === null ? null : (ensureSupermarket(rec.supermarketId) ?? null),
    sortOrder: rec.sortOrder,
    archivedAt: rec.archivedAt,
    ...(rec.usualItemIds ? { usualItemIds: itemIds(rec.usualItemIds) } : {}),
    ...(rec.quickItemIds ? { quickItemIds: itemIds(rec.quickItemIds) } : {}),
  })
  const ensureList = (rid: number): number | undefined => {
    const hit = maps.shoppingLists.get(rid)
    if (hit !== undefined) return hit
    const rec = R.shoppingLists.find((l) => l.id === rid)
    if (!rec) return undefined
    const id =
      M.shoppingLists.find((l) => l.name === rec.name)?.id ??
      add('shoppingLists', M.shoppingLists, { ...rec, ...listFields(rec) })
    maps.shoppingLists.set(rid, id)
    return id
  }
  const ensureDish = (rid: number): number | undefined => {
    const hit = maps.dishes.get(rid)
    if (hit !== undefined) return hit
    const rec = R.dishes.find((d) => d.id === rid)
    if (!rec) return undefined
    const id =
      M.dishes.find((d) => d.normalizedName === rec.normalizedName)?.id ?? add('dishes', M.dishes, rec)
    maps.dishes.set(rid, id)
    return id
  }
  const required = (id: number | undefined): number => {
    if (id === undefined) throw new Error('Riferimento non valido nel backup remoto')
    return id
  }

  // Sostituisce in place un elemento del catalogo con la versione remota (stesso id nell'unione).
  const overwrite = <T extends { id?: number }>(rows: T[], id: number, rec: T) => {
    const i = rows.findIndex((r) => r.id === id)
    rows[i] = { ...rec, id }
  }

  const removeWhere = <T>(rows: T[], keep: (r: T) => boolean) => {
    const kept = rows.filter(keep)
    rows.length = 0
    rows.push(...kept)
  }

  const pendingDeletes: Array<() => void> = []

  const removeWeek = (week: string) => {
    const sessionIds = new Set(M.sessions.filter((s) => s.isoWeek === week).map((s) => s.id))
    removeWhere(M.purchases, (p) => !sessionIds.has(p.sessionId))
    removeWhere(M.sessions, (s) => s.isoWeek !== week)
    removeWhere(M.weekBudgets, (b) => b.isoWeek !== week)
    removeWhere(M.mealPlans, (m) => m.isoWeek !== week)
  }

  const insertWeek = (week: string, onlyMissing: boolean) => {
    for (const s of R.sessions.filter((x) => x.isoWeek === week)) {
      if (onlyMissing && M.sessions.some((x) => x.startedAt === s.startedAt)) continue
      const listId = s.listId === undefined ? undefined : ensureList(s.listId)
      const id = add('sessions', M.sessions, {
        ...s,
        supermarketId: required(ensureSupermarket(s.supermarketId)),
        listId,
      })
      maps.sessions.set(s.id as number, id)
      for (const p of R.purchases.filter((x) => x.sessionId === s.id)) {
        add('purchases', M.purchases, { ...p, sessionId: id, itemId: required(ensureItem(p.itemId)) })
      }
    }
    for (const b of R.weekBudgets.filter((x) => x.isoWeek === week)) {
      if (!M.weekBudgets.some((x) => x.isoWeek === week)) add('weekBudgets', M.weekBudgets, b)
    }
    for (const m of R.mealPlans.filter((x) => x.isoWeek === week)) {
      if (onlyMissing && M.mealPlans.some((x) => x.dayIndex === m.dayIndex && x.mealType === m.mealType && x.isoWeek === week)) {
        continue
      }
      add('mealPlans', M.mealPlans, {
        ...m,
        dishId: m.dishId === undefined ? undefined : ensureDish(m.dishId),
        selectedItemIds: itemIds(m.selectedItemIds),
      })
    }
  }

  for (const g of plan) {
    const choice = choices[g.id] ?? g.defaultChoice
    // "Locale" = non toccare niente (anche per un gruppo solo remoto: non lo si porta qui).
    // "Unione" ha senso solo per le settimane; per gli altri gruppi vale come "locale".
    if (choice === 'local' || (choice === 'both' && g.type !== 'week')) continue
    if (g.type === 'week') {
      const week = g.label
      if (choice === 'both') insertWeek(week, true)
      else if (g.status === 'onlyLocal') removeWeek(week)
      else {
        removeWeek(week)
        insertWeek(week, false)
      }
      continue
    }
    // Catalogo: l'entità e, per liste e piatti, anche le righe che le appartengono.
    const rIds = idsOf(rg.get(g.id))
    const lIds = idsOf(lg.get(g.id))
    if (g.type === 'category') {
      if (g.status === 'onlyRemote') [...rIds.categories].forEach((id) => ensureCategory(id))
      else if (g.status === 'onlyLocal') {
        const id = [...lIds.categories][0]
        pendingDeletes.push(() => {
          if (!M.items.some((i) => i.categoryId === id)) removeWhere(M.categories, (c) => c.id !== id)
        })
      } else {
        const rid = [...rIds.categories][0]
        const lid = [...lIds.categories][0]
        overwrite(M.categories, lid, R.categories.find((c) => c.id === rid) as Category)
      }
    } else if (g.type === 'item') {
      if (g.status === 'onlyRemote') [...rIds.items].forEach((id) => ensureItem(id))
      else if (g.status === 'onlyLocal') {
        const id = [...lIds.items][0]
        pendingDeletes.push(() => {
          const used =
            M.purchases.some((p) => p.itemId === id) ||
            M.listItems.some((x) => x.itemId === id) ||
            M.dishIngredients.some((x) => x.itemId === id) ||
            M.mealPlans.some((m) => m.selectedItemIds?.includes(id))
          if (!used) {
            removeWhere(M.items, (i) => i.id !== id)
            for (const l of M.shoppingLists) {
              if (l.usualItemIds?.includes(id)) l.usualItemIds = l.usualItemIds.filter((x) => x !== id)
              if (l.quickItemIds?.includes(id)) l.quickItemIds = l.quickItemIds.filter((x) => x !== id)
            }
          }
        })
      } else {
        const rec = R.items.find((i) => i.id === [...rIds.items][0]) as Item
        const lid = [...lIds.items][0]
        overwrite(M.items, lid, { ...rec, categoryId: required(ensureCategory(rec.categoryId)) })
        maps.items.set(rec.id as number, lid)
      }
    } else if (g.type === 'supermarket') {
      if (g.status === 'onlyRemote') [...rIds.supermarkets].forEach((id) => ensureSupermarket(id))
      else if (g.status === 'onlyLocal') {
        const id = [...lIds.supermarkets][0]
        pendingDeletes.push(() => {
          if (!M.sessions.some((s) => s.supermarketId === id) && !M.shoppingLists.some((l) => l.supermarketId === id)) {
            removeWhere(M.supermarkets, (s) => s.id !== id)
          }
        })
      } else {
        const rec = R.supermarkets.find((s) => s.id === [...rIds.supermarkets][0]) as Supermarket
        const lid = [...lIds.supermarkets][0]
        overwrite(M.supermarkets, lid, rec)
        maps.supermarkets.set(rec.id as number, lid)
      }
    } else if (g.type === 'list') {
      if (g.status !== 'onlyRemote') {
        // Le voci locali della lista escono sempre (con la lista o per essere sostituite).
        removeWhere(M.listItems, (x) => !lIds.listItems.has(x.id as number))
      }
      if (g.status === 'onlyLocal') {
        const id = [...lIds.shoppingLists][0]
        pendingDeletes.push(() => {
          if (!M.sessions.some((s) => s.listId === id)) removeWhere(M.shoppingLists, (l) => l.id !== id)
        })
      } else {
        const rec = R.shoppingLists.find((l) => l.id === [...rIds.shoppingLists][0]) as ShoppingList
        let lid: number
        if (g.status === 'different') {
          lid = [...lIds.shoppingLists][0]
          overwrite(M.shoppingLists, lid, { ...rec, ...listFields(rec) })
          maps.shoppingLists.set(rec.id as number, lid)
        } else {
          lid = required(ensureList(rec.id as number))
        }
        for (const x of R.listItems.filter((x) => rIds.listItems.has(x.id as number))) {
          add('listItems', M.listItems, { ...x, listId: lid, itemId: required(ensureItem(x.itemId)) })
        }
      }
    } else {
      // dish
      if (g.status !== 'onlyRemote') {
        removeWhere(M.dishIngredients, (x) => !lIds.dishIngredients.has(x.id as number))
      }
      if (g.status === 'onlyLocal') {
        const id = [...lIds.dishes][0]
        pendingDeletes.push(() => {
          if (!M.mealPlans.some((m) => m.dishId === id)) removeWhere(M.dishes, (d) => d.id !== id)
        })
      } else {
        const rec = R.dishes.find((d) => d.id === [...rIds.dishes][0]) as Dish
        let did: number
        if (g.status === 'different') {
          did = [...lIds.dishes][0]
          overwrite(M.dishes, did, rec)
          maps.dishes.set(rec.id as number, did)
        } else {
          did = required(ensureDish(rec.id as number))
        }
        for (const x of R.dishIngredients.filter((x) => rIds.dishIngredients.has(x.id as number))) {
          add('dishIngredients', M.dishIngredients, { ...x, dishId: did, itemId: required(ensureItem(x.itemId)) })
        }
      }
    }
  }
  for (const run of pendingDeletes) run()

  // Statistiche degli articoli: ricalcolate dagli acquisti (dalla spesa più recente), solo per chi ne ha.
  const startedAt = new Map(M.sessions.map((s) => [s.id as number, s.startedAt]))
  const byItem = new Map<number, Purchase[]>()
  for (const p of M.purchases) byItem.set(p.itemId, [...(byItem.get(p.itemId) ?? []), p])
  M.items = M.items.map((item) => {
    const ps = byItem.get(item.id as number)
    if (!ps) return item
    ps.sort(
      (a, b) => (startedAt.get(a.sessionId) ?? 0) - (startedAt.get(b.sessionId) ?? 0) || (a.id as number) - (b.id as number),
    )
    return {
      ...item,
      lastPriceCents: ps[ps.length - 1].priceCents,
      suggestedPriceCents: Math.round(ps.reduce((a, p) => a + p.priceCents, 0) / ps.length),
      purchaseCount: ps.reduce((a, p) => a + p.quantity, 0),
    }
  })

  const byId = <T extends { id?: number }>(rows: T[]) => rows.sort((a, b) => (a.id as number) - (b.id as number))
  return {
    version: Math.min(BACKUP_VERSION, Math.max(local.version, remote.version)),
    exportedAt: Date.now(),
    categories: byId(M.categories),
    items: byId(M.items),
    supermarkets: byId(M.supermarkets),
    weekBudgets: byId(M.weekBudgets),
    listItems: byId(M.listItems),
    sessions: byId(M.sessions),
    purchases: byId(M.purchases),
    mealPlans: byId(M.mealPlans),
    dishes: byId(M.dishes),
    dishIngredients: byId(M.dishIngredients),
    shoppingLists: byId(M.shoppingLists),
    settings: local.settings ?? remote.settings,
  }
}
