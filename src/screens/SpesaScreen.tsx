import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { db } from '../db/db'
import { qk } from '../db/queryKeys'
import { toast } from 'sonner'
import { currentISOWeek } from '../lib/date'
import { formatCentsPlain } from '../lib/money'
import { computeLiveBudgetSummary } from '../lib/budgetSelectors'
import {
  useWeekBudget,
  useSessionsByWeek,
  usePurchasesBySession,
  useCreateSession,
  useFinishSession,
  useAddPurchase,
} from '../hooks/useShopping'
import { useListItems, useClearList } from '../hooks/useListItems'
import { useSupermarkets, useCategories, useItems } from '../hooks/useItems'
import { PriceKeypad } from '../components/PriceKeypad'
import { BottomSheet } from '../components/BottomSheet'

const isoWeek = currentISOWeek()

export function SpesaScreen() {
  const navigate = useNavigate()
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [priceTarget, setPriceTarget] = useState<{ itemId: number; name: string } | null>(null)
  const [newItemTarget, setNewItemTarget] = useState<{ name: string } | null>(null)
  const [showStorePicker, setShowStorePicker] = useState(false)
  const [showNewItem, setShowNewItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)

  const { data: budget } = useWeekBudget(isoWeek)
  const { data: sessions = [] } = useSessionsByWeek(isoWeek)
  const { data: supermarkets = [] } = useSupermarkets()
  const { data: listItems = [] } = useListItems()
  const { data: categories = [] } = useCategories()
  const { data: items = [] } = useItems()
  const catMap = Object.fromEntries(categories.map((c) => [c.id ?? 0, c.name]))
  const itemNameMap = Object.fromEntries(items.map((it) => [it.id ?? 0, it.name]))

  // Usa la sessione più recente non finita, o quella attiva manualmente
  const activeSession =
    sessions.find((s) => s.id === activeSessionId && s.finishedAt === null) ??
    sessions.find((s) => s.finishedAt === null) ??
    null

  const { data: purchases = [] } = usePurchasesBySession(activeSession?.id ?? 0)

  const createSession = useCreateSession(isoWeek)
  const finishSession = useFinishSession(isoWeek)
  const addPurchase = useAddPurchase(isoWeek)
  const clearList = useClearList()
  const qc = useQueryClient()

  const summary = budget
    ? computeLiveBudgetSummary(budget, purchases)
    : { totalCents: 0, spentCents: 0, remainingCents: 0, outOfPocketCents: 0, isOver: false }

  const supermarketName = activeSession
    ? (supermarkets.find((s) => s.id === activeSession.supermarketId)?.name ?? '?')
    : '—'

  // Auto-open store picker if active session has no valid supermarket
  useEffect(() => {
    if (activeSession && supermarketName === '?' && supermarkets.length > 0) {
      setShowStorePicker(true)
    }
  }, [activeSession, supermarketName, supermarkets.length])

  const handleStartSession = useCallback(
    async (supermarketId: number) => {
      const id = await createSession.mutateAsync(supermarketId)
      setActiveSessionId(id)
      setShowStorePicker(false)
    },
    [createSession],
  )

  const handleConfirmPrice = useCallback(
    async (cents: number) => {
      if (!activeSession?.id) return
      if (priceTarget) {
        await addPurchase.mutateAsync({
          sessionId: activeSession.id,
          itemId: priceTarget.itemId,
          priceCents: cents,
        })
        const rem = summary.remainingCents - cents
        const sub =
          rem < 0
            ? `Da pagare a parte €${formatCentsPlain(-rem)}`
            : `Rimanente €${formatCentsPlain(rem)}`
        toast(priceTarget.name + ' aggiunto', { description: sub })
        setPriceTarget(null)
      } else if (newItemTarget) {
        // Item fuori lista: nome già inserito
        const { upsertItem } = await import('../db/repositories/items')
        const { getCategories } = await import('../db/repositories/categories')
        const categories = await getCategories()
        const altroCategory = categories.find((c) => c.name === 'Altro')
        const itemId = await upsertItem(newItemTarget.name, altroCategory?.id ?? 0, cents)
        await addPurchase.mutateAsync({ sessionId: activeSession.id, itemId, priceCents: cents })
        toast(newItemTarget.name + ' aggiunto', { description: `€${formatCentsPlain(cents)}` })
        setNewItemTarget(null)
        setNewItemName('')
      }
    },
    [activeSession, priceTarget, newItemTarget, addPurchase, summary.remainingCents],
  )

  const handleChangeStore = useCallback(
    async (supermarketId: number) => {
      if (!activeSession?.id) {
        await handleStartSession(supermarketId)
        return
      }
      await db.sessions.update(activeSession.id, { supermarketId })
      void qc.invalidateQueries({ queryKey: qk.sessions(isoWeek) })
      setShowStorePicker(false)
    },
    [activeSession, handleStartSession, qc],
  )

  const handleFinish = useCallback(() => {
    if (!activeSession?.id) return
    setShowFinishConfirm(true)
  }, [activeSession])

  const handleConfirmFinish = useCallback(
    async (cents: number) => {
      if (!activeSession?.id) return
      await finishSession.mutateAsync({ sessionId: activeSession.id, confirmedTotalCents: cents })
      await clearList.mutateAsync()
      toast('Spesa salvata', {
        description: `${supermarketName} · €${formatCentsPlain(cents)}`,
      })
      void navigate({ to: '/storico' })
    },
    [activeSession, finishSession, clearList, navigate, supermarketName],
  )

  // Divide lista in da prendere / nel carrello
  const purchasedItemIds = new Set(purchases.map((p) => p.itemId))
  const todoItems = listItems.filter((li) => !purchasedItemIds.has(li.itemId))
  const doneItems = purchases.map((p) => ({
    ...p,
    name:
      itemNameMap[p.itemId] ??
      listItems.find((li) => li.itemId === p.itemId)?.itemName ??
      `item ${p.itemId}`,
  }))

  // Raggruppa todo per categoria
  const todoByCategory = todoItems.reduce<Record<string, typeof todoItems>>((acc, li) => {
    const cat = li.itemCategoryId.toString()
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(li)
    return acc
  }, {})

  if (!activeSession) {
    return (
      <div className="flex flex-col h-full bg-[#F2F2F0]">
        {/* Status bar placeholder */}
        <div className="h-[54px] flex-none" />
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <h1 className="text-[26px] font-normal text-[#2A2A2C] tracking-tight">Inizia la spesa</h1>
          <p className="text-sm text-[#9B9B9F] text-center">Scegli un supermercato per iniziare.</p>
          <button
            onClick={() => setShowStorePicker(true)}
            className="bg-[#2A2A2C] text-white text-[17px] font-normal py-[18px] px-8 rounded-[22px] w-full max-w-xs active:scale-[.98] transition-transform flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
              <path d="M2 3h2.5l2.2 12.5a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.2L21 7H5.2" />
            </svg>
            Scegli supermercato
          </button>
          <button onClick={() => void navigate({ to: '/' })} className="text-[#9B9B9F] text-sm mt-2">
            ← Torna alla settimana
          </button>
        </div>

        {/* Store picker */}
        <StorePickerSheet
          open={showStorePicker}
          onClose={() => setShowStorePicker(false)}
          supermarkets={supermarkets}
          currentId={null}
          onPick={handleStartSession}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#F2F2F0]">
      {/* Status bar */}
      <div className="h-[54px] flex-none" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-2 flex-none">
        <button onClick={() => void navigate({ to: '/' })} className="w-[34px] h-[34px] -ml-1.5 flex items-center justify-center active:opacity-50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button onClick={() => setShowStorePicker(true)} className="flex items-center gap-1.5 px-[14px] py-[7px] bg-white rounded-full active:bg-[#EDEDEB]">
          <span className="text-[15px] text-[#2A2A2C]">{supermarketName}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B9B9F" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <button onClick={handleFinish} className="px-1 py-[7px] active:opacity-50">
          <span className="text-[15px] text-[#2A2A2C]">Fine</span>
        </button>
      </div>

      {/* Hero budget */}
      <div className="px-5 pb-4 flex-none">
        {summary.isOver ? (
          <div className="bg-[#2A2A2C] rounded-[28px] p-[26px] mb-[22px]">
            <div className="text-[12px] font-normal tracking-[1.6px] text-white/55 uppercase mb-3">Da pagare a parte</div>
            <div className="flex items-baseline text-white">
              <span className="text-[36px] font-normal opacity-55 mr-1">€</span>
              <span className="text-[76px] font-light leading-[.92] tabular-nums tracking-[-2px]">
                {formatCentsPlain(summary.outOfPocketCents)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-[22px]">
            <div className="text-[12px] font-normal tracking-[1.6px] text-[#9B9B9F] uppercase mb-[14px]">Rimanente</div>
            <div className="flex items-baseline justify-center text-[#2A2A2C]">
              <span className="text-[38px] font-normal text-[#B5B5BA] mr-1">€</span>
              <span className="text-[88px] font-light leading-[.92] tabular-nums tracking-[-2.5px]">
                {formatCentsPlain(summary.remainingCents)}
              </span>
            </div>
          </div>
        )}
        <div className="flex justify-center gap-0 text-[#9B9B9F] text-[13px]">
          <span className="tabular-nums">€{formatCentsPlain(summary.spentCents)} spesi</span>
          <span className="mx-[10px] opacity-50">·</span>
          <span className="tabular-nums">{doneItems.length} oggetti nel carrello</span>
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto px-5 pb-[150px]">
        {/* Da prendere */}
        {Object.entries(todoByCategory).map(([_catId, items]) => (
          <div key={_catId} className="mb-4">
            <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1.5 pb-[13px]">
              {catMap[items[0]?.itemCategoryId ?? 0] ?? 'Altro'}
            </div>
            <div className="bg-white rounded-[20px] overflow-hidden">
              {items.map((li, i) => (
                <button
                  key={li.id}
                  onClick={() => setPriceTarget({ itemId: li.itemId, name: li.itemName })}
                  className="w-full flex items-center gap-[13px] px-[18px] py-[17px] active:bg-[#F6F6F4] transition-colors text-left"
                  style={{ borderBottom: i < items.length - 1 ? '1px solid #ECECEC' : 'none' }}
                >
                  <div className="w-6 h-6 flex-none rounded-full border-2 border-[#D8D8D6]" />
                  <div className="flex-1 text-base text-[#2A2A2C]">{li.itemName}</div>
                  {li.suggestedPriceCents !== null && (
                    <span className="text-sm text-[#B5B5BA] tabular-nums">
                      circa €{formatCentsPlain(li.suggestedPriceCents)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Nel carrello */}
        {doneItems.length > 0 && (
          <div className="mt-1.5">
            <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1.5 pb-[13px]">
              Nel carrello
            </div>
            <div className="bg-white rounded-[20px] overflow-hidden">
              {doneItems.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() =>
                    setPriceTarget({ itemId: p.itemId, name: p.name })
                  }
                  className="w-full flex items-center gap-[13px] px-[18px] py-4 active:bg-[#F6F6F4] transition-colors text-left"
                  style={{ borderBottom: i < doneItems.length - 1 ? '1px solid #ECECEC' : 'none' }}
                >
                  <div className="w-6 h-6 flex-none rounded-full bg-[#2A2A2C] flex items-center justify-center">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l4 4 10-10" />
                    </svg>
                  </div>
                  <div className="flex-1 opacity-50 text-base text-[#2A2A2C]">{p.name}</div>
                  <span className="text-[15px] text-[#2A2A2C] font-normal tabular-nums">
                    €{formatCentsPlain(p.priceCents)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB Aggiungi fuori lista */}
      <button
        onClick={() => setShowNewItem(true)}
        className="absolute bottom-[30px] left-1/2 -translate-x-1/2 z-[24] flex items-center gap-2 bg-[#2A2A2C] text-white px-[22px] py-[14px] rounded-full text-[15px] font-normal shadow-[0_10px_30px_rgba(0,0,0,.3)] active:-translate-x-1/2 active:scale-[.96] transition-transform"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Aggiungi fuori lista
      </button>

      {/* Store picker */}
      <StorePickerSheet
        open={showStorePicker}
        onClose={() => setShowStorePicker(false)}
        supermarkets={supermarkets}
        currentId={activeSession.supermarketId}
        onPick={handleChangeStore}
      />

      {/* Price keypad — da lista */}
      <PriceKeypad
        open={priceTarget !== null}
        onClose={() => setPriceTarget(null)}
        label={priceTarget?.name ?? ''}
        confirmLabel="Aggiungi al carrello"
        onConfirm={handleConfirmPrice}
      />

      {/* New item fuori lista */}
      <BottomSheet open={showNewItem} onClose={() => setShowNewItem(false)}>
        <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-[6px]">Oggetto fuori lista</div>
        <input
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Nome oggetto"
          autoFocus
          className="w-full border-0 border-b border-[#ECECEC] outline-none bg-transparent px-0.5 py-3 text-[18px] text-[#2A2A2C] mb-2"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newItemName.trim()) {
              setNewItemTarget({ name: newItemName.trim() })
              setShowNewItem(false)
            }
          }}
        />
        <button
          onClick={() => {
            if (!newItemName.trim()) return
            setNewItemTarget({ name: newItemName.trim() })
            setShowNewItem(false)
          }}
          className="mt-3 w-full bg-[#2A2A2C] text-white text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          Continua
        </button>
      </BottomSheet>

      {/* Price keypad — fuori lista */}
      <PriceKeypad
        open={newItemTarget !== null}
        onClose={() => setNewItemTarget(null)}
        label={newItemTarget?.name ?? ''}
        confirmLabel="Aggiungi al carrello"
        onConfirm={handleConfirmPrice}
      />

      {/* Conferma importo a fine spesa — pre-compilato col totale calcolato,
          modificabile. Lo swipe-down annulla senza chiudere la spesa. */}
      <PriceKeypad
        open={showFinishConfirm}
        onClose={() => setShowFinishConfirm(false)}
        label="Quanto hai speso?"
        confirmLabel="Conferma spesa"
        initialCents={summary.spentCents}
        onConfirm={handleConfirmFinish}
      />
    </div>
  )
}


interface StorePickerSheetProps {
  open: boolean
  onClose: () => void
  supermarkets: Array<{ id?: number; name: string }>
  currentId: number | null
  onPick: (id: number) => void
}

function StorePickerSheet({ open, onClose, supermarkets, currentId, onPick }: StorePickerSheetProps) {
  const [newName, setNewName] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-[14px]">Scegli supermercato</div>
      <div className="flex flex-col gap-0.5 pb-2">
        {supermarkets.map((s) => (
          <button
            key={s.id}
            onClick={() => s.id !== undefined && onPick(s.id)}
            className="flex items-center justify-between px-1.5 py-[15px] border-b border-[#ECECEC] active:opacity-50 text-left"
          >
            <span className={`text-[17px] text-[#2A2A2C] ${s.id === currentId ? 'font-semibold' : 'font-normal'}`}>
              {s.name}
            </span>
            {s.id === currentId && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l4 4 10-10" />
              </svg>
            )}
          </button>
        ))}
      </div>
      {showAdd ? (
        <div className="mt-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome supermercato"
            autoFocus
            className="w-full border-b border-[#ECECEC] outline-none bg-transparent px-0.5 py-3 text-[18px] text-[#2A2A2C] mb-3"
          />
          <button
            onClick={async () => {
              if (!newName.trim()) return
              const { upsertSupermarket } = await import('../db/repositories/supermarkets')
              const id = await upsertSupermarket(newName.trim())
              onPick(id)
              setNewName('')
              setShowAdd(false)
            }}
            className="w-full bg-[#2A2A2C] text-white py-[15px] rounded-2xl text-[16px] active:scale-[.98] transition-transform"
          >
            Aggiungi e seleziona
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-2 w-full border border-[#E0E0DE] bg-white text-[#2A2A2C] text-[16px] py-[15px] rounded-2xl active:bg-[#F6F6F4]"
        >
          + Aggiungi supermercato
        </button>
      )}
    </BottomSheet>
  )
}
