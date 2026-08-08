import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import {
  getDishes,
  getDishById,
  findDishByName,
  upsertDish,
  renameDish,
  deleteDish,
  getDishIngredients,
  setDishIngredients,
  getDishesWithIngredients,
} from './dishes'

async function clearAll() {
  await db.categories.clear()
  await db.items.clear()
  await db.dishes.clear()
  await db.dishIngredients.clear()
}

async function seedItems() {
  await db.categories.bulkAdd([{ id: 1, name: 'Frigo', sortOrder: 0 }])
  await db.items.bulkAdd([
    { id: 1, name: 'Uova', normalizedName: 'uova', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null },
    {
      id: 2,
      name: 'Farina',
      normalizedName: 'farina',
      categoryId: 1,
      lastPriceCents: null,
      suggestedPriceCents: null,
    },
  ])
}

beforeEach(async () => {
  await clearAll()
})

describe('upsertDish', () => {
  it('crea un nuovo piatto', async () => {
    const id = await upsertDish('Pasta al pomodoro')
    const dish = await db.dishes.get(id)
    expect(dish?.name).toBe('Pasta al pomodoro')
    expect(dish?.normalizedName).toBe('pasta al pomodoro')
  })

  it('non duplica un piatto con lo stesso nome normalizzato', async () => {
    const id1 = await upsertDish('Pasta al pomodoro')
    const id2 = await upsertDish('  pasta al pomodoro  ')
    expect(id2).toBe(id1)
    expect(await db.dishes.count()).toBe(1)
  })
})

describe('getDishes / getDishById', () => {
  it('restituisce tutti i piatti', async () => {
    await upsertDish('Pasta')
    await upsertDish('Risotto')
    const dishes = await getDishes()
    expect(dishes).toHaveLength(2)
  })

  it('getDishById restituisce undefined se non esiste', async () => {
    expect(await getDishById(999)).toBeUndefined()
  })
})

describe('findDishByName', () => {
  it('trova un piatto per nome normalizzato', async () => {
    await upsertDish('Pasta al pomodoro')
    const found = await findDishByName('  PASTA al Pomodoro ')
    expect(found?.name).toBe('Pasta al pomodoro')
  })

  it('restituisce undefined se non trovato', async () => {
    expect(await findDishByName('Inesistente')).toBeUndefined()
  })
})

describe('renameDish', () => {
  it('aggiorna name e normalizedName', async () => {
    const id = await upsertDish('Pasta')
    await renameDish(id, '  Pasta al forno  ')
    const dish = await getDishById(id)
    expect(dish?.name).toBe('Pasta al forno')
    expect(dish?.normalizedName).toBe('pasta al forno')
  })
})

describe('setDishIngredients / getDishIngredients', () => {
  it('imposta gli ingredienti di un piatto', async () => {
    await seedItems()
    const dishId = await upsertDish('Pasta')
    await setDishIngredients(dishId, [1, 2])
    const ingredients = await getDishIngredients(dishId)
    expect(ingredients.map((i) => i.name).sort()).toEqual(['Farina', 'Uova'])
  })

  it('sostituisce completamente gli ingredienti precedenti', async () => {
    await seedItems()
    const dishId = await upsertDish('Pasta')
    await setDishIngredients(dishId, [1, 2])
    await setDishIngredients(dishId, [1])
    const ingredients = await getDishIngredients(dishId)
    expect(ingredients).toHaveLength(1)
    expect(ingredients[0].name).toBe('Uova')
  })

  it('restituisce array vuoto per un piatto senza ingredienti', async () => {
    const dishId = await upsertDish('Pasta')
    expect(await getDishIngredients(dishId)).toEqual([])
  })

  it('ignora ingredienti il cui Item è stato eliminato', async () => {
    await seedItems()
    const dishId = await upsertDish('Pasta')
    await setDishIngredients(dishId, [1, 2])
    await db.items.delete(2)
    const ingredients = await getDishIngredients(dishId)
    expect(ingredients.map((i) => i.name)).toEqual(['Uova'])
  })
})

describe('deleteDish', () => {
  it('elimina il piatto e i suoi ingredienti', async () => {
    await seedItems()
    const dishId = await upsertDish('Pasta')
    await setDishIngredients(dishId, [1, 2])
    await deleteDish(dishId)
    expect(await getDishById(dishId)).toBeUndefined()
    expect(await db.dishIngredients.where('dishId').equals(dishId).count()).toBe(0)
  })

  it('non tocca gli ingredienti di altri piatti', async () => {
    await seedItems()
    const dish1 = await upsertDish('Pasta')
    const dish2 = await upsertDish('Risotto')
    await setDishIngredients(dish1, [1])
    await setDishIngredients(dish2, [2])
    await deleteDish(dish1)
    const remaining = await getDishIngredients(dish2)
    expect(remaining.map((i) => i.name)).toEqual(['Farina'])
  })
})

describe('getDishesWithIngredients', () => {
  it('restituisce array vuoto senza piatti', async () => {
    expect(await getDishesWithIngredients()).toEqual([])
  })

  it('unisce ogni piatto ai suoi ingredienti', async () => {
    await seedItems()
    const dish1 = await upsertDish('Pasta')
    const dish2 = await upsertDish('Risotto')
    await setDishIngredients(dish1, [1, 2])
    await setDishIngredients(dish2, [1])

    const dishes = await getDishesWithIngredients()
    const pasta = dishes.find((d) => d.id === dish1)
    const risotto = dishes.find((d) => d.id === dish2)
    expect(pasta?.ingredients.map((i) => i.name).sort()).toEqual(['Farina', 'Uova'])
    expect(risotto?.ingredients.map((i) => i.name)).toEqual(['Uova'])
  })
})
