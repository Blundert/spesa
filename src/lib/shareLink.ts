import { compareNames, normalizeName } from './normalize'

/**
 * Link "lista spuntabile": tutta la lista sta nel fragment dell'URL (`#l=<payload>`), che il browser non
 * manda mai al server. Il payload è un array posizionale compresso (deflate-raw) e scritto in base64url.
 * Chi apre il link lo legge come input non fidato: validazione rigida e limiti anche sul decompresso.
 */
export const SHARE_VERSION = 1
export const SHARE_HASH_KEY = 'l'

/** Oltre questa lunghezza del payload la lista è troppo grande per un link (chat e Note lo troncherebbero). */
export const MAX_SHARE_ENCODED = 3000
/** Payload più lunghi di così non si decodificano nemmeno. */
export const MAX_SHARE_INPUT = 20_000
/** Dimensione massima del JSON dopo la decompressione (contro i file "bomba"). */
export const MAX_SHARE_DECODED = 200_000
export const MAX_SHARE_ITEMS = 300
export const MAX_SHARE_NAME = 120
export const MAX_SHARE_CATEGORY = 60
export const MAX_SHARE_QUANTITY = 9999
export const MAX_SHARE_ID = 64

export interface ShareItem {
  name: string
  quantity: number
  category: string
}

export interface SharePayload {
  /** Identificatore stabile della lista di chi condivide: la stessa lista rimandata ritrova le sue spunte. */
  id: string
  name: string
  items: ShareItem[]
}

/** Id casuale breve per una lista che viene condivisa la prima volta. */
export function newShareId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9))
  return toBase64Url(bytes)
}

/** Due voci con lo stesso nome (normalizzato) sono una sola: tiene la prima e somma le quantità. */
export function dedupeShareItems(items: ShareItem[]): ShareItem[] {
  const byName = new Map<string, ShareItem>()
  for (const it of items) {
    const key = normalizeName(it.name)
    const existing = byName.get(key)
    if (existing) existing.quantity = Math.min(MAX_SHARE_QUANTITY, existing.quantity + it.quantity)
    else byName.set(key, { ...it })
  }
  return [...byName.values()]
}

/** Voci di una lista pronte da condividere: nomi accorciati ai limiti, doppioni uniti, ordine alfabetico. */
export function makeShareItems(rows: ShareItem[]): ShareItem[] {
  const clipped = rows.map((r) => ({
    name: r.name.trim().slice(0, MAX_SHARE_NAME),
    quantity: Math.min(MAX_SHARE_QUANTITY, Math.max(1, Math.round(r.quantity))),
    category: r.category.trim().slice(0, MAX_SHARE_CATEGORY),
  }))
  return dedupeShareItems(clipped).sort((a, b) => compareNames(a.name, b.name))
}

export function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) return null
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

function streamOf(bytes: Uint8Array<ArrayBuffer>): ReadableStream<BufferSource> {
  return new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
}

async function readAll(stream: ReadableStream<Uint8Array>, max: number): Promise<Uint8Array | null> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > max) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

/** JSON → byte compressi → base64url. */
export async function encodeSharePayload(payload: SharePayload): Promise<string> {
  const json = JSON.stringify([
    SHARE_VERSION,
    payload.id,
    payload.name,
    payload.items.map((i) => [i.name, i.quantity, i.category]),
  ])
  const bytes = new TextEncoder().encode(json)
  const compressed = await readAll(streamOf(bytes).pipeThrough(new CompressionStream('deflate-raw')), Infinity)
  return toBase64Url(compressed as Uint8Array)
}

function validText(x: unknown, max: number): x is string {
  return typeof x === 'string' && x.trim().length > 0 && x.length <= max
}

/** Controlla la forma del JSON decodificato; `null` se qualcosa non torna. Mai eccezioni. */
export function validateSharePayload(raw: unknown): SharePayload | null {
  if (!Array.isArray(raw) || raw.length !== 4 || raw[0] !== SHARE_VERSION) return null
  const [, id, name, rows] = raw as [unknown, unknown, unknown, unknown]
  if (!validText(id, MAX_SHARE_ID) || !validText(name, MAX_SHARE_NAME)) return null
  if (!Array.isArray(rows) || rows.length > MAX_SHARE_ITEMS) return null
  const items: ShareItem[] = []
  for (const row of rows as unknown[]) {
    if (!Array.isArray(row) || row.length !== 3) return null
    const [n, q, c] = row as [unknown, unknown, unknown]
    if (!validText(n, MAX_SHARE_NAME) || !validText(c, MAX_SHARE_CATEGORY)) return null
    if (!Number.isInteger(q) || (q as number) < 1 || (q as number) > MAX_SHARE_QUANTITY) return null
    items.push({ name: n.trim(), quantity: q as number, category: c.trim() })
  }
  return { id, name: name.trim(), items: dedupeShareItems(items) }
}

/** Il contrario di `encodeSharePayload`; `null` per qualunque payload rotto, troppo grande o non valido. */
export async function decodeSharePayload(encoded: string): Promise<SharePayload | null> {
  if (encoded.length === 0 || encoded.length > MAX_SHARE_INPUT) return null
  try {
    const bytes = fromBase64Url(encoded)
    if (bytes === null) return null
    const json = await readAll(streamOf(bytes).pipeThrough(new DecompressionStream('deflate-raw')), MAX_SHARE_DECODED)
    if (json === null) return null
    return validateSharePayload(JSON.parse(new TextDecoder().decode(json)))
  } catch {
    return null
  }
}

export function buildShareUrl(origin: string, encoded: string): string {
  return `${origin}/#${SHARE_HASH_KEY}=${encoded}`
}

/** Il payload dentro un `location.hash`, o `null` se non è un link di lista condivisa. */
export function parseShareHash(hash: string): string | null {
  const prefix = `#${SHARE_HASH_KEY}=`
  return hash.startsWith(prefix) && hash.length > prefix.length ? hash.slice(prefix.length) : null
}

export function isShareTooLong(encoded: string): boolean {
  return encoded.length > MAX_SHARE_ENCODED
}
