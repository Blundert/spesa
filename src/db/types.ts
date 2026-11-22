/** Categoria merceologica (seeded, immutabile). */
export interface Category {
  id?: number
  name: string
  sortOrder: number
}

/** Articolo della spesa (deduplicato su normalizedName). */
export interface Item {
  id?: number
  name: string
  /** Lowercase + trim, usato per dedup. */
  normalizedName: string
  categoryId: number
  /** Ultimo prezzo pagato, in centesimi. null se mai acquistato. */
  lastPriceCents: number | null
  /** Prezzo suggerito (media storica), in centesimi. null se non disponibile. */
  suggestedPriceCents: number | null
  /** Somma totale delle quantità acquistate in tutte le sessioni. Usato per ordinare i suggerimenti rapidi. */
  purchaseCount?: number
}

/** Supermercato (deduplicato su normalizedName). */
export interface Supermarket {
  id?: number
  name: string
  /** Lowercase + trim. */
  normalizedName: string
  /** Data URL base64 JPEG della tessera fedeltà. null = rimossa, undefined = mai aggiunta. */
  loyaltyCard?: string | null
}

/** Buoni pasto disponibili in una settimana ISO (opzionale, non vincolante). */
export interface WeekBudget {
  id?: number
  /** Es. "2026-W24" */
  isoWeek: string
  /** Numero di buoni disponibili questa settimana (0 se non impostato). */
  buoniAvailable: number
}

/** Valore di default di un buono pasto, in centesimi (€8,00). */
export const DEFAULT_BUONO_VALUE_CENTS = 800

/** Nome della lista creata al primo avvio (e con la migrazione della lista unica). */
export const DEFAULT_LIST_NAME = 'Spesa'

/** Come conta, per il MIO budget, la spesa fatta da un altro: `partner` = buoni condivisi, `stranger` = no. */
export type SharedMemberKind = 'partner' | 'stranger'

/** Un altro utente di una lista condivisa, come lo vedo io (nome e tipo restano su questo dispositivo). */
export interface SharedMember {
  /** Nome visibile (es. "Anna"); se vuoto si mostra il login GitHub. */
  label: string
  kind: SharedMemberKind
}

/**
 * Collegamento di una lista a un repo GitHub condiviso. Non contiene mai il token (quello sta solo
 * nella configurazione del sync, su questo dispositivo).
 */
export interface SharedLink {
  /** Identificatore stabile della lista condivisa: sta anche nel file del repo, non cambia mai. */
  uid: string
  owner: string
  repo: string
  branch: string
  /** File della lista dentro il repo. */
  path: string
  /** Login GitHub di chi usa questo dispositivo. */
  me: string
  /** Permesso di scrittura sul repo all'ultimo controllo (false = sola lettura). */
  canWrite: boolean
  /** Quando è stato cambiato per l'ultima volta il nome della lista (ms): nel merge vince il più recente. */
  nameUpdatedAt?: number
  /** Gli altri utenti, per login GitHub. */
  members: Record<string, SharedMember>
  /** Voci eliminate (uid → quando): servono al merge perché un'eliminazione non ricompaia. */
  tombstones: Record<string, number>
  /**
   * Sha del file remoto all'ultimo sync. Assente = non so cosa c'è nel repo: prima di scrivere
   * si scarica sempre (è il caso dopo un ripristino da backup).
   */
  lastSha?: string
}

/** Lista della spesa tematica (es. "Settimanale", "Casa"). Una spesa parte da una lista. */
export interface ShoppingList {
  id?: number
  name: string
  /** Supermercato preimpostato: la spesa di questa lista salta la scelta del negozio. */
  supermarketId: number | null
  sortOrder: number
  /** Timestamp di archiviazione; null se attiva. Le archiviate tengono i loro prodotti. */
  archivedAt: number | null
  /** Spesa solita scelta a mano (id degli articoli, in ordine). Assente = automatica. */
  usualItemIds?: number[]
  /** Chip rapidi scelti a mano (id degli articoli, in ordine). Assente = automatici. */
  quickItemIds?: number[]
  /** Presente solo se la lista è condivisa con altre persone tramite un repo GitHub. */
  shared?: SharedLink
}

/**
 * Voce di una lista della spesa. Lo stesso item può stare in più liste, con quantità
 * indipendenti; a fine spesa escono solo le voci acquistate della lista della spesa.
 */
export interface ListItem {
  id?: number
  listId: number
  itemId: number
  quantity: number
  addedAt: number // timestamp ms
  /** Solo nelle liste condivise: identificatore stabile della voce (gli id locali sono diversi su ogni dispositivo). */
  uid?: string
  /** Solo nelle liste condivise: ultima modifica, ms (nel merge vince la più recente). */
  updatedAt?: number
  /** Solo nelle liste condivise: login GitHub di chi ha aggiunto la voce. */
  addedBy?: string
  /** Solo nelle liste condivise: login GitHub di chi l'ha già presa in negozio; null/assente = ancora da prendere. */
  takenBy?: string | null
}

/** Sessione di spesa (una visita in un supermercato). */
export interface Session {
  id?: number
  isoWeek: string
  supermarketId: number
  /**
   * Lista da cui è partita la spesa. Assente solo nei dati importati senza liste; può
   * puntare a una lista eliminata definitivamente (la spesa resta senza etichetta).
   */
  listId?: number
  /** Timestamp inizio sessione, ms. */
  startedAt: number
  /** Timestamp fine sessione (null se in corso). */
  finishedAt: number | null
  /**
   * Importo confermato a fine spesa, in centesimi. null finché non confermato.
   * Quando valorizzato è autoritativo per il recap (il totale calcolato dagli
   * acquisti resta come dettaglio).
   */
  confirmedTotalCents: number | null
  /** Buoni pasto usati in questa spesa. */
  buoniSpent: number
  /** Valore unitario del buono usato in questa spesa, in centesimi. */
  buoniValueCents: number
}

/** Acquisto singolo all'interno di una sessione. */
export interface Purchase {
  id?: number
  sessionId: number
  itemId: number
  /** Prezzo pagato, in centesimi. */
  priceCents: number
  quantity: number
}

/** 0 = pranzo, 1 = cena */
export type MealType = 0 | 1

/** Pianificazione pasto (pranzo e cena per ogni giorno della settimana). */
export interface MealPlan {
  id?: number
  isoWeek: string
  /** 0=Lunedì … 6=Domenica */
  dayIndex: number
  /** 0=pranzo, 1=cena */
  mealType: MealType
  dish: string
  /** Piatto del catalogo collegato. Assente nelle pianificazioni create prima di questa feature. */
  dishId?: number
  /**
   * Ingredienti del piatto effettivamente necessari per questa occorrenza (sottoinsieme
   * degli ingredienti del piatto). Presente solo se `dishId` è presente.
   */
  selectedItemIds?: number[]
}

/** Piatto del catalogo (deduplicato su normalizedName), riutilizzabile tra settimane diverse. */
export interface Dish {
  id?: number
  name: string
  /** Lowercase + trim, usato per dedup. */
  normalizedName: string
}

/** Ingrediente di un piatto: riferimento a un Item del catalogo spesa. */
export interface DishIngredient {
  id?: number
  dishId: number
  itemId: number
}

/**
 * Copia di sicurezza dei dati locali, presa prima di un'operazione che li sostituisce
 * (sync, import, ripristino). `json` è un BackupData serializzato. Non fa parte del backup.
 */
export interface SafetySnapshot {
  id?: number
  createdAt: number
  reason: SafetySnapshotReason
  json: string
}

export type SafetySnapshotReason = 'pull' | 'import-file' | 'restore'
