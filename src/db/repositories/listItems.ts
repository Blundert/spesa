import { db } from '../db'
import type { ListItem } from '../types'
import { newUid } from '../../lib/sharedList'

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
 * Segna come eliminate le voci (con uid) di liste condivise, perché il merge con il repo non le faccia
 * ricomparire. Per le voci di liste non condivise non fa niente. Da chiamare nella stessa transazione
 * che cancella le righe (tabelle `listItems` e `shoppingLists`).
 */
export async function tombstoneListItems(rows: ListItem[], now: number = Date.now()): Promise<void> {
  const byList = new Map<number, string[]>()
  for (const r of rows) {
    if (r.uid) byList.set(r.listId, [...(byList.get(r.listId) ?? []), r.uid])
  }
  for (const [listId, uids] of byList) {
    const list = await db.shoppingLists.get(listId)
    if (!list?.shared) continue
    const tombstones = { ...list.shared.tombstones }
    for (const uid of uids) tombstones[uid] = now
    await db.shoppingLists.update(listId, { shared: { ...list.shared, tombstones } })
  }
}

/**
 * Aggiunge un item a una lista.
 * Se già presente in quella lista, incrementa la quantità invece di duplicare.
 * Nelle liste condivise la voce porta uid, autore e data di modifica.
 */
export async function addToList(listId: number, itemId: number): Promise<void> {
  const [existing, list] = await Promise.all([
    db.listItems.where('[listId+itemId]').equals([listId, itemId]).first(),
    db.shoppingLists.get(listId),
  ])
  const now = Date.now()
  const shared = list?.shared

  if (existing?.id !== undefined) {
    await db.listItems.update(existing.id, {
      quantity: existing.quantity + 1,
      ...(shared ? { updatedAt: now } : {}),
    })
  } else {
    await db.listItems.add({
      listId,
      itemId,
      quantity: 1,
      addedAt: now,
      ...(shared ? { uid: newUid(), updatedAt: now, addedBy: shared.me } : {}),
    })
  }
}

async function deleteRows(rows: ListItem[]): Promise<void> {
  await db.transaction('rw', [db.listItems, db.shoppingLists], async () => {
    await tombstoneListItems(rows)
    await db.listItems.bulkDelete(rows.map((r) => r.id as number))
  })
}

export async function removeFromList(id: number): Promise<void> {
  const row = await db.listItems.get(id)
  if (row) await deleteRows([row])
}

export async function updateListItemQuantity(id: number, quantity: number): Promise<void> {
  if (quantity <= 0) {
    await removeFromList(id)
    return
  }
  const row = await db.listItems.get(id)
  if (!row) return
  await db.listItems.update(id, { quantity, ...(row.uid ? { updatedAt: Date.now() } : {}) })
}

/**
 * Rimuove da una lista solo le voci corrispondenti agli item acquistati
 * (usato a fine spesa). Le voci non acquistate e le altre liste restano invariate.
 */
export async function removePurchasedFromList(listId: number, itemIds: number[]): Promise<void> {
  if (itemIds.length === 0) return
  const ids = new Set(itemIds)
  const rows = await db.listItems
    .where('listId')
    .equals(listId)
    .filter((li) => ids.has(li.itemId))
    .toArray()
  await deleteRows(rows)
}

/** Svuota una lista: rimuove tutte le sue voci. Item del catalogo, prezzi e acquisti restano. */
export async function clearList(listId: number): Promise<void> {
  await deleteRows(await db.listItems.where('listId').equals(listId).toArray())
}

/**
 * Dà un identificatore stabile alle voci di una lista che sta per essere condivisa (o che ne ha
 * ancora senza), segnando `me` come chi le ha aggiunte. Le voci che lo hanno già restano come sono.
 */
export async function assignListItemUids(listId: number, me: string): Promise<void> {
  const items = await db.listItems.where('listId').equals(listId).toArray()
  await Promise.all(
    items
      .filter((li) => !li.uid)
      .map((li) => db.listItems.update(li.id as number, { uid: newUid(), updatedAt: li.addedAt, addedBy: me })),
  )
}
