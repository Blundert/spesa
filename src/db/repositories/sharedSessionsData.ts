import { db } from '../db'
import type { SharedLink } from '../types'
import { normalizeName } from '../../lib/normalize'
import { newUid } from '../../lib/sharedList'
import {
  MAX_CATEGORY,
  MAX_NAME,
  MAX_PURCHASES,
  MAX_QUANTITY,
  cleanText,
  type SharedPurchase,
  type SharedSession,
} from '../../lib/sharedListFile'
import { countsForMe, sessionWeek } from '../../lib/sharedSessions'
import { getWeekStartDay } from '../../lib/weekSettings'
import { upsertItem } from './items'

const MAX_CENTS = 100_000_000

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)))

/**
 * Le mie spese concluse su questa lista, da quando è condivisa, nel formato del file del repo. Dà un identificatore
 * stabile alle spese che non lo hanno ancora (la prima pubblicazione). Nel file va tutto ripulito come per le voci,
 * così il nostro file passa sempre la validazione.
 */
export async function exportSharedSessions(listId: number, link: SharedLink): Promise<SharedSession[]> {
  const since = link.sharedSince ?? 0
  const mine = (await db.sessions.where('listId').equals(listId).toArray()).filter(
    (s) => s.finishedAt !== null && s.finishedAt >= since && s.doneBy === undefined,
  )
  const [categories, supermarkets] = await Promise.all([db.categories.toArray(), db.supermarkets.toArray()])
  const categoryName = new Map(categories.map((c) => [c.id, c.name]))
  const supermarketName = new Map(supermarkets.map((m) => [m.id, m.name]))

  const out: SharedSession[] = []
  for (const s of mine) {
    let uid = s.sharedUid
    if (!uid) {
      uid = newUid()
      await db.sessions.update(s.id as number, { sharedUid: uid })
    }
    const rows = (await db.purchases.where('sessionId').equals(s.id as number).toArray()).slice(0, MAX_PURCHASES)
    const items = await db.items.bulkGet(rows.map((r) => r.itemId))
    const purchases: SharedPurchase[] = []
    rows.forEach((r, i) => {
      const item = items[i]
      if (!item) return
      purchases.push({
        name: cleanText(item.name, MAX_NAME),
        categoryName: cleanText(categoryName.get(item.categoryId) ?? '?', MAX_CATEGORY),
        priceCents: clamp(r.priceCents, 0, MAX_CENTS),
        quantity: clamp(r.quantity, 1, MAX_QUANTITY),
      })
    })
    out.push({
      uid,
      doneBy: link.me,
      supermarketName: cleanText(supermarketName.get(s.supermarketId) ?? '?', MAX_NAME),
      startedAt: s.startedAt,
      finishedAt: s.finishedAt as number,
      confirmedTotalCents: s.confirmedTotalCents === null ? null : clamp(s.confirmedTotalCents, 0, MAX_CENTS),
      buoniSpent: clamp(s.buoniSpent, 0, 1000),
      buoniValueCents: clamp(s.buoniValueCents, 0, 100_000),
      purchases,
    })
  }
  return out
}

/**
 * Porta nello storico di questo dispositivo le spese del repo che non ci sono ancora (per identificatore): negozi e
 * articoli si collegano al catalogo per nome, creandoli se mancano. Quelle di altre persone portano il loro autore e,
 * se per me è un estraneo, il segno che non contano nel budget; quelle mie (nuovo dispositivo) tornano normali.
 * Poi ricalcola prezzi e conteggi degli articoli toccati. Da chiamare nella stessa transazione di `applySharedFile`.
 */
export async function importSharedSessions(listId: number, link: SharedLink, sessions: SharedSession[]): Promise<void> {
  if (sessions.length === 0) return
  const known = new Set(
    (await db.sessions.where('listId').equals(listId).toArray()).map((s) => s.sharedUid).filter((u) => u !== undefined),
  )
  const fresh = sessions.filter((s) => !known.has(s.uid))
  if (fresh.length === 0) return

  const categories = await db.categories.toArray()
  const categoryByName = new Map(categories.map((c) => [normalizeName(c.name), c.id as number]))
  const fallback = (categories.find((c) => normalizeName(c.name) === 'altro') ?? categories[0]).id as number
  const supermarkets = new Map((await db.supermarkets.toArray()).map((m) => [m.normalizedName, m.id as number]))
  const weekStartDay = getWeekStartDay()
  const touched = new Set<number>()

  for (const ss of fresh) {
    const key = normalizeName(ss.supermarketName)
    let supermarketId = supermarkets.get(key)
    if (supermarketId === undefined) {
      supermarketId = (await db.supermarkets.add({ name: ss.supermarketName, normalizedName: key })) as number
      supermarkets.set(key, supermarketId)
    }
    const mine = ss.doneBy === link.me
    const sessionId = (await db.sessions.add({
      isoWeek: sessionWeek(ss.finishedAt, weekStartDay),
      supermarketId,
      listId,
      startedAt: ss.startedAt,
      finishedAt: ss.finishedAt,
      confirmedTotalCents: ss.confirmedTotalCents,
      buoniSpent: ss.buoniSpent,
      buoniValueCents: ss.buoniValueCents,
      sharedUid: ss.uid,
      ...(mine ? {} : { doneBy: ss.doneBy }),
      ...(!mine && !countsForMe(link, ss.doneBy) ? { uncounted: true } : {}),
    })) as number
    for (const p of ss.purchases) {
      const itemId = await upsertItem(p.name, categoryByName.get(normalizeName(p.categoryName)) ?? fallback)
      await db.purchases.add({ sessionId, itemId, priceCents: p.priceCents, quantity: p.quantity })
      touched.add(itemId)
    }
  }

  // Come a fine spesa: ultimo prezzo, media e quantità comprate degli articoli toccati.
  for (const itemId of touched) {
    const all = await db.purchases.where('itemId').equals(itemId).toArray()
    await db.items.update(itemId, {
      lastPriceCents: all[all.length - 1].priceCents,
      suggestedPriceCents: Math.round(all.reduce((a, p) => a + p.priceCents, 0) / all.length),
      purchaseCount: all.reduce((n, p) => n + p.quantity, 0),
    })
  }
}

/** Dopo aver cambiato il tipo di una persona: le sue spese di questa lista contano (partner) o no (estraneo). */
export async function recountSharedSessions(listId: number): Promise<void> {
  const link = (await db.shoppingLists.get(listId))?.shared
  if (!link) return
  const foreign = (await db.sessions.where('listId').equals(listId).toArray()).filter((s) => s.doneBy !== undefined)
  for (const s of foreign) {
    const counts = countsForMe(link, s.doneBy as string)
    if (counts === !s.uncounted) continue
    await db.sessions.update(s.id as number, { uncounted: counts ? undefined : true })
  }
}
