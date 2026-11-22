import { db } from '../db'
import { normalizeName } from '../../lib/normalize'
import type { Item } from '../types'
import { upsertItem } from './items'

/**
 * Collega gli articoli che arrivano da una lista condivisa al catalogo di questo dispositivo, per nome.
 *
 * - L'articolo che c'è già resta com'è, TRANNE la categoria: se qui non ne ha una vera (è in "Altro", la categoria di
 *   ripiego, o la sua categoria non esiste più) prende quella di chi l'ha condiviso.
 * - Un articolo nuovo nasce nella categoria indicata.
 * - Una categoria che qui non esiste viene creata (in fondo all'ordine); "?" (categoria sconosciuta a chi ha scritto
 *   il file) e "Altro" non creano niente.
 */
export async function catalogResolver() {
  const categories = await db.categories.toArray()
  const byName = new Map(categories.map((c) => [normalizeName(c.name), c.id as number]))
  const known = new Set(categories.map((c) => c.id as number))
  const fallback = (categories.find((c) => normalizeName(c.name) === 'altro') ?? categories[0]).id as number
  let nextOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder), -1) + 1

  async function categoryId(name: string): Promise<number> {
    const key = normalizeName(name)
    const existing = byName.get(key)
    if (existing !== undefined) return existing
    if (key === '?') return fallback
    const id = (await db.categories.add({ name: name.trim(), sortOrder: nextOrder++ })) as number
    byName.set(key, id)
    known.add(id)
    return id
  }

  return {
    /** Id dell'articolo (creato se manca) con la categoria di chi l'ha condiviso, se qui non ne ha una vera. */
    async item(name: string, categoryName: string): Promise<number> {
      const wanted = await categoryId(categoryName)
      const itemId = await upsertItem(name, wanted)
      if (wanted !== fallback) {
        const item = (await db.items.get(itemId)) as Item // appena trovato o creato
        if (item.categoryId === fallback || !known.has(item.categoryId)) {
          await db.items.update(itemId, { categoryId: wanted })
        }
      }
      return itemId
    },
  }
}
