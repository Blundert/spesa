import { db } from '../db'
import type { SharedLink } from '../types'
import { normalizeName } from '../../lib/normalize'
import {
  cleanText,
  MAX_CATEGORY,
  MAX_NAME,
  MAX_QUANTITY,
  SHARED_FORMAT,
  SHARED_VERSION,
  type SharedItem,
  type SharedListFile,
} from '../../lib/sharedListFile'
import { assignListItemUids } from './listItems'
import { upsertItem } from './items'
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

  return {
    format: SHARED_FORMAT,
    version: SHARED_VERSION,
    uid: link.uid,
    name: cleanText(list.name, MAX_NAME),
    nameUpdatedAt: link.nameUpdatedAt ?? 0,
    items: out,
    tombstones: link.tombstones,
    sessions: await exportSharedSessions(listId, link),
  }
}

/**
 * Porta su questo dispositivo il risultato del merge: nome, voci (nuove, cambiate, sparite), eliminazioni da
 * ricordare, persone e spese concluse. Gli articoli si collegano al catalogo per nome; se non esistono si creano,
 * nella categoria con lo stesso nome o in "Altro".
 */
export async function applySharedFile(listId: number, file: SharedListFile): Promise<void> {
  const tables = [db.shoppingLists, db.listItems, db.items, db.categories, db.sessions, db.purchases, db.supermarkets]
  await db.transaction('rw', tables, async () => {
    const { link } = await sharedListOf(listId)
    const categories = await db.categories.toArray()
    const byName = new Map(categories.map((c) => [normalizeName(c.name), c.id as number]))
    const fallback = (categories.find((c) => normalizeName(c.name) === 'altro') ?? categories[0]).id as number

    const rows = await db.listItems.where('listId').equals(listId).toArray()
    const byUid = new Map(rows.filter((r) => r.uid).map((r) => [r.uid as string, r]))
    const inFile = new Set(file.items.map((i) => i.uid))

    for (const fi of file.items) {
      const itemId = await upsertItem(fi.name, byName.get(normalizeName(fi.categoryName)) ?? fallback)
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

    const patch: SharedLink = { ...link, tombstones: file.tombstones, members }
    const renamed = file.nameUpdatedAt > (link.nameUpdatedAt ?? 0)
    if (renamed) patch.nameUpdatedAt = file.nameUpdatedAt
    await db.shoppingLists.update(listId, { ...(renamed ? { name: file.name } : {}), shared: patch })

    // Le spese concluse degli altri (e le mie, su un dispositivo nuovo) entrano nello storico.
    await importSharedSessions(listId, patch, file.sessions)
  })
}

/** Aggiorna alcuni campi del collegamento di una lista (sha dell'ultimo sync, permesso di scrittura…). */
export async function patchSharedLink(listId: number, patch: Partial<SharedLink>): Promise<void> {
  const { link } = await sharedListOf(listId)
  await db.shoppingLists.update(listId, { shared: { ...link, ...patch } })
}
