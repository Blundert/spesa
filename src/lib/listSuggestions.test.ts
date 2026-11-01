import { describe, it, expect } from 'vitest'
import { pickUsualItemIds, pickQuickChips, toggleId, AUTO_USUAL_LIMIT } from './listSuggestions'

const ids = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

describe('pickUsualItemIds', () => {
  const known = new Set(ids(30))

  it('automatico: i più comprati, al massimo AUTO_USUAL_LIMIT', () => {
    const usual = ids(20).map((itemId) => ({ itemId }))
    const out = pickUsualItemIds({ custom: undefined, usual, inListIds: new Set(), knownIds: known })
    expect(out).toEqual(ids(AUTO_USUAL_LIMIT))
  })

  it('automatico: salta quelli già in lista e quelli non più in catalogo', () => {
    const usual = [{ itemId: 1 }, { itemId: 2 }, { itemId: 99 }, { itemId: 3 }]
    const out = pickUsualItemIds({ custom: undefined, usual, inListIds: new Set([2]), knownIds: known })
    expect(out).toEqual([1, 3])
  })

  it('personalizzato: usa la scelta nell\'ordine scelto, senza il limite automatico', () => {
    const custom = ids(12).reverse()
    const out = pickUsualItemIds({ custom, usual: [{ itemId: 1 }], inListIds: new Set(), knownIds: known })
    expect(out).toEqual(custom)
  })

  it('personalizzato: salta già in lista e non più in catalogo', () => {
    const out = pickUsualItemIds({
      custom: [5, 6, 99, 7],
      usual: [],
      inListIds: new Set([6]),
      knownIds: known,
    })
    expect(out).toEqual([5, 7])
  })

  it('personalizzato vuoto: non propone niente (non ricade sull\'automatico)', () => {
    const out = pickUsualItemIds({ custom: [], usual: [{ itemId: 1 }], inListIds: new Set(), knownIds: known })
    expect(out).toEqual([])
  })
})

describe('pickQuickChips', () => {
  const pool = [
    { name: 'Pane', purchaseCount: 2 },
    { name: 'Latte', purchaseCount: 9 },
    { name: 'Uova', purchaseCount: 5 },
    { name: 'Mele', purchaseCount: 0 },
  ]
  const none = () => false

  it('automatico: i più comprati prima, fino al limite, senza toccare il pool', () => {
    const out = pickQuickChips({ pool, custom: undefined, isInList: none, autoLimit: 2 })
    expect(out.map((p) => p.name)).toEqual(['Latte', 'Uova'])
    expect(pool.map((p) => p.name)).toEqual(['Pane', 'Latte', 'Uova', 'Mele'])
  })

  it('automatico: salta quelli già in lista', () => {
    const out = pickQuickChips({ pool, custom: undefined, isInList: (n) => n === 'Latte', autoLimit: 3 })
    expect(out.map((p) => p.name)).toEqual(['Uova', 'Pane', 'Mele'])
  })

  it('personalizzato: la scelta nell\'ordine scelto, senza limite, salta quelli in lista', () => {
    const custom = [pool[3], pool[0], pool[1]]
    const out = pickQuickChips({ pool, custom, isInList: (n) => n === 'Pane', autoLimit: 1 })
    expect(out.map((p) => p.name)).toEqual(['Mele', 'Latte'])
  })

  it('personalizzato vuoto: nessun chip', () => {
    expect(pickQuickChips({ pool, custom: [], isInList: none, autoLimit: 6 })).toEqual([])
  })
})

describe('toggleId', () => {
  it('aggiunge in fondo se manca', () => {
    expect(toggleId([1, 2], 3)).toEqual([1, 2, 3])
  })

  it('toglie se presente, conservando l\'ordine degli altri', () => {
    expect(toggleId([1, 2, 3], 2)).toEqual([1, 3])
  })
})
