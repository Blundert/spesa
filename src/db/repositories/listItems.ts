import { db } from '../db'
import type { ListItem } from '../types'

export interface ListItemWithItem extends ListItem {
  itemName: string
  itemCategoryId: number
  suggestedPriceCents: number | null
}

export async function getListItems(isoWeek: string): Promise<ListItemWithItem[]> {
  const listItems = await db.listItems.where('isoWeek').equals(isoWeek).toArray()

  return Promise.all(
    listItems.map(async (li) => {
      const item = await db.items.get(li.itemId)
      return {
        ...li,
        itemName: item?.name ?? '(eliminato)',
        itemCategoryId: item?.categoryId ?? 0,
        suggestedPriceCents: item?.suggestedPriceCents ?? null,
      }
    }),
  )
}

/**
 * Aggiunge un item alla lista della settimana.
 * Se già presente, incrementa la quantità invece di duplicare.
 */
export async function addToList(isoWeek: string, itemId: number): Promise<void> {
  const existing = await db.listItems
    .where('[isoWeek+itemId]')
    .equals([isoWeek, itemId])
    .first()

  if (existing?.id !== undefined) {
    await db.listItems.update(existing.id, { quantity: existing.quantity + 1 })
  } else {
    await db.listItems.add({ isoWeek, itemId, quantity: 1, addedAt: Date.now() })
  }
}

export async function removeFromList(id: number): Promise<void> {
  await db.listItems.delete(id)
}

export async function updateListItemQuantity(id: number, quantity: number): Promise<void> {
  if (quantity <= 0) {
    await db.listItems.delete(id)
  } else {
    await db.listItems.update(id, { quantity })
  }
}

export async function clearList(isoWeek: string): Promise<void> {
  await db.listItems.where('isoWeek').equals(isoWeek).delete()
}
