import { db } from '../db'
import type { ListItem } from '../types'

export interface ListItemWithItem extends ListItem {
  itemName: string
  itemCategoryId: number
  suggestedPriceCents: number | null
}

export async function getListItems(listId: number): Promise<ListItemWithItem[]> {
  const listItems = await db.listItems.where('listId').equals(listId).toArray()

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
 * Aggiunge un item a una lista.
 * Se già presente in quella lista, incrementa la quantità invece di duplicare.
 */
export async function addToList(listId: number, itemId: number): Promise<void> {
  const existing = await db.listItems.where('[listId+itemId]').equals([listId, itemId]).first()

  if (existing?.id !== undefined) {
    await db.listItems.update(existing.id, { quantity: existing.quantity + 1 })
  } else {
    await db.listItems.add({ listId, itemId, quantity: 1, addedAt: Date.now() })
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

/**
 * Rimuove da una lista solo le voci corrispondenti agli item acquistati
 * (usato a fine spesa). Le voci non acquistate e le altre liste restano invariate.
 */
export async function removePurchasedFromList(listId: number, itemIds: number[]): Promise<void> {
  if (itemIds.length === 0) return
  const ids = new Set(itemIds)
  await db.listItems
    .where('listId')
    .equals(listId)
    .filter((li) => ids.has(li.itemId))
    .delete()
}

/** Svuota una lista: rimuove tutte le sue voci. Item del catalogo, prezzi e acquisti restano. */
export async function clearList(listId: number): Promise<void> {
  await db.listItems.where('listId').equals(listId).delete()
}
