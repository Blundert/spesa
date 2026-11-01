import { db } from '../db'
import type { ShoppingList } from '../types'

/** Errore: l'ultima lista attiva non si può archiviare né eliminare. */
export const LAST_ACTIVE_LIST = 'LAST_ACTIVE_LIST'

/** Tutte le liste (archiviate comprese), nell'ordine scelto dall'utente. */
export async function getShoppingLists(): Promise<ShoppingList[]> {
  const lists = await db.shoppingLists.toArray()
  return lists.sort((a, b) => a.sortOrder - b.sortOrder || (a.id as number) - (b.id as number))
}

/** Crea una lista in fondo all'ordine. */
export async function createShoppingList(name: string, supermarketId: number | null): Promise<number> {
  const lists = await db.shoppingLists.toArray()
  const sortOrder = lists.reduce((max, l) => Math.max(max, l.sortOrder), -1) + 1
  const id = await db.shoppingLists.add({ name: name.trim(), supermarketId, sortOrder, archivedAt: null })
  return id as number
}

export async function updateShoppingList(
  id: number,
  patch: Partial<Pick<ShoppingList, 'name' | 'supermarketId'>>,
): Promise<void> {
  await db.shoppingLists.update(id, patch.name !== undefined ? { ...patch, name: patch.name.trim() } : patch)
}

async function assertNotLastActive(id: number): Promise<void> {
  const active = (await db.shoppingLists.toArray()).filter((l) => l.archivedAt === null)
  if (active.length === 1 && active[0].id === id) throw new Error(LAST_ACTIVE_LIST)
}

/** Archivia una lista: sparisce dalle schede ma tiene i suoi prodotti. */
export async function archiveShoppingList(id: number): Promise<void> {
  await assertNotLastActive(id)
  await db.shoppingLists.update(id, { archivedAt: Date.now() })
}

export async function restoreShoppingList(id: number): Promise<void> {
  await db.shoppingLists.update(id, { archivedAt: null })
}

/**
 * Elimina definitivamente una lista e le sue voci. Le spese fatte con la lista restano
 * (con un `listId` che non punta più a niente).
 */
export async function deleteShoppingList(id: number): Promise<void> {
  await assertNotLastActive(id)
  await db.transaction('rw', [db.shoppingLists, db.listItems], async () => {
    await db.listItems.where('listId').equals(id).delete()
    await db.shoppingLists.delete(id)
  })
}

/** Riordina le liste secondo l'ordine degli id passati. */
export async function reorderShoppingLists(ids: number[]): Promise<void> {
  await db.transaction('rw', db.shoppingLists, async () => {
    await Promise.all(ids.map((id, sortOrder) => db.shoppingLists.update(id, { sortOrder })))
  })
}

/**
 * Prodotti più comprati nelle spese partite da una lista (quantità totali, decrescenti):
 * la base della "spesa solita" di quella lista.
 */
export async function getUsualItems(listId: number): Promise<Array<{ itemId: number; count: number }>> {
  const sessions = await db.sessions.where('listId').equals(listId).toArray()
  const sessionIds = sessions.map((s) => s.id as number)
  const purchases = sessionIds.length ? await db.purchases.where('sessionId').anyOf(sessionIds).toArray() : []
  const counts = new Map<number, number>()
  for (const p of purchases) counts.set(p.itemId, (counts.get(p.itemId) ?? 0) + p.quantity)
  return Array.from(counts, ([itemId, count]) => ({ itemId, count })).sort(
    (a, b) => b.count - a.count || a.itemId - b.itemId,
  )
}

/** Numero di voci per lista (per la pagina Liste). */
export async function getListItemCounts(): Promise<Record<number, number>> {
  const counts: Record<number, number> = {}
  for (const li of await db.listItems.toArray()) counts[li.listId] = (counts[li.listId] ?? 0) + 1
  return counts
}
