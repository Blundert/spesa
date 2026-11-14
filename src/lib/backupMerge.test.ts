import { describe, it, expect } from 'vitest'
import type { BackupData } from '../db/backup'
import { applyMerge, planMerge } from './backupMerge'

const item = (id: number, name: string, categoryId = 1) => ({
  id,
  name,
  normalizedName: name.toLowerCase(),
  categoryId,
  lastPriceCents: null,
  suggestedPriceCents: null,
})

function base(): BackupData {
  return {
    version: 8,
    exportedAt: 1,
    categories: [
      { id: 1, name: 'Frutta', sortOrder: 0 },
      { id: 2, name: 'Frigo', sortOrder: 1 },
    ],
    items: [item(1, 'Mele'), item(2, 'Latte', 2)],
    supermarkets: [
      { id: 1, name: 'Lidl', normalizedName: 'lidl' },
      { id: 2, name: 'Pam', normalizedName: 'pam' },
    ],
    weekBudgets: [{ id: 1, isoWeek: 'W1', buoniAvailable: 3 }],
    shoppingLists: [{ id: 1, name: 'Spesa', supermarketId: 1, sortOrder: 0, archivedAt: null }],
    listItems: [],
    sessions: [
      { id: 1, isoWeek: 'W1', supermarketId: 1, listId: 1, startedAt: 1000, finishedAt: 2000, confirmedTotalCents: 500, buoniSpent: 1, buoniValueCents: 800 },
    ],
    purchases: [{ id: 1, sessionId: 1, itemId: 1, priceCents: 100, quantity: 2 }],
    mealPlans: [{ id: 1, isoWeek: 'W1', dayIndex: 0, mealType: 0, dish: 'Pasta', dishId: 1, selectedItemIds: [2] }],
    dishes: [{ id: 1, name: 'Pasta', normalizedName: 'pasta' }],
    dishIngredients: [{ id: 1, dishId: 1, itemId: 2 }],
  }
}

/** Un backup con una settimana diversa: W2, con articoli, negozio, lista e piatto che nell'altro non ci sono. */
function week2(): BackupData {
  const d = base()
  d.weekBudgets = [{ id: 1, isoWeek: 'W2', buoniAvailable: 5 }]
  d.items = [item(1, 'Mele'), item(2, 'Latte', 2), item(3, 'Pere'), item(4, 'Pasta', 2)]
  d.categories.push({ id: 3, name: 'Dispensa', sortOrder: 2 })
  d.items[2].categoryId = 3
  d.supermarkets.push({ id: 3, name: 'Eurospin', normalizedName: 'eurospin' })
  d.shoppingLists!.push({ id: 2, name: 'Casa', supermarketId: 3, sortOrder: 1, archivedAt: null, usualItemIds: [3, 1], quickItemIds: [4] })
  d.listItems = [{ id: 1, listId: 2, itemId: 3, quantity: 1, addedAt: 9 }]
  d.sessions = [
    { id: 5, isoWeek: 'W2', supermarketId: 3, listId: 2, startedAt: 5000, finishedAt: 6000, confirmedTotalCents: 900, buoniSpent: 0, buoniValueCents: 800 },
  ]
  d.purchases = [
    { id: 7, sessionId: 5, itemId: 3, priceCents: 200, quantity: 1 },
    { id: 8, sessionId: 5, itemId: 1, priceCents: 120, quantity: 1 },
  ]
  d.mealPlans = [{ id: 4, isoWeek: 'W2', dayIndex: 1, mealType: 1, dish: 'Pasta al pesto', dishId: 2, selectedItemIds: [3, 4] }]
  d.dishes = [{ id: 1, name: 'Pasta', normalizedName: 'pasta' }, { id: 2, name: 'Pasta al pesto', normalizedName: 'pasta al pesto' }]
  d.dishIngredients = [{ id: 1, dishId: 1, itemId: 2 }, { id: 3, dishId: 2, itemId: 3 }]
  return d
}

/** Id unici e riferimenti tutti risolti. */
function consistent(d: BackupData) {
  const tables = [d.categories, d.items, d.supermarkets, d.weekBudgets, d.listItems, d.sessions, d.purchases, d.mealPlans, d.dishes ?? [], d.dishIngredients ?? [], d.shoppingLists ?? []]
  for (const rows of tables) expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length)
  const ids = (rows: Array<{ id?: number }>) => new Set(rows.map((r) => r.id))
  const cats = ids(d.categories), items = ids(d.items), sms = ids(d.supermarkets), sess = ids(d.sessions)
  const lists = ids(d.shoppingLists ?? []), dishes = ids(d.dishes ?? [])
  for (const i of d.items) expect(cats.has(i.categoryId)).toBe(true)
  for (const p of d.purchases) expect(items.has(p.itemId) && sess.has(p.sessionId)).toBe(true)
  for (const s of d.sessions) expect(sms.has(s.supermarketId) && (s.listId === undefined || lists.has(s.listId))).toBe(true)
  for (const l of d.shoppingLists ?? []) {
    expect(l.supermarketId === null || sms.has(l.supermarketId)).toBe(true)
    for (const x of [...(l.usualItemIds ?? []), ...(l.quickItemIds ?? [])]) expect(items.has(x)).toBe(true)
  }
  for (const x of d.listItems) expect(lists.has(x.listId) && items.has(x.itemId)).toBe(true)
  for (const x of d.dishIngredients ?? []) expect(dishes.has(x.dishId) && items.has(x.itemId)).toBe(true)
  for (const m of d.mealPlans) {
    expect(m.dishId === undefined || dishes.has(m.dishId)).toBe(true)
    for (const x of m.selectedItemIds ?? []) expect(items.has(x)).toBe(true)
  }
}

const names = (rows: Array<{ name: string }>) => rows.map((r) => r.name).sort()

describe('planMerge', () => {
  it('backup identici: niente da decidere', () => {
    expect(planMerge(base(), base())).toEqual([])
  })

  it('raggruppa per settimana e per elemento del catalogo, con stato e scelte', () => {
    const plan = planMerge(base(), week2())
    const byId = Object.fromEntries(plan.map((g) => [g.id, g]))
    expect(byId['week:W1']).toMatchObject({ status: 'onlyLocal', defaultChoice: 'local', choices: ['local', 'remote'] })
    expect(byId['week:W1'].local).toEqual({ weekBudgets: 1, sessions: 1, purchases: 1, mealPlans: 1 })
    expect(byId['week:W2']).toMatchObject({ status: 'onlyRemote', defaultChoice: 'remote', label: 'W2' })
    expect(byId['week:W2'].remote).toEqual({ weekBudgets: 1, sessions: 1, purchases: 2, mealPlans: 1 })
    expect(byId['item:pere']).toMatchObject({ type: 'item', label: 'Pere', status: 'onlyRemote' })
    expect(byId['supermarket:eurospin'].label).toBe('Eurospin')
    expect(byId['category:Dispensa'].status).toBe('onlyRemote')
    expect(byId['list:Casa']).toMatchObject({ type: 'list', label: 'Casa' })
    expect(byId['dish:pasta al pesto'].remote).toEqual({ dishes: 1, dishIngredients: 1 })
    // ordine: settimane (più recente prima), poi liste, articoli, negozi, categorie, piatti
    expect(plan.map((g) => g.type)).toEqual(['week', 'week', 'list', 'item', 'item', 'supermarket', 'category', 'dish'])
    expect(plan.slice(0, 2).map((g) => g.label)).toEqual(['W2', 'W1'])
  })

  it('stessa settimana con spese diverse: di partenza l’unione', () => {
    const r = base()
    r.sessions = [{ ...r.sessions[0], id: 9, startedAt: 7777 }]
    r.purchases = [{ id: 9, sessionId: 9, itemId: 1, priceCents: 90, quantity: 1 }]
    const g = planMerge(base(), r).find((x) => x.id === 'week:W1')!
    expect(g).toMatchObject({ status: 'different', defaultChoice: 'both', choices: ['both', 'local', 'remote'] })
  })

  it('un gruppo catalogo solo con voci: l’etichetta cade sul nome del gruppo', () => {
    const l = base()
    const r = base()
    r.shoppingLists = []
    r.listItems = [{ id: 1, listId: 99, itemId: 1, quantity: 1, addedAt: 1 }]
    const g = planMerge(l, r).find((x) => x.id.startsWith('list:#99'))
    expect(g?.label).toBe('#99')
  })
})

describe('applyMerge — settimane', () => {
  it('di partenza è l’unione: tiene la settimana locale e porta quella remota, con id nuovi', () => {
    const m = applyMerge(base(), week2())
    consistent(m)
    expect(m.sessions.map((s) => s.startedAt)).toEqual([1000, 5000])
    expect(new Set(m.sessions.map((s) => s.isoWeek))).toEqual(new Set(['W1', 'W2']))
    expect(m.weekBudgets.map((b) => b.isoWeek).sort()).toEqual(['W1', 'W2'])
    expect(m.purchases).toHaveLength(3)
    expect(m.mealPlans).toHaveLength(2)
    expect(names(m.items)).toEqual(['Latte', 'Mele', 'Pasta', 'Pere'])
    expect(names(m.supermarkets)).toEqual(['Eurospin', 'Lidl', 'Pam'])
    expect(names(m.shoppingLists!)).toEqual(['Casa', 'Spesa'])
    expect(names(m.dishes!)).toEqual(['Pasta', 'Pasta al pesto'])
    expect(m.categories.map((c) => c.name)).toEqual(['Frutta', 'Frigo', 'Dispensa'])
    expect(m.listItems).toHaveLength(1)
  })

  it('ricalcola le statistiche degli articoli dagli acquisti (spesa più recente = ultimo prezzo)', () => {
    const m = applyMerge(base(), week2())
    const mele = m.items.find((i) => i.name === 'Mele')!
    // 100¢ ×2 (spesa 1000) e 120¢ ×1 (spesa 5000): ultimo 120, medio 110, quantità 3
    expect(mele).toMatchObject({ lastPriceCents: 120, suggestedPriceCents: 110, purchaseCount: 3 })
    const latte = m.items.find((i) => i.name === 'Latte')!
    expect(latte.lastPriceCents).toBeNull() // senza acquisti non si tocca
  })

  it('scegliendo "locale" per una settimana solo remota, non la porta', () => {
    const m = applyMerge(base(), week2(), { 'week:W2': 'local' })
    consistent(m)
    expect(m.sessions.map((s) => s.startedAt)).toEqual([1000])
    expect(m.weekBudgets).toHaveLength(1)
  })

  it('scegliendo "remoto" per una settimana solo locale, la toglie con acquisti, budget e pasti', () => {
    const m = applyMerge(base(), week2(), { 'week:W1': 'remote' })
    consistent(m)
    expect(m.sessions.map((s) => s.isoWeek)).toEqual(['W2'])
    expect(m.purchases.every((p) => m.sessions.some((s) => s.id === p.sessionId))).toBe(true)
    expect(m.weekBudgets.map((b) => b.isoWeek)).toEqual(['W2'])
    expect(m.mealPlans.map((x) => x.isoWeek)).toEqual(['W2'])
  })

  describe('stessa settimana, contenuti diversi', () => {
    const remote = () => {
      const r = base()
      r.weekBudgets = [{ id: 1, isoWeek: 'W1', buoniAvailable: 9 }]
      r.sessions = [{ ...r.sessions[0], id: 9, startedAt: 7777 }]
      r.purchases = [{ id: 9, sessionId: 9, itemId: 1, priceCents: 90, quantity: 1 }]
      r.mealPlans = [
        { id: 8, isoWeek: 'W1', dayIndex: 0, mealType: 0, dish: 'Altro piatto' }, // stesso posto del locale
        { id: 9, isoWeek: 'W1', dayIndex: 3, mealType: 1, dish: 'Pizza' },
      ]
      return r
    }

    it('unione: spese diverse si sommano, stesso posto nei pasti vince il locale, budget locale', () => {
      const m = applyMerge(base(), remote())
      consistent(m)
      expect(m.sessions.map((s) => s.startedAt)).toEqual([1000, 7777])
      expect(m.purchases).toHaveLength(2)
      expect(m.weekBudgets).toEqual([{ id: 1, isoWeek: 'W1', buoniAvailable: 3 }])
      expect(m.mealPlans.map((x) => x.dish).sort()).toEqual(['Pasta', 'Pizza'])
    })

    it('unione: una spesa già presente (stesso orario) non si duplica', () => {
      const r = base()
      r.purchases[0].priceCents = 5
      const m = applyMerge(base(), r, { 'week:W1': 'both' })
      expect(m.sessions).toHaveLength(1)
      expect(m.purchases[0].priceCents).toBe(100)
    })

    it('"remoto" sostituisce tutta la settimana', () => {
      const m = applyMerge(base(), remote(), { 'week:W1': 'remote' })
      consistent(m)
      expect(m.sessions.map((s) => s.startedAt)).toEqual([7777])
      expect(m.weekBudgets[0].buoniAvailable).toBe(9)
      expect(m.mealPlans.map((x) => x.dish).sort()).toEqual(['Altro piatto', 'Pizza'])
    })

    it('"locale" la lascia com’è', () => {
      const m = applyMerge(base(), remote(), { 'week:W1': 'local' })
      expect(m.sessions.map((s) => s.startedAt)).toEqual([1000])
    })
  })
})

describe('applyMerge — dipendenze e riferimenti', () => {
  it('una settimana portata dal remoto aggiunge gli articoli che le servono anche se il loro gruppo è "locale"', () => {
    const m = applyMerge(base(), week2(), {
      'item:pere': 'local',
      'supermarket:eurospin': 'local',
      'category:Dispensa': 'local',
      'list:Casa': 'local',
      'dish:pasta al pesto': 'local',
    })
    consistent(m)
    expect(names(m.items)).toContain('Pere')
    expect(names(m.supermarkets)).toContain('Eurospin')
    expect(m.categories.map((c) => c.name)).toContain('Dispensa')
    expect(names(m.shoppingLists!)).toContain('Casa')
    expect(names(m.dishes!)).toContain('Pasta al pesto')
  })

  it('i riferimenti ad articoli già presenti usano l’id locale (stesso nome)', () => {
    const m = applyMerge(base(), week2())
    const mele = m.items.find((i) => i.name === 'Mele')!
    expect(m.purchases.filter((p) => p.itemId === mele.id)).toHaveLength(2)
  })

  it('riferimenti opzionali spezzati nel remoto si scartano; quelli obbligatori danno errore', () => {
    const r = week2()
    r.sessions[0].listId = 404
    r.mealPlans[0].dishId = 404
    r.mealPlans[0].selectedItemIds = [3, 404]
    r.shoppingLists![1].supermarketId = 404
    const m = applyMerge(base(), r)
    expect(m.sessions.find((s) => s.startedAt === 5000)?.listId).toBeUndefined()
    expect(m.mealPlans.find((x) => x.isoWeek === 'W2')?.dishId).toBeUndefined()
    expect(m.mealPlans.find((x) => x.isoWeek === 'W2')?.selectedItemIds).toHaveLength(1)
    expect(m.shoppingLists!.find((l) => l.name === 'Casa')?.supermarketId).toBeNull()

    const bad = week2()
    bad.sessions[0].supermarketId = 404
    expect(() => applyMerge(base(), bad)).toThrow('Riferimento non valido')
    const badItem = week2()
    badItem.purchases[0].itemId = 404
    expect(() => applyMerge(base(), badItem)).toThrow('Riferimento non valido')
  })

  it('un articolo remoto con categoria spezzata finisce nella prima categoria', () => {
    const r = base()
    r.items.push(item(9, 'Kiwi', 404))
    const m = applyMerge(base(), r)
    expect(m.items.find((i) => i.name === 'Kiwi')?.categoryId).toBe(1)
  })
})

describe('applyMerge — catalogo', () => {
  it('"locale" su un elemento solo remoto non lo porta; "both" fuori dalle settimane vale "locale"', () => {
    const m = applyMerge(base(), week2(), {
      'week:W2': 'local',
      'item:pere': 'both',
      'category:Dispensa': 'local',
      'list:Casa': 'local',
      'dish:pasta al pesto': 'local',
    })
    expect(names(m.items)).not.toContain('Pere')
  })

  it('articolo diverso (categoria): "remoto" sovrascrive tenendo l’id locale', () => {
    const r = base()
    r.items[0].categoryId = 2
    expect(applyMerge(base(), r).items[0].categoryId).toBe(1) // di partenza: locale
    const m = applyMerge(base(), r, { 'item:mele': 'remote' })
    expect(m.items.find((i) => i.name === 'Mele')).toMatchObject({ id: 1, categoryId: 2 })
    consistent(m)
  })

  it('articolo solo locale: "remoto" lo toglie se non usato (e dalle liste), lo tiene se usato', () => {
    const l = base()
    l.items.push(item(5, 'Kiwi'), item(6, 'Fichi'))
    l.shoppingLists![0].usualItemIds = [5, 1]
    l.shoppingLists![0].quickItemIds = [5]
    l.purchases.push({ id: 5, sessionId: 1, itemId: 6, priceCents: 1, quantity: 1 })
    const m = applyMerge(l, base(), { 'item:kiwi': 'remote', 'item:fichi': 'remote' })
    expect(names(m.items)).not.toContain('Kiwi')
    expect(names(m.items)).toContain('Fichi') // ancora negli acquisti
    expect(m.shoppingLists![0].usualItemIds).toEqual([1])
    expect(m.shoppingLists![0].quickItemIds).toEqual([])
    consistent(m)
  })

  it('articolo solo locale usato da voci di lista, ingredienti o pasti: resta', () => {
    const l = base()
    l.items.push(item(5, 'A'), item(6, 'B'), item(7, 'C'), item(8, 'D'))
    l.listItems = [{ id: 1, listId: 1, itemId: 5, quantity: 1, addedAt: 1 }]
    l.dishIngredients!.push({ id: 2, dishId: 1, itemId: 6 })
    l.mealPlans[0].selectedItemIds = [2, 7]
    const m = applyMerge(l, base(), {
      'item:a': 'remote', 'item:b': 'remote', 'item:c': 'remote', 'item:d': 'remote',
      'list:Spesa': 'local',
    })
    expect(names(m.items)).toEqual(['A', 'B', 'C', 'Latte', 'Mele'])
  })

  it('categoria: solo remota, diversa, solo locale (tolta solo se non usata)', () => {
    const l = base()
    l.categories.push({ id: 3, name: 'Extra', sortOrder: 2 }, { id: 4, name: 'Vuota', sortOrder: 3 })
    l.items.push(item(5, 'X', 3))
    const r = base()
    r.categories[0].sortOrder = 7
    const m = applyMerge(l, r, { 'category:Extra': 'remote', 'category:Vuota': 'remote', 'category:Frutta': 'remote' })
    expect(m.categories.map((c) => c.name).sort()).toEqual(['Extra', 'Frigo', 'Frutta'])
    expect(m.categories.find((c) => c.name === 'Frutta')?.sortOrder).toBe(7)
    const m2 = applyMerge(base(), week2(), { 'category:Dispensa': 'remote', 'week:W2': 'local' })
    expect(m2.categories.map((c) => c.name)).toContain('Dispensa')
  })

  it('negozio: solo remoto, diverso, solo locale (tolto solo se non usato)', () => {
    const l = base()
    l.supermarkets.push({ id: 3, name: 'Coop', normalizedName: 'coop' }, { id: 4, name: 'Conad', normalizedName: 'conad' })
    l.shoppingLists![0].supermarketId = 3
    const r = base()
    r.supermarkets[0] = { ...r.supermarkets[0], name: 'LIDL' }
    const m = applyMerge(l, r, { 'supermarket:coop': 'remote', 'supermarket:conad': 'remote', 'supermarket:lidl': 'remote' })
    expect(names(m.supermarkets)).toEqual(['Coop', 'LIDL', 'Pam'])
    const m2 = applyMerge(base(), week2(), { 'supermarket:eurospin': 'remote', 'week:W2': 'local' })
    expect(names(m2.supermarkets)).toContain('Eurospin')
    const used = base()
    used.supermarkets.push({ id: 3, name: 'Coop', normalizedName: 'coop' })
    used.sessions[0].supermarketId = 3
    expect(names(applyMerge(used, base(), { 'supermarket:coop': 'remote', 'week:W1': 'local' }).supermarkets)).toContain('Coop')
  })

  it('lista: solo remota (con voci e preferiti), diversa (sostituita), solo locale (tolta se non usata)', () => {
    const m = applyMerge(base(), week2(), { 'week:W2': 'local' })
    expect(names(m.shoppingLists!)).toEqual(['Casa', 'Spesa'])
    consistent(m)
    const casa = m.shoppingLists!.find((l) => l.name === 'Casa')!
    expect(casa.supermarketId).toBe(m.supermarkets.find((s) => s.name === 'Eurospin')!.id)
    expect(casa.usualItemIds).toHaveLength(2)
    expect(casa.quickItemIds).toHaveLength(1)
    expect(m.listItems).toHaveLength(1)

    const l = base()
    l.shoppingLists!.push({ id: 2, name: 'Casa', supermarketId: null, sortOrder: 5, archivedAt: null })
    l.listItems = [{ id: 1, listId: 2, itemId: 1, quantity: 1, addedAt: 1 }]
    const r = week2()
    r.shoppingLists![1] = { id: 2, name: 'Casa', supermarketId: null, sortOrder: 1, archivedAt: 5 }
    r.listItems = []
    const m2 = applyMerge(l, r, { 'list:Casa': 'remote', 'week:W2': 'local' })
    const casa2 = m2.shoppingLists!.find((x) => x.name === 'Casa')!
    expect(casa2).toMatchObject({ id: 2, sortOrder: 1, archivedAt: 5 })
    expect(m2.listItems).toEqual([])

    const solo = base()
    solo.shoppingLists!.push({ id: 2, name: 'Vecchia', supermarketId: null, sortOrder: 3, archivedAt: null })
    solo.listItems = [{ id: 1, listId: 2, itemId: 1, quantity: 1, addedAt: 1 }]
    const m3 = applyMerge(solo, base(), { 'list:Vecchia': 'remote' })
    expect(names(m3.shoppingLists!)).toEqual(['Spesa'])
    expect(m3.listItems).toEqual([])
    solo.sessions.push({ ...solo.sessions[0], id: 2, listId: 2, startedAt: 3 })
    expect(names(applyMerge(solo, base(), { 'list:Vecchia': 'remote', 'week:W1': 'local' }).shoppingLists!)).toContain('Vecchia')
  })

  it('piatto: solo remoto (con ingredienti), diverso (sostituito), solo locale (tolto se non usato)', () => {
    const m = applyMerge(base(), week2(), { 'week:W2': 'local' })
    expect(names(m.dishes!)).toEqual(['Pasta', 'Pasta al pesto'])
    expect(m.dishIngredients).toHaveLength(2)
    consistent(m)

    const l = base()
    l.dishes![0] = { id: 1, name: 'PASTA', normalizedName: 'pasta' }
    l.items.push(item(5, 'Sale'))
    l.dishIngredients!.push({ id: 2, dishId: 1, itemId: 5 })
    const m2 = applyMerge(l, base(), { 'dish:pasta': 'remote' })
    expect(m2.dishes![0].name).toBe('Pasta')
    expect(m2.dishIngredients).toHaveLength(1)

    const solo = base()
    solo.dishes!.push({ id: 2, name: 'Solo', normalizedName: 'solo' })
    solo.dishIngredients!.push({ id: 2, dishId: 2, itemId: 1 })
    const m3 = applyMerge(solo, base(), { 'dish:solo': 'remote' })
    expect(names(m3.dishes!)).toEqual(['Pasta'])
    expect(m3.dishIngredients).toHaveLength(1)
    solo.mealPlans.push({ id: 2, isoWeek: 'W1', dayIndex: 1, mealType: 0, dish: 'Solo', dishId: 2 })
    expect(names(applyMerge(solo, base(), { 'dish:solo': 'remote', 'week:W1': 'local' }).dishes!)).toContain('Solo')
  })
})

describe('applyMerge — statistiche', () => {
  it('stesso articolo due volte nella stessa spesa e acquisti di spese sconosciute non rompono il calcolo', () => {
    const l = base()
    l.purchases.push({ id: 2, sessionId: 1, itemId: 1, priceCents: 300, quantity: 1 })
    l.purchases.push({ id: 3, sessionId: 404, itemId: 1, priceCents: 50, quantity: 1 })
    l.purchases.push({ id: 4, sessionId: 404, itemId: 1, priceCents: 60, quantity: 1 })
    l.purchases.unshift({ id: 5, sessionId: 404, itemId: 1, priceCents: 70, quantity: 1 })
    const r = week2()
    r.sessions[0].listId = undefined
    const m = applyMerge(l, r)
    const mele = m.items.find((i) => i.name === 'Mele')!
    expect(mele.purchaseCount).toBe(2 + 1 + 1 + 1 + 1 + 1)
    expect(m.sessions.find((s) => s.startedAt === 5000)?.listId).toBeUndefined()
  })
})

describe('applyMerge — forma del risultato', () => {
  it('tiene versione, impostazioni locali (o remote) e funziona con backup vecchi senza liste né piatti', () => {
    const l = base()
    l.settings = { weekStartDay: 5 }
    expect(applyMerge(l, week2()).settings).toEqual({ weekStartDay: 5 })
    const r = week2()
    r.settings = { weekStartDay: 2 }
    expect(applyMerge(base(), r).settings).toEqual({ weekStartDay: 2 })
    expect(applyMerge(base(), week2()).settings).toBeUndefined()

    const old = base()
    delete old.shoppingLists
    delete old.dishes
    delete old.dishIngredients
    old.sessions[0].listId = undefined
    old.mealPlans[0].dishId = undefined
    old.mealPlans[0].selectedItemIds = undefined
    const m = applyMerge(old, week2())
    consistent(m)
    expect(m.version).toBe(8)
    expect(applyMerge(base(), base()).sessions).toHaveLength(1)
  })
})
