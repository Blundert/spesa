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
}

/** Supermercato (deduplicato su normalizedName). */
export interface Supermarket {
  id?: number
  name: string
  /** Lowercase + trim. */
  normalizedName: string
}

/** Budget buoni pasto per settimana ISO. */
export interface WeekBudget {
  id?: number
  /** Es. "2026-W24" */
  isoWeek: string
  /** Numero di buoni disponibili questa settimana. */
  buoniCount: number
  /** Valore unitario in centesimi (es. 800 = €8,00). */
  buoniValueCents: number
}

/**
 * Voce della lista della spesa. La lista è unica e globale (non più legata a una
 * settimana): si svuota al termine di ogni spesa.
 */
export interface ListItem {
  id?: number
  itemId: number
  quantity: number
  addedAt: number // timestamp ms
}

/** Sessione di spesa (una visita in un supermercato). */
export interface Session {
  id?: number
  isoWeek: string
  supermarketId: number
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
}
