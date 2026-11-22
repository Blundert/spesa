import { db } from '../db'
import type { SharedLink } from '../types'
import {
  cleanText,
  MAX_CATEGORY,
  MAX_NAME,
  MAX_QUANTITY,
  SHARED_FORMAT,
  SHOPPING_STALE_MS,
  SHARED_VERSION,
  type SharedItem,
  type SharedListFile,
} from '../../lib/sharedListFile'
import { assignListItemUids } from './listItems'
import { catalogResolver } from './sharedCatalog'
import { upsertSupermarket } from './supermarkets'
import { exportSharedSessions, importSharedSessions } from './sharedSessionsData'

async function sharedListOf(listId: number) {
  const list = await db.shoppingLists.get(listId)
  if (!list?.shared) throw new Error('Lista non condivisa')
  return { list, link: list.shared }
}

/** La lista condivisa com'è adesso su questo dispositivo, nel formato del file del repo. */
export async function exportSharedFile(listId: number): Promise<SharedListFile> {
  const { list, link } = await sharedListOf(listId)
  await assignListItemUids(listId, link.me)
  const rows = await db.listItems.where('listId').equals(listId).toArray()
  const [items, categories] = await Promise.all([
    db.items.bulkGet(rows.map((r) => r.itemId)),
    db.categories.toArray(),
  ])
  const categoryName = new Map(categories.map((c) => [c.id, c.name]))

  const out: SharedItem[] = []
  rows.forEach((r, i) => {
    const item = items[i]
    if (!item) return
    out.push({
      uid: r.uid as string,
      name: cleanText(item.name, MAX_NAME),
      categoryName: cleanText(categoryName.get(item.categoryId) ?? '?', MAX_CATEGORY),
      quantity: Math.min(MAX_QUANTITY, Math.max(1, r.quantity)),
      addedAt: r.addedAt,
      addedBy: r.addedBy ?? link.me,
      updatedAt: r.updatedAt ?? r.addedAt,
      takenBy: r.takenBy ?? null,
    })
  })

  const supermarket = list.supermarketId !== null ? await db.supermarkets.get(list.supermarketId) : undefined
  const mine = link.myShopping
  return {
    format: SHARED_FORMAT,
    version: SHARED_VERSION,
    uid: link.uid,
    name: cleanText(list.name, MAX_NAME),
    nameUpdatedAt: link.nameUpdatedAt ?? 0,
    supermarketName: supermarket ? cleanText(supermarket.name, MAX_NAME) : null,
    supermarketUpdatedAt: link.supermarketUpdatedAt ?? 0,
    // La mia spesa in corso (o appena finita), con le impostazioni con cui è partita.
    shopping: mine
      ? [
          {
            ...mine,
            supermarketName: cleanText(mine.supermarketName, MAX_NAME),
            buoniSpent: Math.min(1000, Math.max(0, Math.round(mine.buoniSpent))),
            buoniValueCents: Math.min(100_000, Math.max(0, Math.round(mine.buoniValueCents))),
          },
        ]
      : [],
    items: out,
    tombstones: link.tombstones,
    sessions: await exportSharedSessions(listId, link),
  }
}

/**
 * Porta su questo dispositivo il risultato del merge: nome, voci (nuove, cambiate, sparite), eliminazioni da
 * ricordare, persone e spese concluse. Gli articoli si collegano al catalogo per nome (vedi `catalogResolver`: se qui
 * non hanno una categoria vera prendono quella di chi li ha condivisi).
 */
export async function applySharedFile(listId: number, file: SharedListFile, now: number = Date.now()): Promise<void> {
  const tables = [db.shoppingLists, db.listItems, db.items, db.categories, db.sessions, db.purchases, db.supermarkets]
  await db.transaction('rw', tables, async () => {
    const { list, link } = await sharedListOf(listId)
    const catalog = await catalogResolver()

    const rows = await db.listItems.where('listId').equals(listId).toArray()
    const byUid = new Map(rows.filter((r) => r.uid).map((r) => [r.uid as string, r]))
    const inFile = new Set(file.items.map((i) => i.uid))

    for (const fi of file.items) {
      const itemId = await catalog.item(fi.name, fi.categoryName)
      const fields = {
        itemId,
        quantity: fi.quantity,
        addedAt: fi.addedAt,
        addedBy: fi.addedBy,
        updatedAt: fi.updatedAt,
        takenBy: fi.takenBy,
      }
      const existing = byUid.get(fi.uid)
      if (existing) await db.listItems.update(existing.id as number, fields)
      else await db.listItems.add({ listId, uid: fi.uid, ...fields })
    }
    const gone = rows.filter((r) => r.uid && !inFile.has(r.uid)).map((r) => r.id as number)
    await db.listItems.bulkDelete(gone)

    // Chi compare nel file (autori, chi ha preso una voce, chi ha fatto la spesa) e chi possiede il repo è una
    // persona della lista. Una persona nuova parte come "estraneo": le sue spese non toccano il mio budget
    // finché non dico io che è un partner.
    const logins = new Set<string>([link.owner])
    for (const i of file.items) {
      logins.add(i.addedBy)
      if (i.takenBy) logins.add(i.takenBy)
    }
    for (const x of file.sessions) logins.add(x.doneBy)
    logins.delete(link.me)
    const members = { ...link.members }
    for (const login of logins) {
      if (!Object.prototype.hasOwnProperty.call(members, login)) members[login] = { label: '', kind: 'stranger' }
    }

    // Le spese in corso degli altri (quelle finite o dimenticate da ore non si mostrano).
    const shopping = (file.shopping ?? []).filter(
      (x) => x.by !== link.me && x.endedAt === null && now - x.startedAt < SHOPPING_STALE_MS,
    )
    const patch: SharedLink = {
      ...link,
      tombstones: file.tombstones,
      members,
      shopping,
      supermarketUpdatedAt: Math.max(link.supermarketUpdatedAt ?? 0, file.supermarketUpdatedAt ?? 0),
    }
    const renamed = file.nameUpdatedAt > (link.nameUpdatedAt ?? 0)
    if (renamed) patch.nameUpdatedAt = file.nameUpdatedAt
    // Il supermercato della lista lo prende chi non ne ha uno (se qui ce n'è già uno, resta quello scelto qui).
    const adoptStore = list.supermarketId === null && file.supermarketName ? await upsertSupermarket(file.supermarketName) : null
    await db.shoppingLists.update(listId, {
      ...(renamed ? { name: file.name } : {}),
      ...(adoptStore !== null ? { supermarketId: adoptStore } : {}),
      shared: patch,
    })

    // Le spese concluse degli altri (e le mie, su un dispositivo nuovo) entrano nello storico.
    await importSharedSessions(listId, patch, file.sessions)
  })
}

/** Aggiorna alcuni campi del collegamento di una lista (sha dell'ultimo sync, permesso di scrittura…). */
export async function patchSharedLink(listId: number, patch: Partial<SharedLink>): Promise<void> {
  const { link } = await sharedListOf(listId)
  await db.shoppingLists.update(listId, { shared: { ...link, ...patch } })
}
