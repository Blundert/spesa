import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import {
  getMealPlan,
  setMealSlotDish,
  clearMealPlan,
  getPlannedWeeks,
  getSelectedItemIdsForWeek,
} from './mealPlan'

const WEEK = '2026-06-23'

beforeEach(async () => {
  await db.mealPlans.clear()
})

describe('getMealPlan', () => {
  it('restituisce 7 giorni vuoti senza dati', async () => {
    const days = await getMealPlan(WEEK)
    expect(days).toHaveLength(7)
    expect(days.every((d) => d.pranzo === '' && d.cena === '')).toBe(true)
  })

  it('dayIndex 0 corrisponde a lunedì (startDay default = 0)', async () => {
    const days = await getMealPlan(WEEK)
    expect(days[0].dayIndex).toBe(0)
    expect(days[6].dayIndex).toBe(6)
  })

  it('riordina i giorni quando startDay = 2 (mercoledì)', async () => {
    const days = await getMealPlan(WEEK, 2)
    expect(days[0].dayIndex).toBe(2) // mercoledì
    expect(days[1].dayIndex).toBe(3)
    expect(days[4].dayIndex).toBe(6) // domenica
    expect(days[5].dayIndex).toBe(0) // lunedì
    expect(days[6].dayIndex).toBe(1) // martedì
  })

  it('riordina i giorni quando startDay = 6 (domenica)', async () => {
    const days = await getMealPlan(WEEK, 6)
    expect(days[0].dayIndex).toBe(6) // domenica
    expect(days[1].dayIndex).toBe(0) // lunedì
    expect(days[6].dayIndex).toBe(5) // sabato
  })

  it('restituisce pranzo e cena per i giorni con dati', async () => {
    await db.mealPlans.bulkAdd([
      { isoWeek: WEEK, dayIndex: 0, mealType: 0, dish: 'Pasta' },
      { isoWeek: WEEK, dayIndex: 0, mealType: 1, dish: 'Insalata' },
      { isoWeek: WEEK, dayIndex: 3, mealType: 0, dish: 'Risotto' },
    ])
    const days = await getMealPlan(WEEK)
    expect(days[0].pranzo).toBe('Pasta')
    expect(days[0].cena).toBe('Insalata')
    expect(days[3].pranzo).toBe('Risotto')
    expect(days[3].cena).toBe('')
  })

  it('con startDay=2 i pasti del lunedì (dayIndex=0) sono in posizione 5', async () => {
    await db.mealPlans.add({ isoWeek: WEEK, dayIndex: 0, mealType: 0, dish: 'Pasta' })
    const days = await getMealPlan(WEEK, 2)
    expect(days[5].dayIndex).toBe(0)
    expect(days[5].pranzo).toBe('Pasta')
  })

  it('pranzoDishId/cenaDishId assenti e selectedItemIds vuoto per pianificazioni in formato legacy', async () => {
    await db.mealPlans.add({ isoWeek: WEEK, dayIndex: 0, mealType: 0, dish: 'Pasta' })
    const days = await getMealPlan(WEEK)
    expect(days[0].pranzoDishId).toBeUndefined()
    expect(days[0].pranzoSelectedItemIds).toEqual([])
  })

  it('espone dishId e selectedItemIds per pianificazioni collegate a un piatto', async () => {
    await db.mealPlans.add({
      isoWeek: WEEK,
      dayIndex: 0,
      mealType: 1,
      dish: 'Pasta al pomodoro',
      dishId: 7,
      selectedItemIds: [1, 2],
    })
    const days = await getMealPlan(WEEK)
    expect(days[0].cenaDishId).toBe(7)
    expect(days[0].cenaSelectedItemIds).toEqual([1, 2])
  })
})

describe('setMealSlotDish', () => {
  it('assegna un piatto a uno slot vuoto', async () => {
    await setMealSlotDish(WEEK, 1, 0, { dishId: 5, name: 'Pizza', selectedItemIds: [1, 2] })
    const days = await getMealPlan(WEEK)
    expect(days[1].pranzo).toBe('Pizza')
    expect(days[1].pranzoDishId).toBe(5)
    expect(days[1].pranzoSelectedItemIds).toEqual([1, 2])
  })

  it('aggiorna uno slot già assegnato', async () => {
    await setMealSlotDish(WEEK, 1, 0, { dishId: 5, name: 'Pizza', selectedItemIds: [1] })
    await setMealSlotDish(WEEK, 1, 0, { dishId: 9, name: 'Lasagne', selectedItemIds: [3, 4] })
    const days = await getMealPlan(WEEK)
    expect(days[1].pranzo).toBe('Lasagne')
    expect(days[1].pranzoDishId).toBe(9)
    expect(days[1].pranzoSelectedItemIds).toEqual([3, 4])
  })

  it('con value null rimuove lo slot', async () => {
    await setMealSlotDish(WEEK, 1, 0, { dishId: 5, name: 'Pizza', selectedItemIds: [1] })
    await setMealSlotDish(WEEK, 1, 0, null)
    const days = await getMealPlan(WEEK)
    expect(days[1].pranzo).toBe('')
    expect(days[1].pranzoId).toBeUndefined()
  })

  it('con value null su uno slot già vuoto non fa nulla', async () => {
    await expect(setMealSlotDish(WEEK, 1, 0, null)).resolves.toBeUndefined()
    const days = await getMealPlan(WEEK)
    expect(days[1].pranzo).toBe('')
  })
})

describe('clearMealPlan', () => {
  it('elimina tutti i pasti della settimana', async () => {
    await db.mealPlans.bulkAdd([
      { isoWeek: WEEK, dayIndex: 0, mealType: 0, dish: 'Pasta' },
      { isoWeek: WEEK, dayIndex: 1, mealType: 1, dish: 'Zuppa' },
    ])
    await clearMealPlan(WEEK)
    const days = await getMealPlan(WEEK)
    expect(days.every((d) => d.pranzo === '' && d.cena === '')).toBe(true)
  })

  it('non cancella pasti di altre settimane', async () => {
    const OTHER = '2026-06-16'
    await db.mealPlans.add({ isoWeek: OTHER, dayIndex: 0, mealType: 0, dish: 'Pasta' })
    await clearMealPlan(WEEK)
    const other = await getMealPlan(OTHER)
    expect(other[0].pranzo).toBe('Pasta')
  })
})

describe('getSelectedItemIdsForWeek', () => {
  it('restituisce array vuoto senza pasti pianificati', async () => {
    expect(await getSelectedItemIdsForWeek(WEEK)).toEqual([])
  })

  it('restituisce array vuoto per pasti in formato legacy (senza selectedItemIds)', async () => {
    await db.mealPlans.add({ isoWeek: WEEK, dayIndex: 0, mealType: 0, dish: 'Pasta' })
    expect(await getSelectedItemIdsForWeek(WEEK)).toEqual([])
  })

  it('unisce gli itemId selezionati di tutti i pasti della settimana, con ripetizioni', async () => {
    await db.mealPlans.bulkAdd([
      { isoWeek: WEEK, dayIndex: 0, mealType: 0, dish: 'Pasta', dishId: 1, selectedItemIds: [10, 11] },
      { isoWeek: WEEK, dayIndex: 0, mealType: 1, dish: 'Risotto', dishId: 2, selectedItemIds: [10] },
      { isoWeek: WEEK, dayIndex: 3, mealType: 0, dish: 'Pizza', dishId: 3, selectedItemIds: [] },
    ])
    expect(await getSelectedItemIdsForWeek(WEEK)).toEqual([10, 11, 10])
  })

  it('non include gli itemId di altre settimane', async () => {
    const OTHER = '2026-06-16'
    await db.mealPlans.add({ isoWeek: OTHER, dayIndex: 0, mealType: 0, dish: 'Pasta', dishId: 1, selectedItemIds: [10] })
    expect(await getSelectedItemIdsForWeek(WEEK)).toEqual([])
  })
})

describe('getPlannedWeeks', () => {
  it('restituisce array vuoto senza dati', async () => {
    expect(await getPlannedWeeks()).toEqual([])
  })

  it('restituisce settimane con conteggio pasti, ordinate dalla più recente', async () => {
    await db.mealPlans.bulkAdd([
      { isoWeek: '2026-06-16', dayIndex: 0, mealType: 0, dish: 'A' },
      { isoWeek: '2026-06-23', dayIndex: 1, mealType: 0, dish: 'B' },
      { isoWeek: '2026-06-23', dayIndex: 2, mealType: 1, dish: 'C' },
    ])
    const weeks = await getPlannedWeeks()
    expect(weeks[0].isoWeek).toBe('2026-06-23')
    expect(weeks[0].mealCount).toBe(2)
    expect(weeks[1].isoWeek).toBe('2026-06-16')
    expect(weeks[1].mealCount).toBe(1)
  })
})
