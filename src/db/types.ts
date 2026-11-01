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
