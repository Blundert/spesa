import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Modal } from './Modal'
import { BuoniSteppers } from '../../components/BuoniSheet'
import { ListPickerRow } from '../../components/ListPickerRow'
import { db } from '../../db/db'
import { qk } from '../../db/queryKeys'
import { currentWeek, formatWeekLabelWithYear } from '../../lib/date'
import { formatCents, formatCentsPlain } from '../../lib/money'
import { weekSpendSummary } from '../../lib/budgetSelectors'
import { getDefaultBuonoValueCents } from '../../lib/buoniSettings'
import { activeLists } from '../../lib/activeList'
import { useWeekBudget, useSessionsByWeek, useCreateSession } from '../../hooks/useShopping'
import { useSupermarkets } from '../../hooks/useItems'
import { useActiveList } from '../../hooks/useShoppingLists'

const isoWeek = currentWeek()

function usePurchasesForWeek() {
  return useQuery({
    queryKey: qk.purchasesForWeek(isoWeek),
    queryFn: async () => {
      const sessions = await db.sessions.where('isoWeek').equals(isoWeek).toArray()
      if (!sessions.length) return []
      const all = await Promise.all(sessions.map((s) => db.purchases.where('sessionId').equals(s.id as number).toArray()))
      return all.flat()
    },
  })
}

/** Pulsante "Inizia la spesa" + riepilogo settimana per la sidebar; apre il dialogo di nuova spesa. */
export function NewShoppingButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [newBuoni, setNewBuoni] = useState(0)
  const [newVal, setNewVal] = useState(getDefaultBuonoValueCents)
  const [newListId, setNewListId] = useState<number | undefined>(undefined)

  const { data: budget } = useWeekBudget(isoWeek)
  const { data: sessions = [] } = useSessionsByWeek(isoWeek)
  const { data: purchases = [] } = usePurchasesForWeek()
  const { lists, list } = useActiveList()
  const { data: supermarkets = [] } = useSupermarkets()
  const supermarketNames = Object.fromEntries(supermarkets.map((s) => [s.id ?? 0, s.name]))
  const createSession = useCreateSession(isoWeek)
  const summary = weekSpendSummary(sessions, purchases, budget?.buoniAvailable ?? 0)

  // Buoni pre-compilati coi rimanenti, valore di default, lista attiva.
  const openModal = () => {
    setNewBuoni(summary.buoniRemaining)
    setNewVal(getDefaultBuonoValueCents())
    setNewListId(list?.id)
    setOpen(true)
  }

  const startShopping = async () => {
    setOpen(false)
    const chosen = lists.find((l) => l.id === newListId) ?? list
    const listId = chosen?.id
    // Lista con supermercato: la spesa parte subito lì (se non ce n'è già una in corso).
    const storeId = chosen?.supermarketId
    if (
      listId !== undefined &&
      storeId != null &&
      supermarkets.some((s) => s.id === storeId) &&
      !sessions.some((s) => s.finishedAt === null)
    ) {
      await createSession.mutateAsync({ supermarketId: storeId, buoniSpent: newBuoni, buoniValueCents: newVal, listId })
    }
    void navigate({ to: '/spesa', search: { buoni: newBuoni, val: newVal, list: listId } })
  }

  const muted = { fontSize: '12px', color: '#9B9B9F' } as const

  return (
    <div style={{ padding: '16px 12px 4px' }}>
      <button
        onClick={openModal}
        style={{
          width: '100%',
          border: 'none',
          borderRadius: '12px',
          background: '#2A2A2C',
          color: '#fff',
          padding: '12px 14px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        {t('nav.startShopping')}
      </button>
      <div style={{ padding: '12px 4px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', color: '#2A2A2C' }}>
          <span style={{ fontSize: '14px', color: '#B5B5BA', marginRight: '2px' }}>€</span>
          <span style={{ fontSize: '22px', fontVariantNumeric: 'tabular-nums' }}>{formatCentsPlain(summary.outOfPocketCents)}</span>
        </div>
        <div style={muted}>{t('home.outOfPocket')}</div>
        <div style={{ ...muted, marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
          € {formatCents(summary.totalSpentCents)} {t('common.spentWord')} · {summary.buoniSpentCount} {t('common.buoni')}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} width={440}>
        <div style={{ ...muted, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
          {t('budget.thisWeek')} · {formatWeekLabelWithYear(isoWeek)}
        </div>
        <div style={{ background: '#2A2A2C', borderRadius: '16px', padding: '16px 20px', marginBottom: '8px', color: '#fff' }}>
          <div style={{ fontSize: '11px', letterSpacing: '1.2px', textTransform: 'uppercase', opacity: 0.55 }}>
            {t('home.outOfPocket')}
          </div>
          <div style={{ fontSize: '30px', fontWeight: 300, fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
            {formatCents(summary.outOfPocketCents)}
          </div>
        </div>
        <div style={{ ...muted, fontSize: '13px', marginBottom: '22px', fontVariantNumeric: 'tabular-nums' }}>
          € {formatCents(summary.totalSpentCents)} {t('common.spentWord')} · {summary.buoniSpentCount} {t('common.buoni')}
        </div>

        <div style={{ ...muted, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
          {t('spesa.newTitle')}
        </div>
        <BuoniSteppers
          buoni={newBuoni}
          valueCents={newVal}
          onBuoni={setNewBuoni}
          onValue={setNewVal}
          top={
            <ListPickerRow
              lists={activeLists(lists)}
              value={newListId}
              onChange={setNewListId}
              supermarketNames={supermarketNames}
            />
          }
        />
        <button
          onClick={() => void startShopping()}
          style={{ width: '100%', border: 'none', borderRadius: '12px', background: '#2A2A2C', color: '#fff', padding: '14px', fontSize: '15px', cursor: 'pointer' }}
        >
          {t('nav.startShopping')}
        </button>
      </Modal>
    </div>
  )
}
