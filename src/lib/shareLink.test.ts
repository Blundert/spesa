import { describe, it, expect } from 'vitest'
import {
  MAX_SHARE_ENCODED,
  MAX_SHARE_INPUT,
  buildShareUrl,
  decodeSharePayload,
  dedupeShareItems,
  encodeSharePayload,
  fromBase64Url,
  isShareTooLong,
  makeShareItems,
  newShareId,
  parseShareHash,
  toBase64Url,
  validateSharePayload,
  type SharePayload,
} from './shareLink'

const payload: SharePayload = {
  id: 'abc123',
  name: 'Casa',
  items: [
    { name: 'Mele', quantity: 2, category: 'Frutta e verdura' },
    { name: 'Caffè ☕', quantity: 1, category: 'Dispensa' },
  ],
}

const deflate = async (text: string): Promise<string> => {
  const stream = new ReadableStream<BufferSource>({
    start(c) {
      c.enqueue(new TextEncoder().encode(text))
      c.close()
    },
  }).pipeThrough(new CompressionStream('deflate-raw'))
  return toBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()))
}

describe('base64url', () => {
  it('fa il giro e non usa + / =', () => {
    const bytes = Uint8Array.from([251, 255, 254, 0, 1, 2, 3])
    const text = toBase64Url(bytes)
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(Array.from(fromBase64Url(text) as Uint8Array)).toEqual(Array.from(bytes))
  })

  it('regge più di un blocco di byte', () => {
    const bytes = new Uint8Array(70_000).map((_, i) => i % 251)
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes)
  })

  it('rifiuta caratteri estranei e lunghezze impossibili', () => {
    expect(fromBase64Url('ab+/')).toBeNull()
    expect(fromBase64Url('abcde')).toBeNull()
  })
})

describe('newShareId', () => {
  it('è breve, in base64url e diverso a ogni chiamata', () => {
    const a = newShareId()
    expect(a).toMatch(/^[A-Za-z0-9_-]{12}$/)
    expect(newShareId()).not.toBe(a)
  })
})

describe('dedupeShareItems', () => {
  it('unisce i nomi uguali (senza badare a maiuscole) sommando le quantità', () => {
    const out = dedupeShareItems([
      { name: 'Latte', quantity: 2, category: 'Frigo' },
      { name: 'latte ', quantity: 3, category: 'Altro' },
      { name: 'Pane', quantity: 1, category: 'Panetteria' },
    ])
    expect(out).toEqual([
      { name: 'Latte', quantity: 5, category: 'Frigo' },
      { name: 'Pane', quantity: 1, category: 'Panetteria' },
    ])
  })

  it('non supera la quantità massima e non modifica l\'input', () => {
    const input = [
      { name: 'A', quantity: 9000, category: 'x' },
      { name: 'a', quantity: 9000, category: 'x' },
    ]
    expect(dedupeShareItems(input)[0].quantity).toBe(9999)
    expect(input[0].quantity).toBe(9000)
  })
})

describe('makeShareItems', () => {
  it('ordina, unisce i doppioni e tiene i valori nei limiti', () => {
    const out = makeShareItems([
      { name: ' Pane ', quantity: 0, category: ' Panetteria ' },
      { name: 'Arance', quantity: 2.4, category: 'Frutta' },
      { name: 'x'.repeat(200), quantity: 20_000, category: 'y'.repeat(100) },
    ])
    expect(out.map((i) => i.name)).toEqual(['Arance', 'Pane', 'x'.repeat(120)])
    expect(out.map((i) => i.quantity)).toEqual([2, 1, 9999])
    expect(out[1].category).toBe('Panetteria')
    expect(out[2].category).toHaveLength(60)
  })
})

describe('encodeSharePayload / decodeSharePayload', () => {
  it('fa il giro, anche con accenti ed emoji', async () => {
    expect(await decodeSharePayload(await encodeSharePayload(payload))).toEqual(payload)
  })

  it('una lista tipica sta largamente nel limite del link', async () => {
    const items = Array.from({ length: 40 }, (_, i) => ({ name: `Articolo numero ${i}`, quantity: 1 + (i % 3), category: 'Dispensa' }))
    const encoded = await encodeSharePayload({ id: newShareId(), name: 'Settimana', items })
    expect(isShareTooLong(encoded)).toBe(false)
  })

  it('rifiuta stringa vuota, troppo lunga, caratteri sbagliati o dati che non sono deflate', async () => {
    expect(await decodeSharePayload('')).toBeNull()
    expect(await decodeSharePayload('a'.repeat(MAX_SHARE_INPUT + 1))).toBeNull()
    expect(await decodeSharePayload('!!!')).toBeNull()
    expect(await decodeSharePayload('AAAAAAAA')).toBeNull()
  })

  it('rifiuta un JSON valido ma con la forma sbagliata', async () => {
    expect(await decodeSharePayload(await deflate('{"a":1}'))).toBeNull()
    expect(await decodeSharePayload(await deflate('non json'))).toBeNull()
  })

  it('rifiuta una "bomba": decompresso enorme da pochi byte', async () => {
    const encoded = await deflate('['.repeat(300_000))
    expect(encoded.length).toBeLessThan(MAX_SHARE_INPUT)
    expect(await decodeSharePayload(encoded)).toBeNull()
  })
})

describe('validateSharePayload', () => {
  const ok = [1, 'id', 'Casa', [['Mele', 2, 'Frutta']]]

  it('accetta il formato giusto e pulisce gli spazi', () => {
    expect(validateSharePayload([1, 'id', ' Casa ', [[' Mele ', 2, ' Frutta ']]])).toEqual({
      id: 'id',
      name: 'Casa',
      items: [{ name: 'Mele', quantity: 2, category: 'Frutta' }],
    })
  })

  it('accetta una lista senza voci', () => {
    expect(validateSharePayload([1, 'id', 'Casa', []])?.items).toEqual([])
  })

  it('rifiuta ogni deviazione', () => {
    const bad: unknown[] = [
      null,
      'x',
      [1, 'id', 'Casa'],
      [2, 'id', 'Casa', []],
      [1, '', 'Casa', []],
      [1, 'x'.repeat(65), 'Casa', []],
      [1, 'id', '  ', []],
      [1, 'id', 'x'.repeat(121), []],
      [1, 'id', 'Casa', 'no'],
      [1, 'id', 'Casa', Array.from({ length: 301 }, () => ['a', 1, 'b'])],
      [1, 'id', 'Casa', ['no']],
      [1, 'id', 'Casa', [['a', 1]]],
      [1, 'id', 'Casa', [['', 1, 'b']]],
      [1, 'id', 'Casa', [['a', 1, '']]],
      [1, 'id', 'Casa', [['a', 1, 'x'.repeat(61)]]],
      [1, 'id', 'Casa', [['a', 0, 'b']]],
      [1, 'id', 'Casa', [['a', 1.5, 'b']]],
      [1, 'id', 'Casa', [['a', '2', 'b']]],
      [1, 'id', 'Casa', [['a', 10_000, 'b']]],
      [1, 7, 'Casa', []],
    ]
    for (const b of bad) expect(validateSharePayload(b)).toBeNull()
    expect(validateSharePayload(ok)).not.toBeNull()
  })

  it('unisce le voci con lo stesso nome', () => {
    const p = validateSharePayload([1, 'id', 'Casa', [['Latte', 1, 'Frigo'], ['LATTE', 2, 'Frigo']]])
    expect(p?.items).toEqual([{ name: 'Latte', quantity: 3, category: 'Frigo' }])
  })
})

describe('link', () => {
  it('costruisce l\'URL con il fragment e lo rilegge', () => {
    const url = buildShareUrl('https://spesa.example.com', 'abc-_')
    expect(url).toBe('https://spesa.example.com/#l=abc-_')
    expect(parseShareHash(new URL(url).hash)).toBe('abc-_')
  })

  it('riconosce solo il fragment dei link di lista', () => {
    expect(parseShareHash('')).toBeNull()
    expect(parseShareHash('#l=')).toBeNull()
    expect(parseShareHash('#x=abc')).toBeNull()
  })

  it('segnala le liste troppo grandi per un link', () => {
    expect(isShareTooLong('a'.repeat(MAX_SHARE_ENCODED))).toBe(false)
    expect(isShareTooLong('a'.repeat(MAX_SHARE_ENCODED + 1))).toBe(true)
  })
})
