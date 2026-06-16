import { db } from '../db'
import type { ListItem } from '../types'

export interface ListItemWithItem extends ListItem {
  itemName: string
  itemCategoryId: number
  suggestedPriceCents: number | null
}

export async function getListItems(): Promise<ListItemWithItem[]> {
  const listItems = await db.listItems.toArray()

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
 * Aggiunge un item alla lista globale.
 * Se già presente, incrementa la quantità invece di duplicare.
 */
export async function addToList(itemId: number): Promise<void> {
  const existing = await db.listItems.where('itemId').equals(itemId).first()

  if (existing?.id !== undefined) {
    await db.listItems.update(existing.id, { quantity: existing.quantity + 1 })
  } else {
    await db.listItems.add({ itemId, quantity: 1, addedAt: Date.now() })
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

/** Svuota l'intera lista (usato a fine spesa). */
export async function clearList(): Promise<void> {
  await db.listItems.clear()
}
