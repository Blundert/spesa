import { db } from '../db'
import { normalizeName } from '../../lib/normalize'
import type { Item } from '../types'

export async function getItems(): Promise<Item[]> {
  return db.items.toArray()
}

export async function getItemById(id: number): Promise<Item | undefined> {
  return db.items.get(id)
}

export async function getItemsByCategory(categoryId: number): Promise<Item[]> {
  return db.items.where('categoryId').equals(categoryId).toArray()
}

/**
 * Trova un item per nome normalizzato (dedup).
 */
export async function findItemByName(name: string): Promise<Item | undefined> {
  return db.items.where('normalizedName').equals(normalizeName(name)).first()
}

/**
 * Crea un item solo se non esiste già un altro con lo stesso normalizedName.
 * Ritorna l'id dell'item esistente o di quello appena creato.
 */
export async function upsertItem(
  name: string,
  categoryId: number,
  suggestedPriceCents?: number,
): Promise<number> {
  const normalized = normalizeName(name)
  const existing = await db.items.where('normalizedName').equals(normalized).first()
  if (existing?.id !== undefined) return existing.id

  const id = await db.items.add({
    name: name.trim(),
    normalizedName: normalized,
    categoryId,
    lastPriceCents: null,
    suggestedPriceCents: suggestedPriceCents ?? null,
  })
  return id as number
}

export async function updateItemPrices(
  id: number,
  lastPriceCents: number,
  suggestedPriceCents: number,
): Promise<void> {
  await db.items.update(id, { lastPriceCents, suggestedPriceCents })
}

export async function deleteItem(id: number): Promise<void> {
  await db.transaction('rw', [db.items, db.listItems, db.purchases], async () => {
    await db.listItems.where('itemId').equals(id).delete()
    await db.items.delete(id)
  })
}

export async function renameItem(id: number, name: string): Promise<void> {
  await db.items.update(id, { name: name.trim(), normalizedName: normalizeName(name) })
}

export async function moveItemCategory(id: number, categoryId: number): Promise<void> {
  await db.items.update(id, { categoryId })
}
