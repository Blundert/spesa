import type { ActiveShopping } from '../db/types'
import { normalizeName } from './normalize'

/**
 * Formato del file di una lista condivisa nel suo repo dedicato, con validazione rigida (il file lo scrivono
 * anche altre persone: va trattato come input non fidato) e merge senza conflitti manuali.
 */
export const SHARED_FORMAT = 'spesa-shared-list'
export const SHARED_VERSION = 1

/** Una spesa finita resta nel file ancora un po', perché gli altri vedano che è finita prima che sparisca. */
export const SHOPPING_ENDED_TTL_MS = 24 * 60 * 60 * 1000
/** Una spesa "in corso" iniziata da più di tanto si considera dimenticata e non si mostra. */
export const SHOPPING_STALE_MS = 12 * 60 * 60 * 1000
export const MAX_SHOPPING = 50

/** Dopo quanto un'eliminazione smette di essere ricordata (ms). Un dispositivo fermo più a lungo può far ricomparire voci. */
export const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000

// Limiti: il file sta in memoria e si mostra a schermo, quindi niente file enormi né stringhe lunghe.
export const MAX_FILE_CHARS = 1_000_000
export const MAX_ITEMS = 2000
export const MAX_SESSIONS = 500
export const MAX_PURCHASES = 500
export const MAX_NAME = 120
export const MAX_CATEGORY = 60
export const MAX_QUANTITY = 9999
const MAX_CENTS = 100_000_000
const MAX_TIME = 4_102_444_800_000 // 1 gen 2100

export interface SharedItem {
  uid: string
  name: string
  categoryName: string
  quantity: number
  addedAt: number
  addedBy: string
  updatedAt: number
  /** Login di chi l'ha già preso in negozio; null = ancora da prendere. */
  takenBy: string | null
}

export interface SharedPurchase {
  name: string
  categoryName: string
  priceCents: number
  quantity: number
}

/** Una spesa conclusa, immutabile una volta scritta. */
export interface SharedSession {
  uid: string
  doneBy: string
  supermarketName: string
  startedAt: number
  finishedAt: number
  confirmedTotalCents: number | null
  buoniSpent: number
  buoniValueCents: number
  purchases: SharedPurchase[]
}

export type SharedShopping = ActiveShopping

export interface SharedListFile {
  format: typeof SHARED_FORMAT
  version: number
  uid: string
  name: string
  nameUpdatedAt: number
  /** Supermercato preimpostato della lista (per nome); chi riceve la lista lo prende se non ne ha uno. */
  supermarketName?: string | null
  supermarketUpdatedAt?: number
  /** Spese in corso (o appena finite) delle persone della lista, una per persona. */
  shopping?: SharedShopping[]
  items: SharedItem[]
  /** Voci eliminate: uid → quando. */
  tombstones: Record<string, number>
  sessions: SharedSession[]
}

/** `invalid` = file rovinato o non nostro; `newer` = scritto da una versione dell'app più nuova. */
export class SharedFileError extends Error {
  readonly code: 'invalid' | 'newer'
  constructor(code: 'invalid' | 'newer', detail: string) {
    super(`File lista condivisa non valido: ${detail}`)
    this.code = code
  }
}

const fail = (detail: string): never => {
  throw new SharedFileError('invalid', detail)
}

const UID_RE = /^[A-Za-z0-9-]{1,64}$/
const LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/
// eslint-disable-next-line no-control-regex -- proprio i caratteri di controllo vanno rifiutati
const CONTROL_RE = /[\u0000-\u001f\u007f]/
// eslint-disable-next-line no-control-regex -- come sopra, globale per sostituirli tutti
const CONTROL_RE_G = /[\u0000-\u001f\u007f]/g

/** Testo adatto al file: senza caratteri di controllo e non più lungo del massimo, così il nostro file passa sempre la validazione. */
export function cleanText(value: string, max: number): string {
  return value.replace(CONTROL_RE_G, ' ').trim().slice(0, max).trim() || '?'
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function rec(v: unknown, field: string): Record<string, unknown> {
  return isRecord(v) ? v : fail(`${field}: oggetto atteso`)
}

function arr(v: unknown, field: string, max: number): unknown[] {
  if (!Array.isArray(v)) return fail(`${field}: elenco atteso`)
  return v.length <= max ? v : fail(`${field}: troppi elementi`)
}

function text(v: unknown, field: string, max: number): string {
  if (typeof v !== 'string') return fail(`${field}: testo atteso`)
  const t = v.trim()
  if (t === '' || t.length > max) return fail(`${field}: lunghezza non valida`)
  return CONTROL_RE.test(t) ? fail(`${field}: caratteri non ammessi`) : t
}

function int(v: unknown, field: string, min: number, max: number): number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : fail(`${field}: numero non valido`)
}

function uid(v: unknown, field: string): string {
  return typeof v === 'string' && UID_RE.test(v) ? v : fail(`${field}: identificatore non valido`)
}

function login(v: unknown, field: string): string {
  return typeof v === 'string' && LOGIN_RE.test(v) ? v : fail(`${field}: utente non valido`)
}

function unique<T extends { uid: string }>(list: T[], field: string): T[] {
  return new Set(list.map((x) => x.uid)).size === list.length ? list : fail(`${field}: identificatore ripetuto`)
}

function uniqueBy(list: SharedShopping[], field: string): SharedShopping[] {
  return new Set(list.map((x) => x.by)).size === list.length ? list : fail(`${field}: persona ripetuta`)
}

function parseItem(raw: unknown): SharedItem {
  const o = rec(raw, 'items')
  return {
    uid: uid(o.uid, 'items.uid'),
    name: text(o.name, 'items.name', MAX_NAME),
    categoryName: text(o.categoryName, 'items.categoryName', MAX_CATEGORY),
    quantity: int(o.quantity, 'items.quantity', 1, MAX_QUANTITY),
    addedAt: int(o.addedAt, 'items.addedAt', 0, MAX_TIME),
    addedBy: login(o.addedBy, 'items.addedBy'),
    updatedAt: int(o.updatedAt, 'items.updatedAt', 0, MAX_TIME),
    takenBy: o.takenBy === null ? null : login(o.takenBy, 'items.takenBy'),
  }
}

function parseShopping(raw: unknown): SharedShopping {
  const o = rec(raw, 'shopping')
  return {
    by: login(o.by, 'shopping.by'),
    supermarketName: text(o.supermarketName, 'shopping.supermarketName', MAX_NAME),
    buoniSpent: int(o.buoniSpent, 'shopping.buoniSpent', 0, 1000),
    buoniValueCents: int(o.buoniValueCents, 'shopping.buoniValueCents', 0, 100_000),
    startedAt: int(o.startedAt, 'shopping.startedAt', 0, MAX_TIME),
    endedAt: o.endedAt === null ? null : int(o.endedAt, 'shopping.endedAt', 0, MAX_TIME),
  }
}

function parsePurchase(raw: unknown): SharedPurchase {
  const o = rec(raw, 'purchases')
  return {
    name: text(o.name, 'purchases.name', MAX_NAME),
    categoryName: text(o.categoryName, 'purchases.categoryName', MAX_CATEGORY),
    priceCents: int(o.priceCents, 'purchases.priceCents', 0, MAX_CENTS),
    quantity: int(o.quantity, 'purchases.quantity', 1, MAX_QUANTITY),
  }
}

function parseSession(raw: unknown): SharedSession {
  const o = rec(raw, 'sessions')
  return {
    uid: uid(o.uid, 'sessions.uid'),
    doneBy: login(o.doneBy, 'sessions.doneBy'),
    supermarketName: text(o.supermarketName, 'sessions.supermarketName', MAX_NAME),
    startedAt: int(o.startedAt, 'sessions.startedAt', 0, MAX_TIME),
    finishedAt: int(o.finishedAt, 'sessions.finishedAt', 0, MAX_TIME),
    confirmedTotalCents:
      o.confirmedTotalCents === null ? null : int(o.confirmedTotalCents, 'sessions.confirmedTotalCents', 0, MAX_CENTS),
    buoniSpent: int(o.buoniSpent, 'sessions.buoniSpent', 0, 1000),
    buoniValueCents: int(o.buoniValueCents, 'sessions.buoniValueCents', 0, 100_000),
    purchases: arr(o.purchases, 'sessions.purchases', MAX_PURCHASES).map(parsePurchase),
  }
}

/** Legge e valida il testo di un file di lista condivisa. Lancia `SharedFileError` se non va bene. */
export function parseSharedFile(source: string): SharedListFile {
  if (source.length > MAX_FILE_CHARS) return fail('file troppo grande')
  let raw: unknown
  try {
    raw = JSON.parse(source)
  } catch {
    return fail('JSON non valido')
  }
  const o = rec(raw, 'file')
  if (o.format !== SHARED_FORMAT) return fail('non è una lista condivisa')
  const version = int(o.version, 'version', 1, 1_000_000)
  if (version > SHARED_VERSION) throw new SharedFileError('newer', 'scritto da una versione più recente dell\'app')

  const tombstonesRaw = rec(o.tombstones, 'tombstones')
  const tombstones: Record<string, number> = {}
  const keys = Object.keys(tombstonesRaw)
  if (keys.length > MAX_ITEMS * 5) return fail('tombstones: troppi elementi')
  for (const k of keys) tombstones[uid(k, 'tombstones')] = int(tombstonesRaw[k], 'tombstones', 0, MAX_TIME)

  return canonical({
    format: SHARED_FORMAT,
    version,
    uid: uid(o.uid, 'uid'),
    name: text(o.name, 'name', MAX_NAME),
    nameUpdatedAt: int(o.nameUpdatedAt, 'nameUpdatedAt', 0, MAX_TIME),
    // Campi aggiunti dopo: un file più vecchio non li ha.
    supermarketName: o.supermarketName == null ? null : text(o.supermarketName, 'supermarketName', MAX_NAME),
    supermarketUpdatedAt: o.supermarketUpdatedAt === undefined ? 0 : int(o.supermarketUpdatedAt, 'supermarketUpdatedAt', 0, MAX_TIME),
    shopping: uniqueBy(arr(o.shopping ?? [], 'shopping', MAX_SHOPPING).map(parseShopping), 'shopping'),
    items: unique(arr(o.items, 'items', MAX_ITEMS).map(parseItem), 'items'),
    tombstones,
    sessions: unique(arr(o.sessions, 'sessions', MAX_SESSIONS).map(parseSession), 'sessions'),
  })
}

// Gli uid sono unici (il parser rifiuta i doppioni), quindi il confronto per uid non pareggia mai.
const byAdded = (a: SharedItem, b: SharedItem) => a.addedAt - b.addedAt || (a.uid < b.uid ? -1 : 1)
const bySession = (a: SharedSession, b: SharedSession) =>
  a.finishedAt - b.finishedAt || (a.uid < b.uid ? -1 : 1)

/** Forma canonica: elenchi ordinati e chiavi sempre nello stesso ordine, così due file uguali sono testo uguale. */
function canonical(f: SharedListFile): SharedListFile {
  const tombstones: Record<string, number> = {}
  for (const k of Object.keys(f.tombstones).sort()) tombstones[k] = f.tombstones[k]
  return {
    format: SHARED_FORMAT,
    version: SHARED_VERSION,
    uid: f.uid,
    name: f.name,
    nameUpdatedAt: f.nameUpdatedAt,
    supermarketName: f.supermarketName ?? null,
    supermarketUpdatedAt: f.supermarketUpdatedAt ?? 0,
    shopping: [...(f.shopping ?? [])].sort((a, b) => (a.by < b.by ? -1 : 1)),
    items: [...f.items].sort(byAdded),
    tombstones,
    sessions: [...f.sessions].sort(bySession),
  }
}

/** Testo del file da scrivere nel repo. */
export function serializeSharedFile(f: SharedListFile): string {
  return JSON.stringify(canonical(f), null, 2) + '\n'
}

/** Stesso contenuto (indipendente dall'ordine in cui è stato scritto)? */
export function sameSharedContent(a: SharedListFile, b: SharedListFile): boolean {
  return serializeSharedFile(a) === serializeSharedFile(b)
}

/** Dei due, quello che vince nel merge: il più recente; a parità, uno scelto sempre allo stesso modo. */
function newer<T extends { updatedAt: number }>(a: T, b: T): T {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b
}

/**
 * Unisce la copia locale e quella del repo senza chiedere niente a nessuno:
 * - ogni voce è identificata dal suo uid; se due persone l'hanno cambiata vince la modifica più recente;
 * - un'eliminazione (tombstone) vince su una voce non più recente di lei; una modifica successiva la fa tornare;
 * - voci con lo stesso nome (aggiunte in parallelo da due persone) diventano una sola con le quantità sommate;
 * - il supermercato della lista: vince il cambio più recente; le spese in corso: una per persona, la più recente;
 * - le spese concluse si uniscono per uid (non cambiano mai; una spesa eliminata, cioè con un tombstone, non torna);
 * - le eliminazioni più vecchie di 30 giorni si dimenticano.
 * È simmetrica: `merge(a, b)` e `merge(b, a)` danno lo stesso risultato.
 */
export function mergeSharedFiles(a: SharedListFile, b: SharedListFile, now: number): SharedListFile {
  if (a.uid !== b.uid) throw new Error('Liste condivise diverse')

  const byUid = new Map<string, SharedItem>()
  for (const it of [...a.items, ...b.items]) {
    const cur = byUid.get(it.uid)
    byUid.set(it.uid, cur ? newer(cur, it) : it)
  }

  const tombstones: Record<string, number> = {}
  for (const src of [a.tombstones, b.tombstones]) {
    for (const [k, t] of Object.entries(src)) tombstones[k] = Math.max(tombstones[k] ?? 0, t)
  }

  const alive = [...byUid.values()].filter((it) => tombstones[it.uid] === undefined || it.updatedAt > tombstones[it.uid])

  // Stesso nome = stessa voce: resta la più vecchia, con le quantità sommate; le altre diventano eliminazioni.
  const groups = new Map<string, SharedItem[]>()
  for (const it of [...alive].sort(byAdded)) {
    const key = normalizeName(it.name)
    groups.set(key, [...(groups.get(key) ?? []), it])
  }
  const items: SharedItem[] = []
  for (const group of groups.values()) {
    const [first, ...rest] = group
    if (rest.length === 0) {
      items.push(first)
      continue
    }
    const quantity = Math.min(MAX_QUANTITY, group.reduce((n, it) => n + it.quantity, 0))
    const updatedAt = Math.max(now, ...group.map((it) => it.updatedAt))
    items.push({ ...first, quantity, updatedAt })
    for (const loser of rest) tombstones[loser.uid] = updatedAt
  }

  // Le eliminazioni di voci tornate in vita non servono più; quelle vecchie si dimenticano.
  const kept: Record<string, number> = {}
  const aliveUids = new Set(items.map((it) => it.uid))
  for (const [k, t] of Object.entries(tombstones)) {
    if (!aliveUids.has(k) && now - t <= TOMBSTONE_TTL_MS) kept[k] = t
  }

  // Una spesa eliminata (tombstone) non torna; per il resto le spese non cambiano mai.
  const sessions = new Map<string, SharedSession>()
  for (const s of [...a.sessions, ...b.sessions]) {
    if (tombstones[s.uid] !== undefined) continue
    const cur = sessions.get(s.uid)
    sessions.set(s.uid, cur && JSON.stringify(cur) >= JSON.stringify(s) ? cur : s)
  }

  // Supermercato della lista: il più recente; spese in corso: per persona, la più recente (iniziata o finita);
  // quelle finite da più di un giorno si dimenticano.
  const supA = a.supermarketUpdatedAt ?? 0
  const supB = b.supermarketUpdatedAt ?? 0
  const supWins = supA !== supB ? (supA > supB ? a : b) : (a.supermarketName ?? '') >= (b.supermarketName ?? '') ? a : b
  const byPerson = new Map<string, SharedShopping>()
  for (const x of [...(a.shopping ?? []), ...(b.shopping ?? [])]) {
    const cur = byPerson.get(x.by)
    const stamp = (v: SharedShopping) => v.endedAt ?? v.startedAt
    const wins = !cur || stamp(x) > stamp(cur) || (stamp(x) === stamp(cur) && JSON.stringify(x) > JSON.stringify(cur))
    if (wins) byPerson.set(x.by, x)
  }
  const shopping = [...byPerson.values()].filter((x) => x.endedAt === null || now - x.endedAt <= SHOPPING_ENDED_TTL_MS)

  const nameWins =
    a.nameUpdatedAt !== b.nameUpdatedAt ? (a.nameUpdatedAt > b.nameUpdatedAt ? a : b) : a.name >= b.name ? a : b

  return canonical({
    format: SHARED_FORMAT,
    version: SHARED_VERSION,
    uid: a.uid,
    name: nameWins.name,
    nameUpdatedAt: Math.max(a.nameUpdatedAt, b.nameUpdatedAt),
    supermarketName: supWins.supermarketName ?? null,
    supermarketUpdatedAt: Math.max(supA, supB),
    shopping,
    items,
    tombstones: kept,
    sessions: [...sessions.values()],
  })
}
