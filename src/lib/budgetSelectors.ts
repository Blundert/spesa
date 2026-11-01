import type { Session, Purchase } from '../db/types'

/** Riepilogo di spesa di una settimana (recap, niente budget/rimanente). */
export interface WeekSpendSummary {
  /** Totale speso nelle spese finite (confirmedTotalCents ?? somma acquisti). */
  totalSpentCents: number
  /** Numero di buoni pasto usati nella settimana. */
  buoniSpentCount: number
  /** Valore coperto dai buoni (Σ buoniSpent × valore della sessione), in centesimi. */
  buoniCoveredCents: number
  /** Di tasca propria: max(0, totale − coperto dai buoni). */
  outOfPocketCents: number
  /** Buoni rimanenti: max(0, disponibili − usati). */
  buoniRemaining: number
}

export function weekSpendSummary(
  sessions: Session[],
  purchases: Purchase[],
  buoniAvailable: number,
): WeekSpendSummary {
  const computedBySession = new Map<number, number>()
  for (const p of purchases) {
    computedBySession.set(
      p.sessionId,
      (computedBySession.get(p.sessionId) ?? 0) + p.priceCents * p.quantity,
    )
  }

  let totalSpentCents = 0
  let buoniSpentCount = 0
  let buoniCoveredCents = 0
  for (const s of sessions) {
    if (s.finishedAt === null || s.id === undefined) continue
    totalSpentCents += s.confirmedTotalCents ?? computedBySession.get(s.id) ?? 0
    buoniSpentCount += s.buoniSpent
    buoniCoveredCents += s.buoniSpent * s.buoniValueCents
  }

  return {
    totalSpentCents,
    buoniSpentCount,
    buoniCoveredCents,
    outOfPocketCents: Math.max(0, totalSpentCents - buoniCoveredCents),
    buoniRemaining: Math.max(0, buoniAvailable - buoniSpentCount),
  }
}

/** Riepilogo live della spesa in corso. */
export interface LiveSpendSummary {
  spentCents: number
  outOfPocketCents: number
}

/** Di tasca propria per una spesa: max(0, totale − buoni × valore del buono). */
export function outOfPocketCents(totalCents: number, buoniSpent: number, buoniValueCents: number): number {
  return Math.max(0, totalCents - buoniSpent * buoniValueCents)
}

export function liveSpendSummary(
  activePurchases: Purchase[],
  buoniSpent: number,
  buoniValueCents: number,
): LiveSpendSummary {
  const spentCents = activePurchases.reduce((acc, p) => acc + p.priceCents * p.quantity, 0)
  return {
    spentCents,
    outOfPocketCents: outOfPocketCents(spentCents, buoniSpent, buoniValueCents),
  }
}

/**
 * Scarto percentuale dello scontrino confermato rispetto alla somma degli oggetti:
 * (confermato − calcolato) / calcolato, arrotondato a un decimale.
 * Positivo = scontrino più alto degli oggetti. null se la somma degli oggetti è 0.
 */
export function receiptDeviationPercent(confirmedCents: number, computedCents: number): number | null {
  if (computedCents <= 0) return null
  return Math.round(((confirmedCents - computedCents) / computedCents) * 1000) / 10
}
