import { db } from '../db'
import { normalizeName } from '../../lib/normalize'
import type { Dish, Item } from '../types'

export interface DishWithIngredients extends Dish {
  ingredients: Item[]
}

export async function getDishes(): Promise<Dish[]> {
  return db.dishes.toArray()
}

export async function getDishById(id: number): Promise<Dish | undefined> {
  return db.dishes.get(id)
}

/**
 * Trova un piatto per nome normalizzato (dedup).
 */
export async function findDishByName(name: string): Promise<Dish | undefined> {
  return db.dishes.where('normalizedName').equals(normalizeName(name)).first()
}

/**
 * Crea un piatto solo se non esiste già un altro con lo stesso normalizedName.
 * Ritorna l'id del piatto esistente o di quello appena creato.
 */
export async function upsertDish(name: string): Promise<number> {
  const normalized = normalizeName(name)
  const existing = await db.dishes.where('normalizedName').equals(normalized).first()
  if (existing?.id !== undefined) return existing.id

  const id = await db.dishes.add({ name: name.trim(), normalizedName: normalized })
  return id as number
}

export async function renameDish(id: number, name: string): Promise<void> {
  await db.dishes.update(id, { name: name.trim(), normalizedName: normalizeName(name) })
}

export async function deleteDish(id: number): Promise<void> {
  await db.transaction('rw', [db.dishes, db.dishIngredients], async () => {
    await db.dishIngredients.where('dishId').equals(id).delete()
    await db.dishes.delete(id)
  })
}

/** Ingredienti (Item completi) di un piatto. */
export async function getDishIngredients(dishId: number): Promise<Item[]> {
  const links = await db.dishIngredients.where('dishId').equals(dishId).toArray()
  const items = await Promise.all(links.map((l) => db.items.get(l.itemId)))
  return items.filter((i): i is Item => i !== undefined)
}

/**
 * Sostituisce l'intero elenco di ingredienti di un piatto con `itemIds`.
 */
export async function setDishIngredients(dishId: number, itemIds: number[]): Promise<void> {
  await db.transaction('rw', [db.dishIngredients], async () => {
    await db.dishIngredients.where('dishId').equals(dishId).delete()
    await db.dishIngredients.bulkAdd(itemIds.map((itemId) => ({ dishId, itemId })))
  })
}

/** Tutti i piatti con i rispettivi ingredienti (volumi piccoli: riduzione in JS). */
export async function getDishesWithIngredients(): Promise<DishWithIngredients[]> {
  const dishes = await db.dishes.toArray()
  return Promise.all(
    dishes.map(async (dish) => ({
      ...dish,
      ingredients: await getDishIngredients(dish.id as number),
    })),
  )
}
