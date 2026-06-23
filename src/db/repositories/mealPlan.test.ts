import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import { getMealPlan, upsertMealPlan, clearMealPlan, getPlannedWeeks } from './mealPlan'

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
})

describe('upsertMealPlan', () => {
  it('aggiunge un nuovo pasto', async () => {
    await upsertMealPlan(WEEK, 1, 0, 'Pizza')
    const days = await getMealPlan(WEEK)
    expect(days[1].pranzo).toBe('Pizza')
  })

  it('aggiorna un pasto esistente', async () => {
    await upsertMealPlan(WEEK, 1, 0, 'Pizza')
    await upsertMealPlan(WEEK, 1, 0, 'Lasagne')
    const days = await getMealPlan(WEEK)
    expect(days[1].pranzo).toBe('Lasagne')
  })

  it('elimina il pasto se il piatto è stringa vuota', async () => {
    await upsertMealPlan(WEEK, 1, 0, 'Pizza')
    await upsertMealPlan(WEEK, 1, 0, '')
    const days = await getMealPlan(WEEK)
    expect(days[1].pranzo).toBe('')
    expect(days[1].pranzoId).toBeUndefined()
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
