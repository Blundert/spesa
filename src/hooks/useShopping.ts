import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import { getWeekBudget, setBuoniAvailable } from '../db/repositories/weekBudget'
import { getSessionsByWeek, createSession, finishSession } from '../db/repositories/sessions'
import {
  getPurchasesBySession,
  addPurchase,
  updatePurchasePrice,
  updatePurchaseQuantity,
  removePurchase,
} from '../db/repositories/purchases'
import { updateItemPrices } from '../db/repositories/items'
import { db } from '../db/db'
import type { Purchase } from '../db/types'

// ── Budget ──────────────────────────────────────────────────────────────────

export function useWeekBudget(isoWeek: string) {
  return useQuery({
    queryKey: qk.weekBudget(isoWeek),
    queryFn: () => getWeekBudget(isoWeek),
  })
}

export function useSetBuoniAvailable(isoWeek: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (buoniAvailable: number) => setBuoniAvailable(isoWeek, buoniAvailable),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.weekBudget(isoWeek) })
    },
  })
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export function useSessionsByWeek(isoWeek: string) {
  return useQuery({
    queryKey: qk.sessions(isoWeek),
    queryFn: () => getSessionsByWeek(isoWeek),
  })
}

export function useAllSessions() {
  return useQuery({
    queryKey: qk.allSessions(),
    queryFn: () => db.sessions.orderBy('startedAt').reverse().toArray(),
  })
}

export function useCreateSession(isoWeek: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      supermarketId,
      buoniSpent,
      buoniValueCents,
    }: {
      supermarketId: number
      buoniSpent: number
      buoniValueCents: number
    }) => createSession(isoWeek, supermarketId, buoniSpent, buoniValueCents),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.sessions(isoWeek) })
      void qc.invalidateQueries({ queryKey: qk.allSessions() })
    },
  })
}

export function useFinishSession(isoWeek: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      confirmedTotalCents,
    }: {
      sessionId: number
      confirmedTotalCents: number
    }) => finishSession(sessionId, confirmedTotalCents),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.sessions(isoWeek) })
      void qc.invalidateQueries({ queryKey: qk.allSessions() })
      void qc.invalidateQueries({ queryKey: qk.purchasesForWeek(isoWeek) })
    },
  })
}

// ── Purchases ────────────────────────────────────────────────────────────────

export function usePurchasesBySession(sessionId: number) {
  return useQuery({
    queryKey: qk.purchases(sessionId),
    queryFn: () => getPurchasesBySession(sessionId),
  })
}

interface AddPurchaseArgs {
  sessionId: number
  itemId: number
  /** Prezzo in centesimi. */
  priceCents: number
  /** Default 1. */
  quantity?: number
}

/**
 * Aggiunge un acquisto e aggiorna lastPriceCents/suggestedPriceCents sull'item.
 * Calcola la media mobile come suggestedPrice.
 */
export function useAddPurchase(isoWeek: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, itemId, priceCents, quantity = 1 }: AddPurchaseArgs) => {
      await addPurchase(sessionId, itemId, priceCents, quantity)

      // Aggiorna prezzi sull'item: media mobile sugli ultimi acquisti
      const allPurchases: Purchase[] = await db.purchases
        .where('itemId')
        .equals(itemId)
        .toArray()
      const avg = Math.round(
        allPurchases.reduce((acc, p) => acc + p.priceCents, 0) / allPurchases.length,
      )
      await updateItemPrices(itemId, priceCents, avg)
    },
    onSuccess: (_data, { sessionId, itemId }) => {
      void qc.invalidateQueries({ queryKey: qk.purchases(sessionId) })
      void qc.invalidateQueries({ queryKey: qk.sessions(isoWeek) })
      void qc.invalidateQueries({ queryKey: qk.items() })
      void qc.invalidateQueries({ queryKey: qk.priceHistory(itemId) })
    },
  })
}

export function useUpdatePurchase(sessionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      priceCents,
      quantity,
    }: {
      id: number
      priceCents?: number
      quantity?: number
    }) =>
      Promise.all([
        priceCents !== undefined ? updatePurchasePrice(id, priceCents) : Promise.resolve(),
        quantity !== undefined ? updatePurchaseQuantity(id, quantity) : Promise.resolve(),
      ]),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.purchases(sessionId) })
    },
  })
}

export function useRemovePurchase(sessionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const purchase = await db.purchases.get(id)
      await removePurchase(id)
      if (purchase) {
        const remaining = await db.purchases.where('itemId').equals(purchase.itemId).toArray()
        if (remaining.length === 0) {
          await db.items.update(purchase.itemId, { lastPriceCents: null, suggestedPriceCents: null })
        } else {
          const avg = Math.round(remaining.reduce((a, p) => a + p.priceCents, 0) / remaining.length)
          const last = remaining[remaining.length - 1].priceCents
          await updateItemPrices(purchase.itemId, last, avg)
        }
      }
      return purchase?.itemId
    },
    onSuccess: (itemId) => {
      void qc.invalidateQueries({ queryKey: qk.purchases(sessionId) })
      void qc.invalidateQueries({ queryKey: qk.items() })
      if (itemId !== undefined) {
        void qc.invalidateQueries({ queryKey: qk.priceHistory(itemId) })
      }
    },
  })
}
