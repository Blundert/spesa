import type { WeekBudget, Session, Purchase } from '../db/types'

export interface BudgetSummary {
  /** Budget totale in centesimi (buoniCount × buoniValueCents). */
  totalCents: number
  /**
   * Quanto già speso nelle sessioni finite della settimana, in centesimi.
   * Per ogni sessione vale l'importo confermato se presente, altrimenti la somma
   * calcolata dai suoi acquisti.
   */
  spentCents: number
  /** totalCents − spentCents. Può essere negativo. */
  remainingCents: number
  /** Se negativo: importo da pagare di tasca propria (abs di remainingCents). */
  outOfPocketCents: number
  /** true se la spesa supera il budget. */
  isOver: boolean
}

/**
 * Calcola il riepilogo budget per una settimana.
 * @param budget  WeekBudget della settimana
 * @param sessions  Sessioni finite della settimana
 * @param purchases  Tutti gli acquisti delle sessioni
 */
export function computeBudgetSummary(
  budget: WeekBudget,
  sessions: Session[],
  purchases: Purchase[],
): BudgetSummary {
  const totalCents = budget.buoniCount * budget.buoniValueCents

  // Totale calcolato dagli acquisti, per sessione (fallback quando non confermato).
  const computedBySession = new Map<number, number>()
  for (const p of purchases) {
    computedBySession.set(
      p.sessionId,
      (computedBySession.get(p.sessionId) ?? 0) + p.priceCents * p.quantity,
    )
  }

  // Speso = per ogni sessione finita, l'importo confermato se presente, altrimenti
  // la somma calcolata dei suoi acquisti.
  const spentCents = sessions
    .filter((s) => s.finishedAt !== null && s.id !== undefined)
    .reduce(
      (acc, s) => acc + (s.confirmedTotalCents ?? computedBySession.get(s.id as number) ?? 0),
      0,
    )

  const remainingCents = totalCents - spentCents
  const isOver = remainingCents < 0
  const outOfPocketCents = isOver ? -remainingCents : 0

  return { totalCents, spentCents, remainingCents, outOfPocketCents, isOver }
}

/**
 * Come computeBudgetSummary ma include anche gli acquisti della sessione corrente
 * (non ancora finalizzata) — usato nella modalità spesa live.
 */
export function computeLiveBudgetSummary(
  budget: WeekBudget,
  allPurchases: Purchase[],
): BudgetSummary {
  const totalCents = budget.buoniCount * budget.buoniValueCents
  const spentCents = allPurchases.reduce((acc, p) => acc + p.priceCents * p.quantity, 0)
  const remainingCents = totalCents - spentCents
  const isOver = remainingCents < 0
  const outOfPocketCents = isOver ? -remainingCents : 0
  return { totalCents, spentCents, remainingCents, outOfPocketCents, isOver }
}
