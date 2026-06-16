/**
 * Convenzione chiavi query TanStack Query.
 * Struttura: [domain, ...params]
 * Usare queste costanti (non stringhe inline) per invalidare in modo type-safe.
 */
export const qk = {
  categories: () => ['categories'] as const,

  items: () => ['items'] as const,
  item: (id: number) => ['items', id] as const,

  supermarkets: () => ['supermarkets'] as const,
  supermarket: (id: number) => ['supermarkets', id] as const,

  weekBudget: (isoWeek: string) => ['weekBudget', isoWeek] as const,

  /** Lista della spesa: unica e globale. */
  listItems: () => ['listItems'] as const,

  /** Acquisti aggregati di tutte le sessioni di una settimana (per il recap). */
  purchasesForWeek: (isoWeek: string) => ['purchasesForWeek', isoWeek] as const,

  sessions: (isoWeek: string) => ['sessions', isoWeek] as const,
  allSessions: () => ['sessions'] as const,
  session: (id: number) => ['sessions', 'detail', id] as const,

  purchases: (sessionId: number) => ['purchases', sessionId] as const,

  priceHistory: (itemId: number) => ['priceHistory', itemId] as const,

  mealPlan: (isoWeek: string) => ['mealPlan', isoWeek] as const,

  /** Settimane con almeno un pasto pianificato (storico pianificazioni). */
  plannedWeeks: () => ['plannedWeeks'] as const,
} as const
