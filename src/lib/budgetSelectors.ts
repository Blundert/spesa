import type { WeekBudget, Session, Purchase } from '../db/types'

export interface BudgetSummary {
  /** Budget totale in centesimi (buoniCount × buoniValueCents). */
  totalCents: number
  /** Quanto già speso nelle sessioni finite della settimana, in centesimi. */
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

  const finishedIds = new Set(
    sessions.filter((s) => s.finishedAt !== null).map((s) => s.id as number),
  )
  const spentCents = purchases
    .filter((p) => finishedIds.has(p.sessionId))
    .reduce((acc, p) => acc + p.priceCents * p.quantity, 0)

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
