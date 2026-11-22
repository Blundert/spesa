import { describe, expect, it } from 'vitest'
import {
  MAX_FILE_CHARS,
  MAX_SHOPPING,
  SHOPPING_ENDED_TTL_MS,
  MAX_QUANTITY,
  SHARED_FORMAT,
  SHARED_VERSION,
  SharedFileError,
  TOMBSTONE_TTL_MS,
  mergeSharedFiles,
  parseSharedFile,
  sameSharedContent,
  serializeSharedFile,
  type SharedItem,
  type SharedListFile,
  type SharedSession,
  type SharedShopping,
} from './sharedListFile'

const NOW = 1_800_000_000_000

const item = (uid: string, name: string, over: Partial<SharedItem> = {}): SharedItem => ({
  uid,
  name,
  categoryName: 'Frigo',
  quantity: 1,
  addedAt: 1000,
  addedBy: 'matteo',
  updatedAt: 1000,
  takenBy: null,
  ...over,
})

const session = (uid: string, over: Partial<SharedSession> = {}): SharedSession => ({
  uid,
  doneBy: 'anna',
  supermarketName: 'Coop',
  startedAt: 1000,
  finishedAt: 2000,
  confirmedTotalCents: 1500,
  buoniSpent: 1,
  buoniValueCents: 800,
  purchases: [{ name: 'Latte', categoryName: 'Frigo', priceCents: 120, quantity: 2 }],
  ...over,
})

const shopping = (by: string, over: Partial<SharedShopping> = {}): SharedShopping => ({
  by,
  supermarketName: 'Esselunga',
  buoniSpent: 2,
  buoniValueCents: 800,
  startedAt: NOW - 1000,
  endedAt: null,
  ...over,
})

const file = (over: Partial<SharedListFile> = {}): SharedListFile => ({
  format: SHARED_FORMAT,
  version: SHARED_VERSION,
  uid: 'lista-1',
  name: 'Casa',
  nameUpdatedAt: 0,
  items: [],
  tombstones: {},
  sessions: [],
  ...over,
})

const json = (f: unknown) => JSON.stringify(f)
const invalid = (src: string) => {
  try {
    parseSharedFile(src)
  } catch (e) {
    expect(e).toBeInstanceOf(SharedFileError)
    return (e as SharedFileError).code
  }
  throw new Error('doveva lanciare')
}

describe('parseSharedFile', () => {
  it('rilegge ciò che serializeSharedFile scrive, in forma canonica', () => {
    const f = file({
      items: [item('b', 'Pane', { addedAt: 2000 }), item('a', 'Latte', { takenBy: 'anna' })],
      tombstones: { z: 5, y: 4 },
      sessions: [session('s2', { finishedAt: 3000 }), session('s1', { confirmedTotalCents: null })],
    })
    const text = serializeSharedFile(f)
    expect(text.endsWith('\n')).toBe(true)
    const back = parseSharedFile(text)
    expect(back.items.map((i) => i.uid)).toEqual(['a', 'b'])
    expect(back.sessions.map((s) => s.uid)).toEqual(['s1', 's2'])
    expect(Object.keys(back.tombstones)).toEqual(['y', 'z'])
    expect(back.items[0].takenBy).toBe('anna')
    expect(serializeSharedFile(back)).toBe(text)
  })

  it('ripulisce gli spazi nei testi e ignora i campi che non conosce', () => {
    const f = { ...file({ items: [item('a', '  Latte  ')] }), extra: 'x' }
    const back = parseSharedFile(json(f))
    expect(back.items[0].name).toBe('Latte')
    expect('extra' in back).toBe(false)
  })

  it('rifiuta file troppo grandi, rotti o non nostri', () => {
    expect(invalid('x'.repeat(MAX_FILE_CHARS + 1))).toBe('invalid')
    expect(invalid('{non json')).toBe('invalid')
    expect(invalid('[]')).toBe('invalid')
    expect(invalid('null')).toBe('invalid')
    expect(invalid(json({ ...file(), format: 'altro' }))).toBe('invalid')
    expect(invalid(json({ ...file(), version: 'uno' }))).toBe('invalid')
  })

  it('un file più nuovo dà un codice a parte', () => {
    expect(invalid(json({ ...file(), version: SHARED_VERSION + 1 }))).toBe('newer')
  })

  it('rifiuta campi sbagliati', () => {
    const bad = (over: Record<string, unknown>) => invalid(json({ ...file(), ...over }))
    expect(bad({ uid: 'con spazi' })).toBe('invalid')
    expect(bad({ uid: '../x' })).toBe('invalid')
    expect(bad({ uid: 5 })).toBe('invalid')
    expect(bad({ name: '' })).toBe('invalid')
    expect(bad({ name: 'a'.repeat(121) })).toBe('invalid')
    expect(bad({ name: 7 })).toBe('invalid')
    expect(bad({ name: 'rotto\u0000' })).toBe('invalid')
    expect(bad({ nameUpdatedAt: -1 })).toBe('invalid')
    expect(bad({ nameUpdatedAt: 1.5 })).toBe('invalid')
    expect(bad({ items: 'no' })).toBe('invalid')
    expect(bad({ items: Array.from({ length: 2001 }, (_, i) => item(`u${i}`, `n${i}`)) })).toBe('invalid')
    expect(bad({ tombstones: [] })).toBe('invalid')
    expect(bad({ tombstones: { 'x y': 1 } })).toBe('invalid')
    expect(bad({ tombstones: { a: 'ieri' } })).toBe('invalid')
    expect(bad({ sessions: {} })).toBe('invalid')
  })

  it('rifiuta voci sbagliate', () => {
    const bad = (over: Partial<Record<keyof SharedItem, unknown>>) =>
      invalid(json({ ...file(), items: [{ ...item('a', 'Latte'), ...over }] }))
    expect(bad({ uid: '__proto__' })).toBe('invalid')
    expect(bad({ quantity: 0 })).toBe('invalid')
    expect(bad({ quantity: MAX_QUANTITY + 1 })).toBe('invalid')
    expect(bad({ addedBy: 'no spazi' })).toBe('invalid')
    expect(bad({ addedBy: '-iniziale' })).toBe('invalid')
    expect(bad({ takenBy: 'no spazi' })).toBe('invalid')
    expect(bad({ takenBy: 3 })).toBe('invalid')
    expect(bad({ categoryName: '' })).toBe('invalid')
    expect(invalid(json({ ...file(), items: [null] }))).toBe('invalid')
  })

  it('rifiuta spese sbagliate', () => {
    const bad = (over: Partial<Record<keyof SharedSession, unknown>>) =>
      invalid(json({ ...file(), sessions: [{ ...session('s1'), ...over }] }))
    expect(bad({ doneBy: '' })).toBe('invalid')
    expect(bad({ confirmedTotalCents: -1 })).toBe('invalid')
    expect(bad({ buoniSpent: 1001 })).toBe('invalid')
    expect(bad({ buoniValueCents: 1.5 })).toBe('invalid')
    expect(bad({ purchases: 'no' })).toBe('invalid')
    expect(bad({ purchases: Array.from({ length: 501 }, () => ({ name: 'a', categoryName: 'b', priceCents: 1, quantity: 1 })) })).toBe('invalid')
    expect(bad({ purchases: [{ name: 'a', categoryName: 'b', priceCents: -1, quantity: 1 }] })).toBe('invalid')
  })

  it('rifiuta uid ripetuti', () => {
    expect(invalid(json(file({ items: [item('a', 'Latte'), item('a', 'Pane')] })))).toBe('invalid')
    expect(invalid(json(file({ sessions: [session('s'), session('s')] })))).toBe('invalid')
  })

  it('accetta un file vuoto e tombstone molto numerosi ma entro il limite', () => {
    expect(parseSharedFile(json(file())).items).toEqual([])
    const many: Record<string, number> = {}
    for (let i = 0; i < 10_001; i++) many[`t${i}`] = 1
    expect(invalid(json({ ...file(), tombstones: many }))).toBe('invalid')
  })
})

describe('ordine canonico', () => {
  it('a parità di data ordina per uid, così il testo è sempre lo stesso', () => {
    const f = file({
      items: [item('c', 'Pane'), item('a', 'Latte'), item('b', 'Uova')],
      sessions: [session('s3'), session('s1'), session('s2')],
    })
    const back = parseSharedFile(serializeSharedFile(f))
    expect(back.items.map((i) => i.uid)).toEqual(['a', 'b', 'c'])
    expect(back.sessions.map((x) => x.uid)).toEqual(['s1', 's2', 's3'])
  })
})

describe('supermercato e spese in corso nel file', () => {
  it('un file senza i campi nuovi (scritto prima) li ha vuoti', () => {
    const old = { ...file() } as Record<string, unknown>
    delete old.supermarketName
    delete old.supermarketUpdatedAt
    delete old.shopping
    const back = parseSharedFile(json(old))
    expect(back).toMatchObject({ supermarketName: null, supermarketUpdatedAt: 0, shopping: [] })
  })

  it('rilegge supermercato e spese in corso, in forma canonica', () => {
    const f = file({
      supermarketName: 'Coop',
      supermarketUpdatedAt: 7,
      shopping: [shopping('matteo'), shopping('anna', { endedAt: NOW })],
    })
    const back = parseSharedFile(serializeSharedFile(f))
    expect(back.supermarketName).toBe('Coop')
    expect(back.supermarketUpdatedAt).toBe(7)
    expect(back.shopping?.map((x) => x.by)).toEqual(['anna', 'matteo'])
    expect(back.shopping?.[0].endedAt).toBe(NOW)
    expect(serializeSharedFile(back)).toBe(serializeSharedFile(f))
  })

  it('rifiuta valori sbagliati', () => {
    const bad = (over: Record<string, unknown>) => invalid(json({ ...file(), ...over }))
    expect(bad({ supermarketName: '' })).toBe('invalid')
    expect(bad({ supermarketName: 'x'.repeat(121) })).toBe('invalid')
    expect(bad({ supermarketUpdatedAt: -1 })).toBe('invalid')
    expect(bad({ shopping: 'no' })).toBe('invalid')
    expect(bad({ shopping: Array.from({ length: MAX_SHOPPING + 1 }, (_, i) => shopping(`u${i}`)) })).toBe('invalid')
    expect(bad({ shopping: [shopping('anna'), shopping('anna')] })).toBe('invalid')
    expect(bad({ shopping: [{ ...shopping('anna'), by: 'no spazi' }] })).toBe('invalid')
    expect(bad({ shopping: [{ ...shopping('anna'), buoniSpent: 1001 }] })).toBe('invalid')
    expect(bad({ shopping: [{ ...shopping('anna'), buoniValueCents: 1.5 }] })).toBe('invalid')
    expect(bad({ shopping: [{ ...shopping('anna'), supermarketName: '' }] })).toBe('invalid')
    expect(bad({ shopping: [{ ...shopping('anna'), endedAt: 'ieri' }] })).toBe('invalid')
  })

  it('merge: il supermercato più recente vince, a parità sempre lo stesso', () => {
    const a = file({ supermarketName: 'Coop', supermarketUpdatedAt: 5 })
    const b = file({ supermarketName: 'Esselunga', supermarketUpdatedAt: 9 })
    expect(mergeSharedFiles(a, b, NOW)).toMatchObject({ supermarketName: 'Esselunga', supermarketUpdatedAt: 9 })
    expect(mergeSharedFiles(b, a, NOW).supermarketName).toBe('Esselunga')
    const x = file({ supermarketName: 'Alfa', supermarketUpdatedAt: 3 })
    const y = file({ supermarketName: null, supermarketUpdatedAt: 3 })
    expect(mergeSharedFiles(x, y, NOW)).toEqual(mergeSharedFiles(y, x, NOW))
    // file vecchi (senza i campi): nessun problema
    expect(mergeSharedFiles(file(), file(), NOW)).toMatchObject({ supermarketName: null, supermarketUpdatedAt: 0, shopping: [] })
  })

  it('merge: una spesa in corso per persona, la più recente (iniziata o finita), in qualunque ordine', () => {
    const started = shopping('anna', { startedAt: NOW - 5000 })
    const ended = shopping('anna', { startedAt: NOW - 5000, endedAt: NOW - 1000 })
    const newer = shopping('anna', { startedAt: NOW - 500 }) // ne ha iniziata un'altra dopo
    const m = (x: SharedShopping, y: SharedShopping) =>
      mergeSharedFiles(file({ shopping: [x] }), file({ shopping: [y, shopping('luca')] }), NOW).shopping
    expect(m(started, ended)?.find((s) => s.by === 'anna')?.endedAt).toBe(NOW - 1000)
    expect(m(ended, started)?.find((s) => s.by === 'anna')?.endedAt).toBe(NOW - 1000)
    expect(m(ended, newer)?.find((s) => s.by === 'anna')?.endedAt).toBeNull()
    expect(m(started, ended)).toHaveLength(2)
    // a parità di data sceglie sempre lo stesso
    const t1 = shopping('anna', { buoniSpent: 1 })
    const t2 = shopping('anna', { buoniSpent: 3 })
    expect(m(t1, t2)).toEqual(m(t2, t1))
  })

  it('merge: le spese finite da più di un giorno si dimenticano, quelle in corso restano', () => {
    const old = shopping('anna', { endedAt: NOW - SHOPPING_ENDED_TTL_MS - 1 })
    const recent = shopping('luca', { endedAt: NOW - SHOPPING_ENDED_TTL_MS })
    const active = shopping('sara')
    const m = mergeSharedFiles(file({ shopping: [old, recent] }), file({ shopping: [active] }), NOW)
    expect(m.shopping?.map((x) => x.by)).toEqual(['luca', 'sara'])
  })
})

describe('sameSharedContent', () => {
  it('ignora l\'ordine in cui sono scritte le voci', () => {
    const a = file({ items: [item('a', 'Latte'), item('b', 'Pane', { addedAt: 5 })] })
    const b = file({ items: [item('b', 'Pane', { addedAt: 5 }), item('a', 'Latte')] })
    expect(sameSharedContent(a, b)).toBe(true)
    expect(sameSharedContent(a, file())).toBe(false)
  })
})

describe('mergeSharedFiles', () => {
  it('unisce voci aggiunte da persone diverse', () => {
    const m = mergeSharedFiles(file({ items: [item('a', 'Latte')] }), file({ items: [item('b', 'Pane', { addedAt: 2 })] }), NOW)
    expect(m.items.map((i) => i.name)).toEqual(['Pane', 'Latte']) // in ordine di aggiunta
  })

  it('su una voce cambiata da entrambi vince la modifica più recente', () => {
    const a = file({ items: [item('a', 'Latte', { quantity: 2, updatedAt: 10 })] })
    const b = file({ items: [item('a', 'Latte', { quantity: 5, updatedAt: 20 })] })
    expect(mergeSharedFiles(a, b, NOW).items[0].quantity).toBe(5)
    expect(mergeSharedFiles(b, a, NOW).items[0].quantity).toBe(5)
  })

  it('a parità di data sceglie sempre la stessa, in qualunque ordine', () => {
    const a = file({ items: [item('a', 'Latte', { quantity: 2 })] })
    const b = file({ items: [item('a', 'Latte', { quantity: 3 })] })
    expect(mergeSharedFiles(a, b, NOW)).toEqual(mergeSharedFiles(b, a, NOW))
  })

  it('un\'eliminazione vince su una voce non più recente e una modifica successiva la fa tornare', () => {
    const t = NOW - 1000
    const del = file({ tombstones: { a: t } })
    const old = file({ items: [item('a', 'Latte', { updatedAt: t })] })
    expect(mergeSharedFiles(old, del, NOW).items).toEqual([])
    expect(mergeSharedFiles(old, del, NOW).tombstones).toEqual({ a: t })
    const edited = file({ items: [item('a', 'Latte', { updatedAt: t + 1 })] })
    const back = mergeSharedFiles(edited, del, NOW)
    expect(back.items).toHaveLength(1)
    expect(back.tombstones).toEqual({})
  })

  it('le eliminazioni si uniscono tenendo la data più recente e dopo 30 giorni si dimenticano', () => {
    const m = mergeSharedFiles(
      file({ tombstones: { a: NOW - 10, b: NOW - TOMBSTONE_TTL_MS - 1, c: NOW - TOMBSTONE_TTL_MS } }),
      file({ tombstones: { a: NOW - 5 } }),
      NOW,
    )
    expect(m.tombstones).toEqual({ a: NOW - 5, c: NOW - TOMBSTONE_TTL_MS })
  })

  it('voci con lo stesso nome diventano una sola: resta la più vecchia, quantità sommate', () => {
    const a = file({ items: [item('a', 'Latte', { addedAt: 1, quantity: 2 })] })
    const b = file({ items: [item('b', 'latte ', { addedAt: 5, quantity: 3, updatedAt: NOW + 1 })] })
    const m = mergeSharedFiles(a, b, NOW)
    expect(m.items).toHaveLength(1)
    expect(m.items[0]).toMatchObject({ uid: 'a', quantity: 5, updatedAt: NOW + 1 })
    expect(m.tombstones).toEqual({ b: NOW + 1 })
    expect(mergeSharedFiles(b, a, NOW)).toEqual(m)
  })

  it('la somma non supera il massimo', () => {
    const a = file({ items: [item('a', 'Latte', { quantity: MAX_QUANTITY })] })
    const b = file({ items: [item('b', 'Latte', { quantity: 5, addedAt: 9 })] })
    expect(mergeSharedFiles(a, b, NOW).items[0].quantity).toBe(MAX_QUANTITY)
  })

  it('rifare il merge con la copia ancora vecchia non rimette le voci unite', () => {
    const a = file({ items: [item('a', 'Latte', { addedAt: 1 })] })
    const b = file({ items: [item('b', 'Latte', { addedAt: 5 })] })
    const once = mergeSharedFiles(a, b, NOW)
    const twice = mergeSharedFiles(once, b, NOW + 1000)
    expect(twice.items.map((i) => i.uid)).toEqual(['a'])
    expect(twice.items[0].quantity).toBe(once.items[0].quantity)
  })

  it('unisce le spese per uid senza duplicarle', () => {
    const s1 = session('s1')
    const m = mergeSharedFiles(
      file({ sessions: [s1] }),
      file({ sessions: [s1, session('s2', { finishedAt: 5000 })] }),
      NOW,
    )
    expect(m.sessions.map((s) => s.uid)).toEqual(['s1', 's2'])
    const conflict = mergeSharedFiles(
      file({ sessions: [session('s1', { buoniSpent: 2 })] }),
      file({ sessions: [session('s1', { buoniSpent: 1 })] }),
      NOW,
    )
    expect(conflict.sessions).toHaveLength(1)
    expect(conflict).toEqual(
      mergeSharedFiles(
        file({ sessions: [session('s1', { buoniSpent: 1 })] }),
        file({ sessions: [session('s1', { buoniSpent: 2 })] }),
        NOW,
      ),
    )
  })

  it('una spesa eliminata (tombstone) non torna, e il tombstone resta', () => {
    const a = file({ sessions: [session('s1'), session('s2', { finishedAt: 3000 })] })
    const b = file({ tombstones: { s1: NOW - 100 }, sessions: [session('s1')] })
    const m = mergeSharedFiles(a, b, NOW)
    expect(m.sessions.map((x) => x.uid)).toEqual(['s2'])
    expect(m.tombstones).toEqual({ s1: NOW - 100 })
    expect(mergeSharedFiles(b, a, NOW)).toEqual(m)
  })

  it('il nome più recente vince; a parità si sceglie sempre lo stesso', () => {
    const a = file({ name: 'Casa', nameUpdatedAt: 5 })
    const b = file({ name: 'Casa nostra', nameUpdatedAt: 9 })
    expect(mergeSharedFiles(a, b, NOW)).toMatchObject({ name: 'Casa nostra', nameUpdatedAt: 9 })
    expect(mergeSharedFiles(b, a, NOW).name).toBe('Casa nostra')
    const x = file({ name: 'Alfa', nameUpdatedAt: 3 })
    const y = file({ name: 'Beta', nameUpdatedAt: 3 })
    expect(mergeSharedFiles(x, y, NOW).name).toBe(mergeSharedFiles(y, x, NOW).name)
  })

  it('rifiuta liste diverse', () => {
    expect(() => mergeSharedFiles(file(), file({ uid: 'altra' }), NOW)).toThrow('diverse')
  })

  it('è simmetrica su un caso misto', () => {
    const a = file({
      items: [item('a', 'Latte', { updatedAt: 5 }), item('c', 'Uova', { addedAt: 3 })],
      tombstones: { x: 1 },
      sessions: [session('s1')],
    })
    const b = file({ items: [item('b', 'Pane', { addedAt: 2 }), item('c', 'Uova', { addedAt: 3, quantity: 4, updatedAt: 9 })], tombstones: { a: 9 } })
    expect(mergeSharedFiles(a, b, NOW)).toEqual(mergeSharedFiles(b, a, NOW))
  })
})
